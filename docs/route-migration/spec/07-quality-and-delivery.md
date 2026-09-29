# S07 工程门禁与交付规格

历史设计草案，当前要求以 [Web requirements](../../REQUIREMENTS.md) 和 R-series
plans 为准。请勿将文中旧路径、P-series 状态或历史检查结论当作当前事实。

状态：设计已定，检查器与CI尚未实施。主计划P011，规范修复P010，最终验收P012。证据：Native
REQUIREMENTS §3–7、`script/check.ts`、`check-style.ts`、`generate.ts`；Web
`scripts/ci-*.sh`、`test-deployment.sh`、`.github/workflows/{ci,release}.yml`、当前TypeScript/ESLint配置。

## S07.1 严格检查范围

基础Node/jsdom+RTL
runner和浏览器安装入口由P001建立，检查器由P010实现，P011编排最终门禁。

所有手写源码、测试、stories、配置与开发脚本进入对应检查；构建产物、node_modules、锁文件按职责豁免，不允许通过排除难迁移代码满足门禁。

TS配置启用：`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noPropertyAccessFromIndexSignature`、`noImplicitReturns`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`allowUnreachableCode: false`、`allowUnusedLabels: false`、`skipLibCheck: false`。保留Web已有
`useUnknownInCatchVariables`、`verbatimModuleSyntax`、`erasableSyntaxOnly`、`noUncheckedSideEffectImports`。环境分别声明browser/node/Deno测试可用globals，不用扩大通用声明掩盖环境错误。Deno
TS脚本由 `deno check` 检查；保留的script/*.mjs由 `deno check --check-js`
与明确JSDoc检查。浏览器和Node兼容配置由tsc检查，保留的根/.storybook
JS配置显式启用allowJs/checkJs；两者组成 `typecheck`。

Prettier采用Native
`trailingComma: all`、`semi: true`、`singleQuote: false`，显式 `printWidth: 100`
延续Web行宽偏好；格式化不是删注释或压缩物理行的依据。ESLint使用S01.4完整规则集且零警告。React数据Props使用type，纯调用契约使用interface，导出函数必须明确返回类型。

## S07.2 项目专项检查器

`script/check-style.ts` 使用TypeScript AST；`script/check-dependency.ts`
使用TS模块解析及目录归属表。`script/check.ts`
串行编排只读门禁。检查器及正反fixture在P010开头实现，P011只负责最终任务/CI接入与交付范围收口，不能先验收后实现。检查器自身有有效与无效临时fixture测试，fixture不落入生产route扫描。

| 检查       | 精确定义                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 结构清零   | 自有源码与工作树中的自有实现不允许任意层级features/entities；拒绝旧顶层pages/layouts/router/api/types/store/hook/hooks/components/lib/utils/config/stories；保留application/routes/shared与明确工具例外                   |
| 目录命名   | 普通目录单数完整单词、kebab-case；具体页面名 settings/utilities 保留；所有 TSX（含路由、测试）PascalCase，普通 TS 为 kebab-case；框架固定名称单独登记                                                                                |
| 文件命名   | TS kebab-case，TSX PascalCase；源名+test/stories后缀、配置名、声明文件、路由和生成名按精确模式例外                                                                                                                        |
| 物理行     | 手写TS/TSX及测试最多400行，计空行注释，末尾换行不多算一行；本项目维护的shadcn源码也检查；生成路径显式名单，不按任意generated文件夹整体豁免                                                                                |
| 导出/声明  | AST检查ExportAssignment和ExportDefault修饰符、顶层function与导出的函数表达式/箭头、type/interface使用、Props定义；工具默认导出仅允许明确配置和stories metadata                                                            |
| 依赖方向   | 生产子route只读自身或祖先business、shared；shared不读routes/application；business不读后代route入口；禁止兄弟内部引用。application只做装配。静态import、export-from、import type、import()、require与别名/相对路径统一解析 |
| 非代码引用 | 检查Worker new URL、动态入口字符串、脚本生成HTML、配置、CI和文档中的仍有效旧路径。迁移文档记录历史路径是预期，不报“历史证据”错误；禁止历史引用豁免生产脚本                                                                |
| 测试依赖   | production禁止import测试/stories/fixture。祖先business的集成测试允许装配后代route，但不成为生产共享入口；此豁免限定application/test或共同父business/test中的集成测试及其零生产消费者fixture闭包，不豁免生产依赖方向       |
| 例外登记   | 配置固定路径+规则+原因；生成文件可豁免命名/行数/特定生成器断言，仍接受类型和生成一致性。禁止整文件eslint-disable/ts-nocheck及无理由ts-ignore                                                                              |

目录依赖规则引用S02；检查报错显示“来源→目标→违反条款”，不只输出目录名。为非字面量动态路径只允许显式有限映射，不允许以解析失败跳过检查。对确有运行时资产URL的调用，检查有限资源映射而非强行转为源码导入。

## S07.3 任务契约

任务统一放deno.json；开发脚本用跨平台Deno，部署仍为明确Linux目标的shell。浏览器启动/进程检查改用Deno.Command、AbortSignal和子进程句柄，不调用Unix
ps；Linux部署测试独立于跨平台check，在CI额外运行。任务使用精确npm版本，与S01一致。

| 任务                            | 契约                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `dev`                           | Vite8开发、HTTP代理、路由生成和HMR                                                                     |
| `typecheck`                     | tsc全部源码/配置/测试及deno check开发脚本，不输出源码                                                  |
| `lint`                          | ESLint全范围 `--max-warnings 0`                                                                        |
| `format` / `format:check`       | Prettier写入/只读；范围包含src、script、配置与.storybook，文档格式独立固定，不把锁当源码               |
| `generate`                      | 更新路由树及路由文件生成段；生成规则与Vite共用                                                         |
| `generate:check`                | 将route源复制到临时树运行生成器，比较路由树与所有输入文件；不能只比较最终树从而漏掉生成器改写route本身 |
| `test:unit`                     | Vitest Node环境纯逻辑及现有单元测试                                                                    |
| `test:integration`              | Vitest jsdom+RTL路由/交互集成测试                                                                      |
| `test:storybook`                | Vitest browser+Playwright的有效stories play测试                                                        |
| `test:script`                   | Deno脚本/规范检查器/Storybook adapter跨平台测试                                                        |
| `test:frontend`                 | 聚合test:unit、test:integration、test:storybook                                                        |
| `test`                          | 聚合test:frontend和test:script，无真实后端/用户账户                                                    |
| `test:browser-install`          | 固定Playwright版本安装Chromium浏览器；Linux CI额外安装系统依赖                                         |
| `check`                         | format:check→typecheck→lint→项目专项→generate:check→test；失败即停止，不安装或改锁                     |
| `build`                         | typecheck后Vite生产构建                                                                                |
| `storybook` / `build-storybook` | 保留Deno adapter启动和静态构建                                                                         |
| `test:storybook-start`          | 跨平台启动并验证可访问，进程结束和临时目录清理                                                         |
| `test:compress-browser`         | 受控Chromium验证真实生产压缩Worker、取消和清理，CI/P012独立执行                                        |
| `test:bounded-browser`          | 受控Chromium验证定界压缩、批处理和下载，CI/P012独立执行                                                |
| `preview`                       | Vite生产预览，供静态产物验证                                                                           |
| `audit`                         | `deno audit --frozen --level=high`                                                                     |

不提供desktop/package/Cargo/SQL任务，不伪造Native目标。正常 `generate`
是写任务，不嵌入只读check。安装由外层明确执行 `deno ci`，检查前后比较tracked
diff证明只读。

## S07.4 CI与发布

将全部 `scripts/` 迁至
`script/`；CI调用、release脚本内部引用、脚本测试fixture、README与部署文档同步。维护原有Linux部署脚本行为，不把远端发布改造成跨平台开发任务。

- CI checks先Deno2.9.6
  frozen安装，安装Playwright所需Chromium及系统依赖，再执行check、build、build-storybook、test:storybook-start、test:compress-browser、test:bounded-browser和Linux部署测试。
- security保留独立audit
  job；main生产部署继续依赖checks与security成功，PR不发布。发布tag继续验证祖先关系、记录源码SHA、Deno版本、锁与SHA256SUMS。
- Windows和macOS执行非部署开发任务验证，至少typecheck/lint/test:unit/test:integration/test:script/build/Storybook启动。Chromium
  play测试由Linux执行；Firefox/WebKit按S07.6作为最终浏览器矩阵，不能冒充真实Safari最低版本实测。
- Action固定现有commit
  SHA，工具链固定Deno2.9.6；不引入签名、公证、Tauri包、自动更新、遥测上传。
- 生产部署仍使用既有环境secret、host-key校验、健康检查与失败恢复机制；测试全部使用临时目录及stub命令，不能向真实服务器执行。
- 生成产物和临时测试目录不提交；路由树和deno.lock必须提交。生成器、锁和源码不一致属于失败。

## S07.5 错误、凭据、数据与许可证

Native要求系统凭据存储不适用于独立浏览器；本次保持现有身份持久化契约，不擅自改token策略、重置登录数据或声称localStorage达到系统keychain保证。准确迁移项见S04兼容规格。共享HTTP
transport不读取route状态；root会话装配凭据。未知错误安全提示，开发诊断在错误发生处记录，避免上层重复日志；不输出token或完整敏感载荷。

保留请求超时/失败处理，重试需要具体幂等性判断；不对所有写请求自动重试。前端输入校验不能替代后端鉴权；架构迁移不改变HTTP契约或隐含后端安全承诺。发布后同源策略、HTTPS、静态服务器header延续既有部署配置；不把Tauri
CSP/capabilities配置复制成Web实现。

保留MIT与第三方许可；不因Native
AGPL要求修改Web许可证。构建产物可追溯源码和锁，不承诺压缩归档逐字节一致。迁移不得清空现有本地存储，已有数据迁移失败需保留原值并提供恢复提示。

## S07.6 验收与未实测门禁

| 验收ID | 必须提供的证据                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A70    | 工程专项测试：合法/非法目录、400/401行、默认导出、type/interface、alias/re-export/dynamic import、集成测试特例、production依赖fixture均正确 |
| A71    | check成功，执行前后tracked diff不变；故意改route-tree能导致generate:check失败且不回写                                                       |
| A72    | 干净Deno2.9.6安装、严格typecheck/lint/Prettier、build和Storybook全通过；无features实现/旧运行引用                                           |
| A73    | Linux部署脚本测试、workflow路径与release元数据校验；不会访问真实部署                                                                        |
| A74    | Windows/macOS开发任务结果、Chromium/Firefox/WebKit浏览器冒烟、真实Safari16.4与Chrome111能力复核；无对应环境时如实记录未测，禁止写已通过     |
| A75    | 移动窄屏、系统主题、键盘/输入法、焦点、后台长任务、现有登录/团队/快捷键持久化回归                                                           |
| A76    | frozen审计无high/critical；低级发现记录原因；源码SHA/锁/工具链版本一致且LICENSE仍MIT                                                        |

S02.8的IC-01至IC-04同为交付门禁：各业务包完成接口与调用方审查，P010核对全量覆盖，
P012复核[接口审查记录](../review/interface-audit.md)。strict和exactOptionalPropertyTypes
只能约束类型合法性，不能证明一个字段应当可空或fallback有业务意义；不设置“消除99%可空”
这类数量门槛。未完成语义审查、用空函数/假ID代替必需输入、失败被转换为正常空结果，均不能验收。

最低浏览器声明以Tailwind4/Vite配置的Chrome111、Safari16.4能力为底线；本迁移不取消已有移动浏览器适配。Windows/macOS开发任务是工具可用性验证，不宣称Native桌面安装支持。没有环境的最低版本检查登记为发布门禁，不用较新Playwright内核替代最低版本证据。

本轮只编制规格，未执行新工具链CI、浏览器矩阵或部署；当前源码既有测试通过也不等于本规格已落实。P012按每个ID记录命令、平台、源码SHA、结果和限制。只要工程未完成，文档不得标为“迁移已完成”。

## S07.7 声明语义的可执行判定

Props一律type。纯调用契约指所有成员都是call/construct/method
signature或函数类型property，且至少一项成员；它使用interface。含任何数据property、index
signature或数据/方法混合成员的结构使用type。函数类型别名保持工具所需的泛型/组合表达形式，纯对象方法契约由interface表达。ambient声明合并仅按精确外部工具声明位置放行。顶层const存储数据/React
context/Zustand构造结果不被误判为函数声明；顶层箭头函数及export修饰的箭头需改function。检查器使用AST并配正反fixture，不依赖类型名称字符串猜测。
