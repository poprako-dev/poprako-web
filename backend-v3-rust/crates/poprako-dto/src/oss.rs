use serde::{Deserialize, Serialize};

/// # 功能
/// 预签名上传响应。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PresignUploadResult {
    /// # 功能
    /// 上传目标 URL。
    pub upload_url: String,
    /// # 功能
    /// 上传后确认使用的对象键。
    pub oss_key: String,
    /// # 功能
    /// 上传后公网访问地址。
    pub public_url: Option<String>,
}
