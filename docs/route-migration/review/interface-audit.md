# 组件接口与空值语义审查

状态：实施中；下表保留基线问题，当前实现及调用方审查见下方已落地记录。完整浏览器回归仍在收敛，不作为全量验收通过声明。
依据：[S02.8](../spec/02-structure-and-dependency.md)、[S04-08](../spec/04-state-and-data.md)。

## 必须覆盖的范围

P002–P008各自审查所负责的全部生产组件、Props及生产调用方；包括继承、交叉类型、
Partial引入的可选字段，不只搜索名字叫Props的声明。组件清单覆盖已迁移、新增、拆分后的组件。
每个组件至少一条审查记录；每个保留optional/null的字段必须有具体理由，可合并同类字段。
无可空问题的组件也记录“已审查，无需修改”，不能只列已发现的几个案例来声称全覆盖。

P009更新stories，不能用缺参数的旧story迫使生产接口继续宽松；P010核对最终源码与清单，
P012复查IC-01至IC-04。组件跨包变更时主负责人同时修复实际调用方，记录越过主文件清单的范围，
不留临时宽松Props。并行包涉及同一消费者时由集成负责人串行合入。

每条实施记录包含：最终组件路径、字段/模式、全部调用方位置、原问题、最终契约、
fallback归属或保留空值的业务理由、变更验证、负责包、完成状态。
没有合理fallback的真实空状态不能被“消除可空”的数量指标抹掉。

## 已识别案例及要求

以下为基线源码证据和具体处理要求，不是全仓审查的替代品。实施时补齐最终路径、调用方与验证结果。

| 基线组件/位置 | 问题与处理要求 | 负责包 | 状态 |
| --- | --- | --- | --- |
| src/components/ui/IconInputRow.tsx | value/onChange可选且通过可选链调用。对当前受控输入使用必选string与回调；核对全部消费者。password/numeric互斥改明确模式，普通文本为有意义默认；不为假设中的非受控用法保留宽接口 | P002 | 已修改，集成回归中 |
| src/components/ui/ConfirmDialog.tsx | onConfirm可缺省但默认显示确认按钮。用明确模式绑定动作与按钮；正常确认模式必须有处理器。ComicDetailModal存在hideFooter用法，迁为真实内容模式或直接组合AppDialog，不传空函数；确认/取消文案默认保留 | P002；P004同步详情调用方 | 已修改，集成回归中 |
| src/components/ui/Paginator.tsx | onPageIndexChange的缺省有已声明的“只显示文本”语义，pageStats缺省表示无下拉。核对真实调用后决定保留模式还是收窄；不能机械删除所有optional。缺失统计不能无依据当成已知0 | P002；P008同步翻校调用方 | 已修改，集成回归中 |
| src/features/Workspace/components/business/Workspace.tsx | loginState?.userInfo及团队名空串fallback散布就绪页面。身份由父route保证；无团队显式呈现；需要团队的子组件接收就绪团队，避免空ID/空名支持伪正常操作 | P003建立边界；P005收敛消费者 | 已修改，集成回归中 |
| src/components/ui/AppDialog.tsx及通用UI | className、说明/插槽和尺寸缺省逐项核对；有合理默认或合法省略时保留，不让调用方为类型整洁重复传undefined或无意义空值 | P002 | 已修改，集成回归中 |

## 验证尺度

P001期间的只读消费者清点补充（不是实现验收）：IconInputRow有20处生产调用、12个文件，
均已提供string值与实际onChange；因此不预建非受控模式。普通text模式可在组件入口默认化，
password/numeric使用一个明确mode字段，避免互斥布尔值。
ConfirmDialog有17处生产调用、12个文件，其中16处有确认动作，仅下载数据弹窗使用hideFooter；
显式confirm/content模式分别约束动作。UserTag、ChapterOption、AssignmentGroup还需检查确认回调内部的
可选业务能力，能力不可用时不显示可执行操作，不能只把外层onConfirm改为必选。
Paginator唯一直接生产调用方为TranslatorPaginator；已有展示/输入/列表场景按显式模式绑定能力。
其ReadOnly story继承meta的onPageIndexChange，实际仍可输入，P009必须修正该场景；
零页场景显示0/0且不派发-1，未知flagged统计不能伪装成已知0。

类型检查覆盖全部调用方。判别联合、默认行为或错误路径确有行为变化时，
为“动作不能缺失”“模式不能冲突”“失败不变空成功”“0/false保持语义”补充相应回归。
单纯删除冗余`| undefined`不要求机械新增测试；不以测试数量或optional减少比例验收。
最终报告须说明实际改进、保留例外和未完成项，不能仅报告目录迁移/编译通过。

## 已落地语义修正（03:34 UTC）

逐组件记录：[shared 与术语](shared-interface-review.md)、[翻校界面](translator-interface-review.md)、[叶子页面](leaf-interface-review.md)。
另外见[详情契约](detail-interface-review.md)、[身份及路由](session-interface-review.md)。
这些表不替代最终调用方类型检查及浏览器回归；详情与叶子页面尚未形成逐组件完整记录。

- IconInputRow：value/onChange 必填；单一 mode 取代互斥布尔值，默认 text。
- ConfirmDialog：confirm/content 判别联合；确认动作必填，内容模式不渲染无动作按钮，真实关闭回调必填。
- Paginator：display/input/list 模式；交互模式要求相应回调，未知标记统计不伪造零，零页显示 0/0。
- AppDialog：onClose 必填；布局插槽、大小、样式扩展保留有意义默认。
- Workspace/ComicPlayground：search 与导航动作由 route 必填传入；无团队显式显示，不用空 ID 继续业务。
- PageCard：只有真实导航回调且页面可用时才提供点击、键盘和焦点；无回调是静态展示。
- ComicDetailSidebar/ActionButton：缺少能力就隐藏操作；渲染的动作必须具有处理器。
- 邀请删除能力保留可选，并同时约束按钮与确认路径；没有删除权限不提供操作。
- 翻校身份缺失显式失败，不以空字符串充当用户；编辑器的保存/图片/核心交互契约必填。

审查注意：源码扫描只能产生候选清单，不能证明每个 optional 都无意义。当前真实空状态包括尚无章节/选区、未解析贡献者、未提供统计及无团队成员身份；必须保留正确业务语义。
