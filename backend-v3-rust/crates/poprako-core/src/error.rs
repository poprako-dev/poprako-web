use sea_orm::DbErr;

/// # 功能
/// 应用统一错误类型。
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// # 功能
    /// 请求参数不合法。
    #[error("请求参数不合法：{0}")]
    BadRequest(String),
    /// # 功能
    /// 当前请求未通过认证。
    #[error("未认证")]
    Unauthorized,
    /// # 功能
    /// 当前用户无权执行操作。
    #[error("无权限")]
    Forbidden,
    /// # 功能
    /// 目标资源不存在。
    #[error("资源不存在")]
    NotFound,
    /// # 功能
    /// 数据库访问失败。
    #[error("数据库错误：{0}")]
    Database(#[from] DbErr),
    /// # 功能
    /// Redis 访问失败。
    #[error("Redis 错误：{0}")]
    Redis(String),
    /// # 功能
    /// 外部服务调用失败。
    #[error("外部服务错误：{0}")]
    External(String),
}

/// # 功能
/// 应用层统一返回类型。
pub type AppResult<T> = Result<T, AppError>;
