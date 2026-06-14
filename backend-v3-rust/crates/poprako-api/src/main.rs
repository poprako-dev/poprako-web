use anyhow::Context;
use poprako_core::{ApiDataResponse, AppConfig, JwtService};
use poprako_service::{
    CollaborationRedisStore, DomainService, OssService, TranslatorCollaborationService, UserService,
};
use salvo::prelude::*;
use sea_orm::Database;
use std::sync::Arc;

mod routes;

/// # 功能
/// API 共享状态，聚合配置与各业务服务。
#[derive(Clone)]
pub struct ApiState {
    /// # 功能
    /// 应用配置。
    pub config: AppConfig,
    /// # 功能
    /// 通用领域服务。
    pub domain_service: DomainService,
    /// # 功能
    /// 用户与认证服务。
    pub user_service: UserService,
    /// # 功能
    /// OSS 服务。
    pub oss_service: OssService,
    /// # 功能
    /// Translator 协作服务。
    pub collaboration_service: TranslatorCollaborationService,
}

/// # 功能
/// 健康检查处理器。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `Json<ApiDataResponse<&'static str>>`: 健康状态。
///
/// ## 副作用
/// 无。
#[handler]
async fn health() -> Json<ApiDataResponse<&'static str>> {
    Json(ApiDataResponse::ok("ok"))
}

/// # 功能
/// 应用主入口。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `anyhow::Result<()>`: 启动结果。
///
/// ## 副作用
/// 建立数据库连接、Redis 客户端并监听 HTTP 端口。
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    let config = AppConfig::from_env();
    let db = Database::connect(&config.database_url)
        .await
        .context("connect database")?;
    let jwt_service = JwtService::new(&config);
    let domain_service = DomainService::new(db.clone());
    let user_service = UserService::new(db, jwt_service);
    let oss_service = OssService::new(&config);
    let redis_store =
        CollaborationRedisStore::new(&config.redis_url).context("create redis store")?;
    let collaboration_service = TranslatorCollaborationService::new(redis_store);
    let state = Arc::new(ApiState {
        config: config.clone(),
        domain_service,
        user_service,
        oss_service,
        collaboration_service,
    });
    let router = Router::new()
        .hoop(affix_state::inject(state))
        .push(Router::with_path("health").get(health))
        .push(routes::api_router())
        .push(routes::hub_router());
    let acceptor = TcpListener::new(config.listen_addr()).bind().await;
    Server::new(acceptor).serve(router).await;
    Ok(())
}
