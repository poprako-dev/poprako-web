use serde::Serialize;

/// # 功能
/// API 数据响应包装，兼容当前前端对 `data` 字段的解析。
#[derive(Clone, Debug, Serialize)]
pub struct ApiDataResponse<T: Serialize> {
    /// # 功能
    /// 响应是否成功。
    pub success: bool,
    /// # 功能
    /// 响应数据体。
    pub data: T,
    /// # 功能
    /// 业务消息。
    pub message: String,
}

impl<T: Serialize> ApiDataResponse<T> {
    /// # 功能
    /// 构造成功响应。
    ///
    /// ## 参数
    /// - `data`: 响应数据体。
    ///
    /// ## 返回
    /// - `Self`: 成功响应。
    ///
    /// ## 副作用
    /// 无。
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data,
            message: "ok".to_owned(),
        }
    }
}
