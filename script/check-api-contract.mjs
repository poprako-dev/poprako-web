// @ts-nocheck -- the checker walks the TypeScript compiler API over untyped JSON Schema.
import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const swaggerPath = resolve(root, "docs/swagger.json");
const remoteSwagger =
  "https://raw.githubusercontent.com/poprako-dev/poprako-server/main/docs/swagger.json";
// utoipa renders `[u8; 32]` as an array even though serde emits a base64 string.
const HASH_FIELDS = new Set(["image_hash"]);
const DEPTH = 3;
const METHODS = ["get", "post", "put", "patch", "delete"];

async function loadSwagger(useRemote, overridePath) {
  if (overridePath) return JSON.parse(await readFile(resolve(overridePath), "utf8"));
  if (!useRemote) return JSON.parse(await readFile(swaggerPath, "utf8"));
  const response = await fetch(remoteSwagger);
  if (!response.ok) throw new Error(`cannot fetch server contract: ${String(response.status)}`);
  return JSON.parse(await response.text());
}

function buildProgram() {
  const config = ts.getParsedCommandLineOfConfigFile(
    resolve(root, "tsconfig.app.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  return ts.createProgram(config.fileNames, { ...config.options });
}

function normalizePath(path) {
  const trimmed = path
    .replace(/\{[^}]+\}/gu, ":")
    .replace(/^\/api\/v1/u, "")
    .replace(/\/+$/u, "");
  return trimmed || "/";
}

function toSnake(key) {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .toLowerCase();
}

function resolveRef(swagger, node) {
  let current = node;
  let guard = 0;
  while (current?.$ref && guard < 10) {
    current = current.$ref
      .replace(/^#\//u, "")
      .split("/")
      .reduce((value, key) => value?.[key], swagger);
    guard += 1;
  }
  return current;
}

function schemaKind(swagger, node) {
  let current = resolveRef(swagger, node);
  if (!current) return { kind: "unknown", node: null };
  if (current.allOf?.length === 1) current = resolveRef(swagger, current.allOf[0]);
  for (const key of ["anyOf", "oneOf"]) {
    if (!current[key]) continue;
    const members = current[key].filter((item) => resolveRef(swagger, item)?.type !== "null");
    if (members.length === 1) current = resolveRef(swagger, members[0]);
  }
  let kind = current.type ?? (current.properties ? "object" : current.items ? "array" : "unknown");
  if (Array.isArray(kind)) {
    const members = kind.filter((item) => item !== "null");
    if (members.length === 1) kind = members[0];
  }
  return { kind: kind === "integer" ? "number" : kind, node: current };
}

function schemaObject(swagger, node) {
  const { kind, node: current } = schemaKind(swagger, node);
  if (kind === "array") return schemaObject(swagger, current.items);
  if (kind !== "object" || !current.properties) return null;
  return { props: current.properties, required: new Set(current.required ?? []) };
}

function isArrayType(checker, type) {
  const name = type.getSymbol()?.getName();
  return Boolean(checker.isTupleType(type)) || name === "Array" || name === "ReadonlyArray";
}

function typeKind(checker, type) {
  let current = type;
  if (current.isUnion()) {
    const members = current.types.filter(
      (member) =>
        !(member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)),
    );
    if (members.length === 1) current = members[0];
    else {
      const kinds = new Set(members.map((member) => typeKind(checker, member).kind));
      return { kind: kinds.size === 1 ? [...kinds][0] : "union", type: current };
    }
  }
  if (current.flags & ts.TypeFlags.StringLike) return { kind: "string", type: current };
  if (current.flags & ts.TypeFlags.NumberLike) return { kind: "number", type: current };
  if (current.flags & ts.TypeFlags.BooleanLike) return { kind: "boolean", type: current };
  if (isArrayType(checker, current)) return { kind: "array", type: current };
  if (current.flags & ts.TypeFlags.Object) return { kind: "object", type: current };
  return { kind: "other", type: current };
}

function typeProps(checker, type) {
  const { kind, type: current } = typeKind(checker, type);
  if (kind === "array") {
    const element = checker.getTypeArguments(current)[0];
    return element ? typeProps(checker, element) : null;
  }
  if (kind !== "object") return null;
  const properties = checker.getPropertiesOfType(current);
  if (properties.length === 0) return null;
  return new Map(
    properties.map((property) => [
      property.name,
      checker.getTypeOfSymbolAtLocation(
        property,
        property.valueDeclaration ?? property.declarations?.[0] ?? property,
      ),
    ]),
  );
}

function readCall(node, checker, file) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return null;
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  if (!ts.isIdentifier(receiver) || receiver.text !== "client") return null;
  if (!METHODS.includes(method)) return null;
  const path = readPath(node.arguments[0]);
  if (!path) return null;
  const typeArgument = node.typeArguments?.[0];
  const body = node.arguments[1];
  const options = method === "get" || method === "delete" ? node.arguments[1] : node.arguments[2];
  return {
    file: relative(root, file.fileName),
    line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
    method: method.toUpperCase(),
    path: normalizePath(path),
    request: body ? typeProps(checker, checker.getTypeAtLocation(body)) : null,
    response: typeArgument ? typeProps(checker, checker.getTypeFromTypeNode(typeArgument)) : null,
    query: readQuery(checker, options),
  };
}

function readQuery(checker, node) {
  if (!node) return null;
  const optionsType = checker.getTypeAtLocation(node);
  const query = optionsType.getProperty("query");
  if (!query) return null;
  const type = checker.getTypeOfSymbolAtLocation(
    query,
    query.valueDeclaration ?? query.declarations?.[0] ?? query,
  );
  return typeProps(checker, type);
}

function readPath(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return null;
  return node.head.text + node.templateSpans.map((span) => ":" + span.literal.text).join("");
}

function collectCalls(program, checker) {
  const calls = [];
  for (const file of program.getSourceFiles()) {
    if (!file.fileName.includes("/src/api/") || file.fileName.endsWith(".test.ts")) continue;
    const visit = (node) => {
      const call = readCall(node, checker, file);
      if (call) calls.push(call);
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return calls;
}

function buildOperations(swagger) {
  const operations = new Map();
  for (const [path, item] of Object.entries(swagger.paths)) {
    for (const method of METHODS) {
      const operation = item[method];
      if (!operation) continue;
      operations.set(`${method.toUpperCase()} ${normalizePath(path)}`, {
        request: requestSchema(swagger, operation),
        response: responseSchema(swagger, operation),
        query: (operation.parameters ?? []).filter((parameter) => parameter.in === "query"),
      });
    }
  }
  return operations;
}

function requestSchema(swagger, operation) {
  const schema = operation.requestBody?.content?.["application/json"]?.schema;
  return schema ? schemaObject(swagger, schema) : null;
}

function responseSchema(swagger, operation) {
  let schema =
    operation.responses?.["200"]?.content?.["application/json"]?.schema ??
    operation.responses?.["201"]?.content?.["application/json"]?.schema;
  if (!schema) return null;
  const resolved = resolveRef(swagger, schema);
  if (resolved?.properties?.data) schema = resolved.properties.data;
  return schemaObject(swagger, schema);
}

function report(findings, call, rule, message) {
  findings.push({ file: call.file, line: call.line, rule, message });
}

function compareProps(swagger, checker, call, level, server, web, prefix, depth, findings) {
  if (!server || !web) return;
  const webProps = new Map([...web].map(([name, type]) => [toSnake(name), { name, type }]));
  checkMissingFields(call, level, server, webProps, prefix, findings);
  checkUnknownFields(call, level, server, webProps, prefix, findings);
  if (depth === 0) return;
  for (const [name, schema] of Object.entries(server.props)) {
    const entry = webProps.get(name);
    if (!entry || HASH_FIELDS.has(name)) continue;
    compareField(
      swagger,
      checker,
      call,
      level,
      schema,
      entry.type,
      `${prefix}${name}`,
      depth,
      findings,
    );
  }
}

function checkMissingFields(call, level, server, webProps, prefix, findings) {
  if (level !== "request") return;
  for (const name of Object.keys(server.props)) {
    if (webProps.has(name) || !server.required.has(name)) continue;
    report(
      findings,
      call,
      "CONTRACT002",
      `${call.method} ${call.path} must send '${prefix}${name}'`,
    );
  }
}

function checkUnknownFields(call, level, server, webProps, prefix, findings) {
  for (const name of webProps.keys()) {
    if (name in server.props) continue;
    const rule = level === "request" ? "CONTRACT003" : "CONTRACT004";
    const verb = level === "request" ? "sends unknown field" : "reads field the server never sends";
    report(findings, call, rule, `${call.method} ${call.path} ${verb} '${prefix}${name}'`);
  }
}

function compareField(swagger, checker, call, level, schema, webType, label, depth, findings) {
  const serverKind = schemaKind(swagger, schema);
  const clientKind = typeKind(checker, webType);
  if (serverKind.kind === "unknown" || clientKind.kind === "union") return;
  if (serverKind.kind !== clientKind.kind) {
    report(
      findings,
      call,
      "CONTRACT005",
      `${call.method} ${call.path} '${label}': server=${serverKind.kind} web=${clientKind.kind}`,
    );
    return;
  }
  if (serverKind.kind !== "object" && serverKind.kind !== "array") return;
  compareProps(
    swagger,
    checker,
    call,
    level,
    schemaObject(swagger, schema),
    typeProps(checker, webType),
    `${label}.`,
    depth - 1,
    findings,
  );
}

function compareQuery(call, operation, findings) {
  const sent = new Set();
  for (const name of call.query?.keys() ?? []) sent.add(toSnake(name));
  for (const parameter of operation.query) {
    if (!parameter.required) continue;
    if (!sent.has(parameter.name)) {
      report(
        findings,
        call,
        "CONTRACT006",
        `${call.method} ${call.path} must send query '${parameter.name}'`,
      );
    }
  }
}

function checkApiContract(swagger) {
  const program = buildProgram();
  const checker = program.getTypeChecker();
  const operations = buildOperations(swagger);
  const findings = [];
  for (const call of collectCalls(program, checker)) {
    const operation = operations.get(`${call.method} ${call.path}`);
    if (!operation) {
      report(
        findings,
        call,
        "CONTRACT001",
        `${call.method} ${call.path} is not published by the server`,
      );
      continue;
    }
    compareProps(
      swagger,
      checker,
      call,
      "request",
      operation.request,
      call.request,
      "",
      DEPTH,
      findings,
    );
    compareProps(
      swagger,
      checker,
      call,
      "response",
      operation.response,
      call.response,
      "",
      DEPTH,
      findings,
    );
    compareQuery(call, operation, findings);
  }
  return findings;
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a path`);
  return value;
}

async function run(argv) {
  const flags = new Set(argv);
  const override = readOption(argv, "--swagger");
  const swagger = await loadSwagger(flags.has("--remote"), override);
  if (flags.has("--write")) {
    await writeFile(swaggerPath, `${JSON.stringify(swagger, null, 2)}\n`);
    console.log(`updated ${relative(root, swaggerPath)}`);
    return 0;
  }
  const findings = checkApiContract(swagger);
  for (const finding of findings) {
    console.error(`${finding.file}:${String(finding.line)} ${finding.rule}: ${finding.message}`);
  }
  console.log(
    findings.length === 0
      ? "API contract: every frontend call matches the server contract."
      : `API contract: ${String(findings.length)} mismatch(es).`,
  );
  return findings.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2));
}
