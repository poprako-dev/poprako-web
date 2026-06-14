use std::env;

/// # 功能
/// 应用运行配置，集中保存服务地址、数据库、Redis、JWT 与对象存储参数。
#[derive(Clone, Debug)]
pub struct AppConfig {
    /// # 功能
    /// HTTP 服务监听主机。
    pub app_host: String,
    /// # 功能
    /// HTTP 服务监听端口。
    pub app_port: u16,
    /// # 功能
    /// PostgreSQL 连接字符串。
    pub database_url: String,
    /// # 功能
    /// Redis 连接字符串。
    pub redis_url: String,
    /// # 功能
    /// JWT 签名密钥。
    pub jwt_secret: String,
    /// # 功能
    /// JWT 签发者。
    pub jwt_issuer: String,
    /// # 功能
    /// JWT 过期秒数。
    pub jwt_expire_seconds: i64,
    /// # 功能
    /// OSS 公网基础地址。
    pub oss_public_base_url: Option<String>,
    /// # 功能
    /// OSS S3 兼容端点。
    pub oss_endpoint: Option<String>,
    /// # 功能
    /// OSS 访问密钥 ID。
    pub oss_access_key_id: Option<String>,
    /// # 功能
    /// OSS 访问密钥 Secret。
    pub oss_access_key_secret: Option<String>,
    /// # 功能
    /// OSS 存储桶名称。
    pub oss_bucket: Option<String>,
}

impl AppConfig {
    /// # 功能
    /// 从环境变量读取应用配置。
    ///
    /// ## 参数
    /// 无。
    ///
    /// ## 返回
    /// - `Self`: 解析完成的应用配置。
    ///
    /// ## 副作用
    /// 读取当前进程环境变量。
    pub fn from_env() -> Self {
        Self {
            app_host: env::var("APP_HOST").unwrap_or_else(|_| "127.0.0.1".to_owned()),
            app_port: env::var("APP_PORT")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(18881),
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgres://postgres:postgres@127.0.0.1:5432/poprako".to_owned()
            }),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://127.0.0.1:6379/0".to_owned()),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "change-me".to_owned()),
            jwt_issuer: env::var("JWT_ISSUER").unwrap_or_else(|_| "poprako".to_owned()),
            jwt_expire_seconds: env::var("JWT_EXPIRE_SECONDS")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(604800),
            oss_public_base_url: env::var("OSS_PUBLIC_BASE_URL")
                .ok()
                .filter(|value| !value.is_empty()),
            oss_endpoint: env::var("OSS_ENDPOINT")
                .ok()
                .filter(|value| !value.is_empty()),
            oss_access_key_id: env::var("OSS_ACCESS_KEY_ID")
                .ok()
                .filter(|value| !value.is_empty()),
            oss_access_key_secret: env::var("OSS_ACCESS_KEY_SECRET")
                .ok()
                .filter(|value| !value.is_empty()),
            oss_bucket: env::var("OSS_BUCKET")
                .ok()
                .filter(|value| !value.is_empty()),
        }
    }

    /// # 功能
    /// 生成监听地址。
    ///
    /// ## 参数
    /// 无。
    ///
    /// ## 返回
    /// - `String`: 监听地址。
    ///
    /// ## 副作用
    /// 无。
    pub fn listen_addr(&self) -> String {
        format!("{}:{}", self.app_host, self.app_port)
    }
}
