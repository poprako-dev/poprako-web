# P006 — 迁移成员、信箱与设置全部业务

计划状态：ready（设计）；实施状态：not-started。
前置工作包：P004

负责人：管理页负责人；独占member-list/system-mail/settings；使用P002已迁邮件契约/store；主题实现与设置控件由P010负责。

## 目标与范围

三个route私有代码与共享邮件/团队能力归属明确，用户会话操作与旧缓存不串身份。

## 依据与开始条件

- [S02](../spec/02-structure-and-dependency.md)
- [S04](../spec/04-state-and-data.md)
- [S05](../spec/05-theme-and-interface.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

MemberList/MemberCard、SystemMail、Settings，以及mail/invitation业务契约和相关测试；shell邮件缓存已经在P002从旧AppStore独立，本包只使用其契约。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P006 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：23 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `src/api/invitation.ts` | move | `src/routes/_authenticated/_shell/member-list/business/invitation/invitation-request.ts` |
| `src/features/MemberCard/components/business/MemberCard.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/member/MemberCard.tsx` |
| `src/features/MemberCard/components/business/activityStatus.test.ts` | move | `src/routes/_authenticated/_shell/member-list/business/member/activity-status.test.ts` |
| `src/features/MemberCard/components/business/activityStatus.ts` | move | `src/routes/_authenticated/_shell/member-list/business/member/activity-status.ts` |
| `src/features/MemberCard/index.ts` | delete | 删除；理由见清单 |
| `src/features/MemberList/components/business/EmbeddedMemberList.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/EmbeddedMemberList.tsx` |
| `src/features/MemberList/components/business/MemberDetailModal.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/MemberDetailModal.tsx` |
| `src/features/MemberList/components/business/MemberGlance.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/MemberGlance.tsx` |
| `src/features/MemberList/components/business/MemberInvitorModal.tsx` | split | `src/routes/_authenticated/_shell/member-list/business/MemberInvitorModal.tsx`<br>`src/routes/_authenticated/_shell/member-list/business/InvitationForm.tsx`<br>`src/routes/_authenticated/_shell/member-list/business/InvitationList.tsx`<br>`src/routes/_authenticated/_shell/member-list/business/use-invitation.ts` |
| `src/features/MemberList/components/business/MemberList.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/MemberList.tsx` |
| `src/features/MemberList/components/business/MemberListFilterHeader.tsx` | move | `src/routes/_authenticated/_shell/member-list/business/MemberListFilterHeader.tsx` |
| `src/features/MemberList/index.ts` | delete | 删除；理由见清单 |
| `src/features/MemberList/types/types.ts` | move | `src/routes/_authenticated/_shell/member-list/business/member-list-type.ts` |
| `src/features/Settings/AcknowledgementsFooter.tsx` | move | `src/routes/_authenticated/_shell/settings/business/AcknowledgementsFooter.tsx` |
| `src/features/Settings/PasswordResetDialog.tsx` | move | `src/routes/_authenticated/_shell/settings/business/PasswordResetDialog.tsx` |
| `src/features/Settings/SettingsPanel.tsx` | move | `src/routes/_authenticated/_shell/settings/business/SettingsPanel.tsx` |
| `src/features/Settings/TeamSwitchModal.tsx` | move | `src/routes/_authenticated/_shell/settings/business/TeamSwitchModal.tsx` |
| `src/features/Settings/UserAvatarUploadModal.tsx` | move | `src/routes/_authenticated/_shell/settings/business/UserAvatarUploadModal.tsx` |
| `src/features/Settings/index.ts` | delete | 删除；理由见清单 |
| `src/features/SystemMail/components/business/SystemMailViewer.tsx` | move | `src/routes/_authenticated/_shell/system-mail/business/SystemMailViewer.tsx` |
| `src/features/SystemMail/index.ts` | delete | 删除；理由见清单 |
| `src/types/invitation.ts` | move | `src/routes/_authenticated/_shell/member-list/business/invitation/invitation.ts` |
| `src/types/raw/invitation.ts` | move | `src/routes/_authenticated/_shell/member-list/business/invitation/raw-invitation.ts` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/routes/_authenticated/_shell/member-list/business/MemberPage.test.tsx` | 成员邀请与角色交互 | ST-03 |
| `src/routes/_authenticated/_shell/system-mail/business/SystemMailViewer.test.tsx` | viewer与共享已读状态 | SD-04;ST-03 |
| `src/routes/_authenticated/_shell/settings/business/SettingsPanel.test.tsx` | 会话退出与设置交互；P010追加主题场景 | ST-03;UI-01 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 成员列表/筛选/详情/邀请与MemberCard整体就近，角色位和邀请协议保持；拆分超限MemberInvitorModal为输入/提交/展示职责。
2. 信箱viewer放system-mail，复用P002已迁shell邮件store/request与P003角标；验证session代次隔离和同一读态来源。
3. 设置页头像、密码、切换团队、导出日志与退出流程迁移；复用根identity/祖先上传操作，不引用兄弟route；用户/团队头像复用shared hash与presigned transport。
4. 登出使用clearSession及业务失效订阅；远端失败仍执行本地清理和/login；主题选择控件及其新行为明确由P010加入，本包不引用尚未建立的theme实现。
5. 页面加载/空/错误/重试、弹窗焦点及输入保留按原功能和S05统一，全部调用点使用具名导出。

## 接口与空值语义修正

逐个审查本包全部生产组件及实际调用方，按S02.8/S04-08修正不必要的optional/null、重复判空和无意义fallback。必需数据与动作收紧契约；合理默认值在所属边界集中；真实空状态与互斥模式显式建模。同步修改受影响的跨包调用方，由集成负责人协调共享文件，不保留临时宽接口。

结果写入[接口审查记录](../review/interface-audit.md)，逐项保留调用方与验证证据。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 成员筛选分页、邀请/修改角色、admin权限限制、头像上传失败可重试。
- [ ] SD-04邮件已读与未读badge同步、跨身份清理；团队选择不改漫画所属权限。
- [ ] 密码/登出失败提示、local cleanup、日志导出脱敏、设置页面键盘交互；新增theme选择在P010验收。

## 完成标准

- [ ] 本包接口审查和受影响调用方已完成；IC-01至IC-04在本包范围内无未处理项，不能仅以类型检查通过代替。
- [ ] 三个route及其测试/stories不依赖旧feature；邮件cache只有一个权威来源。
- [ ] 设置logout不通过根反向导入叶子业务；头像上传不暴露Bearer。

## 风险与恢复

缓存分离可能遗漏导航badge，登出可能留下旧异步结果。通过两身份连续测试与延迟响应固定回归。

## 协作与执行记录

前置依赖未满足时禁止开始本包。可按索引与其他业务包并行；shared、root、路由树或根配置修改交主负责人串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R2-01、R2-02、R2-08、R2-11、R3-01、R3-04、R4-01、R4-02、R4-04、R4-06、R5-01、R5-06。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
