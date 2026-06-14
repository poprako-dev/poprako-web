use crate::{AppConfig, AppError, AppResult};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

/// # 功能
/// JWT 载荷，保存认证用户与过期信息。
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthClaims {
    /// # 功能
    /// 用户唯一标识。
    pub sub: String,
    /// # 功能
    /// 用户显示名。
    pub name: String,
    /// # 功能
    /// 是否超级管理员。
    pub is_super_admin: bool,
    /// # 功能
    /// 签发者。
    pub iss: String,
    /// # 功能
    /// 过期时间戳。
    pub exp: usize,
}

/// # 功能
/// JWT 编码与解码服务。
#[derive(Clone, Debug)]
pub struct JwtService {
    /// # 功能
    /// 签名密钥。
    secret: String,
    /// # 功能
    /// 签发者。
    issuer: String,
    /// # 功能
    /// 过期秒数。
    expire_seconds: i64,
}

impl JwtService {
    /// # 功能
    /// 基于应用配置创建 JWT 服务。
    ///
    /// ## 参数
    /// - `config`: 应用配置。
    ///
    /// ## 返回
    /// - `Self`: JWT 服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(config: &AppConfig) -> Self {
        Self {
            secret: config.jwt_secret.clone(),
            issuer: config.jwt_issuer.clone(),
            expire_seconds: config.jwt_expire_seconds,
        }
    }

    /// # 功能
    /// 为指定用户签发访问令牌。
    ///
    /// ## 参数
    /// - `user_id`: 用户 ID。
    /// - `name`: 用户显示名。
    /// - `is_super_admin`: 是否超级管理员。
    ///
    /// ## 返回
    /// - `Ok(String)`: JWT 字符串。
    /// - `Err(AppError)`: 签发失败。
    ///
    /// ## 副作用
    /// 无。
    pub fn sign(&self, user_id: &str, name: &str, is_super_admin: bool) -> AppResult<String> {
        let exp = (Utc::now() + Duration::seconds(self.expire_seconds)).timestamp() as usize;
        let claims = AuthClaims {
            sub: user_id.to_owned(),
            name: name.to_owned(),
            is_super_admin,
            iss: self.issuer.clone(),
            exp,
        };
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|error| AppError::External(error.to_string()))
    }

    /// # 功能
    /// 校验并解析访问令牌。
    ///
    /// ## 参数
    /// - `token`: JWT 字符串。
    ///
    /// ## 返回
    /// - `Ok(AuthClaims)`: 令牌载荷。
    /// - `Err(AppError)`: 令牌无效或已过期。
    ///
    /// ## 副作用
    /// 无。
    pub fn verify(&self, token: &str) -> AppResult<AuthClaims> {
        let mut validation = Validation::default();
        validation.set_issuer(&[self.issuer.as_str()]);
        decode::<AuthClaims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &validation,
        )
        .map(|data| data.claims)
        .map_err(|_| AppError::Unauthorized)
    }
}
