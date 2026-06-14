use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// # 功能
/// 用户信息响应，对齐前端 `UserInfo` 类型。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct UserInfo {
    /// # 功能
    /// 用户唯一标识。
    pub id: String,
    /// # 功能
    /// 用户显示名。
    pub name: String,
    /// # 功能
    /// QQ 账号。
    pub qq: String,
    /// # 功能
    /// 头像 URL。
    pub avatar_url: Option<String>,
    /// # 功能
    /// 头像是否已上传。
    pub is_avatar_uploaded: Option<bool>,
    /// # 功能
    /// 是否超级管理员。
    pub is_super_admin: Option<bool>,
    /// # 功能
    /// 创建时间。
    pub created_at: Option<DateTime<Utc>>,
    /// # 功能
    /// 更新时间。
    pub updated_at: Option<DateTime<Utc>>,
    /// # 功能
    /// 兼容旧前端字段：username。
    pub username: Option<String>,
    /// # 功能
    /// 兼容旧前端字段：avatar。
    pub avatar: Option<String>,
}

/// # 功能
/// 通用领域信息，承载团队、工作集、漫画、章节、页面、任务等响应。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct DomainInfo {
    /// # 功能
    /// 资源唯一标识。
    pub id: String,
    /// # 功能
    /// 资源名称。
    pub name: Option<String>,
    /// # 功能
    /// 标题。
    pub title: Option<String>,
    /// # 功能
    /// 描述。
    pub description: Option<String>,
    /// # 功能
    /// 状态。
    pub status: Option<String>,
    /// # 功能
    /// 序号。
    pub index: Option<i32>,
    /// # 功能
    /// 团队 ID。
    pub team_id: Option<String>,
    /// # 功能
    /// 用户 ID。
    pub user_id: Option<String>,
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
    /// 页面 ID。
    pub page_id: Option<String>,
    /// # 功能
    /// 创建时间。
    pub created_at: Option<DateTime<Utc>>,
    /// # 功能
    /// 更新时间。
    pub updated_at: Option<DateTime<Utc>>,
}

/// # 功能
/// 通用创建或更新请求体。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct DomainMutationArgs {
    /// # 功能
    /// 名称。
    pub name: Option<String>,
    /// # 功能
    /// 标题。
    pub title: Option<String>,
    /// # 功能
    /// 描述。
    pub description: Option<String>,
    /// # 功能
    /// 团队 ID。
    pub team_id: Option<String>,
    /// # 功能
    /// 用户 ID。
    pub user_id: Option<String>,
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
    /// 页面 ID。
    pub page_id: Option<String>,
    /// # 功能
    /// 角色。
    pub role: Option<String>,
    /// # 功能
    /// 状态。
    pub status: Option<String>,
}
