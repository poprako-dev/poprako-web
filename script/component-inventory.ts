import ts from "typescript";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

type PropEntry = {
  name: string;
  type: string;
  optional: boolean;
  declarations: string[];
};

type CallerEntry = {
  file: string;
  line: number;
  tag: string;
  providedProps: string[];
  hasSpread: boolean;
};

type ComponentEntry = {
  file: string;
  name: string;
  parameterType: string | null;
  props: PropEntry[];
  callers: CallerEntry[];
  ownerPlan: string;
  manualOwnerReport: string;
  reviewStatus: "needs-manual-review";
};

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const artifactPath = resolve(
  repositoryRoot,
  "docs/route-migration/review/component-inventory.json",
);
const manualReportByPlan: Record<string, string> = {
  R002a: "session-interface-review.md",
  R002b: "detail-interface-review.md",
  R002c: "translator-interface-review.md",
  R002d: "leaf-interface-review.md",
  R003: "session-interface-review.md",
  R004: "detail-interface-review.md",
  R005: "leaf-interface-review.md",
  R006: "translator-interface-review.md",
  R007: "shared-interface-review.md",
};

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sourceRelative(path: string): string {
  return relative(repositoryRoot, path).split(sep).join("/");
}

function includesJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return true;
  }
  let found = false;
  ts.forEachChild(node, (child) => {
    if (!found && includesJsx(child)) found = true;
  });
  return found;
}

function componentOwner(file: string): string {
  if (file.includes("/shared/")) return "R007";
  if (file.includes("/translator/")) return "R006";
  if (file.includes("/business/identity/")) return "R002a";
  if (file.includes("/business/chapter/") || file.includes("/business/comic/")) return "R002b";
  if (file.includes("/business/terminology/") || file.includes("/business/term/")) return "R002c";
  if (file.includes("/business/mail/") || file.includes("/business/comment/")) {
    return "R002d";
  }
  if (
    file.includes("/(workspace)/") ||
    file.includes("/(comic-playground)/") ||
    file.includes("/comic-detail/")
  ) {
    return "R004";
  }
  if (
    file.includes("/settings/") ||
    file.includes("/(member-list)/") ||
    file.includes("/(system-mail)/") ||
    file.includes("/login/")
  ) {
    return "R005";
  }
  if (file.includes("/translator/")) return "R006";
  if (file.includes("/route/business/")) return "R003";
  return "R003";
}

function isComponentName(name: ts.Node | undefined): name is ts.Identifier {
  return Boolean(name && ts.isIdentifier(name) && /^[A-Z]/u.test(name.text));
}

function componentDeclarations(source: ts.SourceFile): {
  name: string;
  nameNode: ts.Identifier;
  declaration: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;
}[] {
  const result: {
    name: string;
    nameNode: ts.Identifier;
    declaration: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression;
  }[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isFunctionDeclaration(node) &&
      isComponentName(node.name) &&
      node.body &&
      includesJsx(node.body)
    ) {
      result.push({
        name: node.name.text,
        nameNode: node.name,
        declaration: node,
      });
    }
    if (ts.isVariableDeclaration(node) && isComponentName(node.name) && node.initializer) {
      const initializer = node.initializer;
      const functionLike = ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
      if (functionLike && includesJsx(initializer)) {
        result.push({
          name: node.name.text,
          nameNode: node.name,
          declaration: initializer,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return result;
}

function unalias(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  let current = symbol;
  while (current && (current.flags & ts.SymbolFlags.Alias) !== 0) {
    current = checker.getAliasedSymbol(current);
  }
  return current;
}

function findCallerEntries(
  program: ts.Program,
  checker: ts.TypeChecker,
  componentSymbol: ts.Symbol,
): CallerEntry[] {
  const callers: CallerEntry[] = [];
  for (const source of program.getSourceFiles()) {
    if (!source.fileName.includes(`${sep}src${sep}`)) continue;
    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const symbol = unalias(checker, checker.getSymbolAtLocation(node.tagName));
        if (symbol === componentSymbol) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const attributes = node.attributes.properties;
          const providedProps = attributes
            .flatMap((attribute) =>
              ts.isJsxAttribute(attribute) ? [attribute.name.getText(source)] : [],
            )
            .sort();
          callers.push({
            file: sourceRelative(source.fileName),
            line,
            tag: node.tagName.getText(source),
            providedProps,
            hasSpread: attributes.some(ts.isJsxSpreadAttribute),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return callers.sort(
    (left, right) =>
      compareText(left.file, right.file) ||
      left.line - right.line ||
      compareText(left.tag, right.tag),
  );
}

function collectProps(
  checker: ts.TypeChecker,
  parameter: ts.ParameterDeclaration | undefined,
): { parameterType: string | null; props: PropEntry[] } {
  if (!parameter) return { parameterType: null, props: [] };
  const type = checker.getTypeAtLocation(parameter);
  const props = checker
    .getPropertiesOfType(type)
    .map((property): PropEntry => {
      const propType = checker.getTypeOfSymbolAtLocation(property, parameter);
      const declarations = (property.getDeclarations() ?? [])
        .map((declaration) => {
          const declarationSource = declaration.getSourceFile();
          const line =
            declarationSource.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
          return `${sourceRelative(declarationSource.fileName)}:${String(line)}`;
        })
        .sort();
      return {
        name: property.getName(),
        type: checker.typeToString(propType, parameter, ts.TypeFormatFlags.NoTruncation),
        optional: (property.flags & ts.SymbolFlags.Optional) !== 0,
        declarations,
      };
    })
    .sort((left, right) => compareText(left.name, right.name));
  return {
    parameterType: checker.typeToString(type, parameter, ts.TypeFormatFlags.NoTruncation),
    props,
  };
}

export function buildComponentInventory(): {
  generatedFrom: string;
  manualReviewComplete: false;
  components: ComponentEntry[];
} {
  const configPath = resolve(repositoryRoot, "tsconfig.storybook.json");
  const config = ts.readConfigFile(configPath, (path) => ts.sys.readFile(path));
  if (config.error) {
    throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  }
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, repositoryRoot);
  const sourceFiles = ts.sys.readDirectory(repositoryRoot + "/src", [".ts", ".tsx"]);
  const rootNames = [...new Set([...parsed.fileNames, ...sourceFiles])];
  const program = ts.createProgram({ rootNames, options: parsed.options });
  const checker = program.getTypeChecker();
  const components = collectComponentEntries(program, checker);
  components.sort(
    (left, right) => compareText(left.file, right.file) || compareText(left.name, right.name),
  );
  return {
    generatedFrom: "tsconfig.storybook.json and all src TypeScript files",
    manualReviewComplete: false,
    components,
  };
}

function collectComponentEntries(program: ts.Program, checker: ts.TypeChecker): ComponentEntry[] {
  const components: ComponentEntry[] = [];
  for (const source of program.getSourceFiles()) {
    if (!source.fileName.includes(`${sep}src${sep}`)) continue;
    if (
      /\.(?:test|stories)\.tsx?$/u.test(source.fileName) ||
      source.fileName.includes(`${sep}business${sep}test${sep}`)
    ) {
      continue;
    }
    for (const component of componentDeclarations(source)) {
      const symbol = checker.getSymbolAtLocation(component.nameNode);
      if (!symbol) continue;
      const ownerPlan = componentOwner(source.fileName);
      const { parameterType, props } = collectProps(checker, component.declaration.parameters[0]);
      components.push({
        file: sourceRelative(source.fileName),
        name: component.name,
        parameterType,
        props,
        callers: findCallerEntries(program, checker, symbol),
        ownerPlan,
        manualOwnerReport: `docs/route-migration/review/${
          manualReportByPlan[ownerPlan] ?? "interface-audit.md"
        }`,
        reviewStatus: "needs-manual-review",
      });
    }
  }
  return components;
}

async function main(): Promise<void> {
  const inventory = buildComponentInventory();
  const report = JSON.stringify(inventory, null, 2) + "\n";
  if (Deno.args.includes("--check")) {
    const existing = await Deno.readTextFile(artifactPath);
    if (existing !== report) {
      throw new Error("Component inventory is stale; run `deno task component:audit`.");
    }
    console.log("Component inventory is current; semantic review remains manual.");
    return;
  }
  await Deno.writeTextFile(artifactPath, report);
  console.log(
    `Wrote ${String(inventory.components.length)} component entries to ${sourceRelative(
      artifactPath,
    )}.`,
  );
}

if (import.meta.main) {
  await main();
}
