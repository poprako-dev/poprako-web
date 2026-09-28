# 详情接口复核

`ComicDetailModal` 当前仅接收 comicInfo、pinnedChapter、initialChapterId、onNavigateToTranslator、onChanged、onClose。comicInfo 为含 team/workset 的 DetailComicInfo。身份来自 ready-session，不再允许 nullable currentUserId 进入受保护页面。

`use-detail-resource` 拥有 API 查询、修改和刷新，两个宿主只负责列表、search 和导航。内部 DetailContract 的加载/修改/删除/分工/导入导出动作必填；权限由真实成员与章节分工决定，不用缺少基础依赖表示“可能能工作”。MemberSelectorModal 只在章节和职位存在时挂载，章节及加载器必填。

activeMember 的 null 表示当前用户不属于漫画团队；selectedChapter/pinnedChapter 的空态表示真实缺少章节。弹窗状态、DOM ref 和上传预览的 null 有对应生命周期。分页/上传错误不伪装成成功空列表。

章节状态仅为必需的 stages 位字段；删除旧时间戳模型与 optimistic update 的双轨逻辑。角色仅使用 roles 位字段，删除用时间戳猜测职位的表示。

逐组件及字段决定见 [完整索引](component-contract-review.md)，调用点见 [组件清单](component-inventory.json)。详情 API/上传/工作流单测、宿主与权限 Storybook、工作流/成品交互均通过最终完整检查。
