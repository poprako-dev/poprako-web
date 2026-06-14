use serde::{Deserialize, Serialize};

/// # 功能
/// 登录请求参数。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LoginUserArgs {
    /// # 功能
    /// 登录 QQ 账号。
    pub qq: String,
    /// # 功能
    /// 登录密码。
    pub password: String,
}

/// # 功能
/// 注册请求参数。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RegisterUserArgs {
    /// # 功能
    /// 注册用户名。
    pub name: String,
    /// # 功能
    /// 注册密码。
    pub password: String,
    /// # 功能
    /// 邀请码。
    pub invitation_code: String,
    /// # 功能
    /// 兼容旧字段用户名。
    pub username: Option<String>,
    /// # 功能
    /// 兼容旧字段 QQ。
    pub qq: Option<String>,
}

/// # 功能
/// 登录结果。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LoginUserResult {
    /// # 功能
    /// 访问令牌。
    pub access_token: String,
}
