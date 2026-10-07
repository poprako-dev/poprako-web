# PopRaKo

## Language

**revision_note**:
针对某一页成稿提出的结构化批注，包含问题类型与说明，可以关联画面中的矩形区域。
一页可以有多条 revision_note，也可以没有；不关联区域的批注同样有效。
矩形使用整页的 0–1 相对坐标；图层关联使用 PSD 文档中的图层路径 ID。
revision_note 不绑定翻译 unit；按页组织不意味着共享 unit 的数据或交互状态。
_Avoid_: review note、监稿
