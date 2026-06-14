use serde::{Deserialize, Serialize};

/// # 功能
/// 分页查询参数。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct PaginationQuery {
    /// # 功能
    /// 跳过记录数。
    pub offset: Option<u64>,
    /// # 功能
    /// 返回记录数。
    pub limit: Option<u64>,
}

/// # 功能
/// 通用列表筛选参数。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ListFilter {
    /// # 功能
    /// 关键字搜索。
    pub search: Option<String>,
    /// # 功能
    /// 团队 ID。
    pub team_id: Option<String>,
    /// # 功能
    /// 工作集 ID。
    pub workset_id: Option<String>,
    /// # 功能
    /// 漫画 ID。
    pub comic_id: Option<String>,
    /// # 功能
    /// 章节 ID。
    pub chapter_id: Option<String>,
    /// # 功能
    /// 用户 ID。
    pub user_id: Option<String>,
    /// # 功能
    /// 状态。
    pub status: Option<String>,
    /// # 功能
    /// 跳过记录数。
    pub offset: Option<u64>,
    /// # 功能
    /// 返回记录数。
    pub limit: Option<u64>,
    /// # 功能
    /// 需要展开的关联字段。
    #[serde(default, rename = "includes[]")]
    pub includes: Vec<String>,
}

/// # 功能
/// 空响应体。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct EmptyResponse {}
