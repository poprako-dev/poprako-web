use serde::{Deserialize, Serialize};
use serde_json::Value;

/// # 功能
/// 页面编辑者状态。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TranslatorPageEditorState {
    /// # 功能
    /// 用户 ID。
    pub user_id: String,
    /// # 功能
    /// 展示名称。
    pub display_name: String,
    /// # 功能
    /// 头像 URL。
    pub avatar_url: Option<String>,
    /// # 功能
    /// 页面键。
    pub page_key: String,
    /// # 功能
    /// 页面序号。
    pub page_index: i32,
    /// # 功能
    /// 页面名称。
    pub page_name: String,
    /// # 功能
    /// 编辑模式。
    pub mode: String,
    /// # 功能
    /// 编辑状态。
    pub editor_state: String,
    /// # 功能
    /// 获取锁时间戳。
    pub acquired_at: i64,
}

/// # 功能
/// 项目协作状态。
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct TranslatorProjectState {
    /// # 功能
    /// 项目键。
    pub project_key: String,
    /// # 功能
    /// 页面编辑者列表。
    pub page_editors: Vec<TranslatorPageEditorState>,
}

/// # 功能
/// 页面快照。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TranslatorPageSnapshot {
    /// # 功能
    /// 项目键。
    pub project_key: String,
    /// # 功能
    /// 页面键。
    pub page_key: String,
    /// # 功能
    /// 页面序号。
    pub page_index: i32,
    /// # 功能
    /// 页面名称。
    pub page_name: String,
    /// # 功能
    /// 编辑模式。
    pub mode: String,
    /// # 功能
    /// 更新者用户 ID。
    pub updated_by_user_id: String,
    /// # 功能
    /// 更新者展示名称。
    pub updated_by_display_name: String,
    /// # 功能
    /// 更新时间戳。
    pub updated_at: i64,
    /// # 功能
    /// 页面翻校单元快照。
    pub units: Vec<Value>,
}

/// # 功能
/// 尝试获取页面锁结果。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TryAcquirePageLockResult {
    /// # 功能
    /// 是否获取成功。
    pub acquired: bool,
    /// # 功能
    /// 当前锁持有者。
    pub editor: Option<TranslatorPageEditorState>,
}
