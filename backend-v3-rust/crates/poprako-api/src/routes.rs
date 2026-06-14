use crate::ApiState;
use poprako_core::ApiDataResponse;
use poprako_dto::{
    DomainInfo, DomainMutationArgs, EmptyResponse, ListFilter, LoginUserArgs, LoginUserResult,
    PresignUploadResult, RegisterUserArgs, TranslatorProjectState,
};
use poprako_signalr::{
    decode_messages, encode_message, handshake_response, is_handshake_request, HubMessage,
};
use salvo::prelude::*;
use salvo::websocket::{Message, WebSocketUpgrade};
use serde_json::json;
use std::sync::Arc;

/// # 功能
/// 创建 `/api/v1` REST 路由。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `Router`: Salvo 路由树。
///
/// ## 副作用
/// 无。
pub fn api_router() -> Router {
    Router::with_path("api/v1")
        .push(Router::with_path("auth/login").post(login))
        .push(Router::with_path("auth/register").post(register))
        .push(resource_routes("users"))
        .push(resource_routes("teams"))
        .push(resource_routes("members"))
        .push(Router::with_path("members/join").post(create_resource))
        .push(resource_routes("invitations"))
        .push(resource_routes("worksets"))
        .push(resource_routes("comics"))
        .push(resource_routes("chapters"))
        .push(resource_routes("pages"))
        .push(resource_routes("units"))
        .push(resource_routes("assignments"))
        .push(resource_routes("role-requests"))
}

/// # 功能
/// 创建 SignalR Hub 路由。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `Router`: Salvo 路由树。
///
/// ## 副作用
/// 无。
pub fn hub_router() -> Router {
    Router::with_path("hubs/translator-collaboration")
        .push(Router::with_path("negotiate").post(negotiate_handler))
        .get(websocket_handler)
}

/// # 功能
/// 创建标准资源 CRUD 路由。
///
/// ## 参数
/// - `name`: 资源路径名称。
///
/// ## 返回
/// - `Router`: 资源路由。
///
/// ## 副作用
/// 无。
fn resource_routes(name: &'static str) -> Router {
    Router::with_path(name)
        .get(list_resource)
        .post(create_resource)
        .push(Router::with_path("mine").get(list_resource))
        .push(
            Router::with_path("<id>")
                .get(get_resource)
                .put(update_resource)
                .patch(update_resource)
                .delete(delete_resource),
        )
        .push(Router::with_path("<id>/avatar").post(presign_upload))
        .push(Router::with_path("<id>/avatar/confirm").post(update_resource))
        .push(Router::with_path("<id>/cover").post(presign_upload))
        .push(Router::with_path("<id>/cover/confirm").post(update_resource))
}

/// # 功能
/// 登录处理器。
///
/// ## 参数
/// - `depot`: Salvo 状态容器。
/// - `body`: 登录请求体。
///
/// ## 返回
/// - `Json<ApiDataResponse<LoginUserResult>>`: 登录结果。
///
/// ## 副作用
/// 当前骨架不写库。
#[handler]
async fn login(req: &mut Request, depot: &mut Depot) -> Json<ApiDataResponse<LoginUserResult>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let body = req
        .parse_json::<LoginUserArgs>()
        .await
        .unwrap_or(LoginUserArgs {
            qq: String::new(),
            password: String::new(),
        });
    let data = state
        .user_service
        .login(body)
        .await
        .unwrap_or(LoginUserResult {
            access_token: String::new(),
        });
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 注册处理器。
///
/// ## 参数
/// - `depot`: Salvo 状态容器。
/// - `body`: 注册请求体。
///
/// ## 返回
/// - `Json<ApiDataResponse<LoginUserResult>>`: 登录结果。
///
/// ## 副作用
/// 当前骨架不写库。
#[handler]
async fn register(req: &mut Request, depot: &mut Depot) -> Json<ApiDataResponse<LoginUserResult>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let body = req
        .parse_json::<RegisterUserArgs>()
        .await
        .unwrap_or(RegisterUserArgs {
            name: String::new(),
            password: String::new(),
            invitation_code: String::new(),
            username: None,
            qq: None,
        });
    let data = state
        .user_service
        .register(body)
        .await
        .unwrap_or(LoginUserResult {
            access_token: String::new(),
        });
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 列表查询处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `depot`: Salvo 状态容器。
///
/// ## 返回
/// - `Json<ApiDataResponse<Vec<DomainInfo>>>`: 资源列表。
///
/// ## 副作用
/// 只读业务服务。
#[handler]
async fn list_resource(
    req: &mut Request,
    depot: &mut Depot,
) -> Json<ApiDataResponse<Vec<DomainInfo>>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let resource = req
        .uri()
        .path()
        .trim_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("resource")
        .to_owned();
    let filter = req.parse_queries::<ListFilter>().unwrap_or_default();
    let data = state
        .domain_service
        .list(&resource, filter)
        .await
        .unwrap_or_default();
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 单资源查询处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `depot`: Salvo 状态容器。
///
/// ## 返回
/// - `Json<ApiDataResponse<DomainInfo>>`: 资源信息。
///
/// ## 副作用
/// 只读业务服务。
#[handler]
async fn get_resource(req: &mut Request, depot: &mut Depot) -> Json<ApiDataResponse<DomainInfo>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let id = req.param::<String>("id").unwrap_or_default();
    let data = state
        .domain_service
        .get("resource", &id)
        .await
        .unwrap_or_default();
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 创建资源处理器。
///
/// ## 参数
/// - `depot`: Salvo 状态容器。
/// - `body`: 创建请求体。
///
/// ## 返回
/// - `Json<ApiDataResponse<DomainInfo>>`: 创建结果。
///
/// ## 副作用
/// 当前骨架不写库。
#[handler]
async fn create_resource(
    req: &mut Request,
    depot: &mut Depot,
) -> Json<ApiDataResponse<DomainInfo>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let body = req
        .parse_json::<DomainMutationArgs>()
        .await
        .unwrap_or_default();
    let data = state
        .domain_service
        .create("resource", body)
        .await
        .unwrap_or_default();
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 更新资源处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `depot`: Salvo 状态容器。
/// - `body`: 更新请求体。
///
/// ## 返回
/// - `Json<ApiDataResponse<DomainInfo>>`: 更新结果。
///
/// ## 副作用
/// 当前骨架不写库。
#[handler]
async fn update_resource(
    req: &mut Request,
    depot: &mut Depot,
) -> Json<ApiDataResponse<DomainInfo>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let body = req
        .parse_json::<DomainMutationArgs>()
        .await
        .unwrap_or_default();
    let id = req
        .param::<String>("id")
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let data = state
        .domain_service
        .update("resource", &id, body)
        .await
        .unwrap_or_default();
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// 删除资源处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `depot`: Salvo 状态容器。
///
/// ## 返回
/// - `Json<ApiDataResponse<EmptyResponse>>`: 删除结果。
///
/// ## 副作用
/// 当前骨架不写库。
#[handler]
async fn delete_resource(
    req: &mut Request,
    depot: &mut Depot,
) -> Json<ApiDataResponse<EmptyResponse>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let id = req.param::<String>("id").unwrap_or_default();
    let _ = state.domain_service.delete("resource", &id).await;
    Json(ApiDataResponse::ok(EmptyResponse::default()))
}

/// # 功能
/// 上传预签名处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `depot`: Salvo 状态容器。
///
/// ## 返回
/// - `Json<ApiDataResponse<PresignUploadResult>>`: 预签名结果。
///
/// ## 副作用
/// 当前骨架不访问 OSS。
#[handler]
async fn presign_upload(
    req: &mut Request,
    depot: &mut Depot,
) -> Json<ApiDataResponse<PresignUploadResult>> {
    let state = depot.obtain::<Arc<ApiState>>().expect("state exists");
    let id = req
        .param::<String>("id")
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let data = state
        .oss_service
        .presign_upload("resource", &id)
        .await
        .expect("presign");
    Json(ApiDataResponse::ok(data))
}

/// # 功能
/// SignalR negotiate 响应结构。
#[derive(Clone, Debug, serde::Serialize)]
struct NegotiateResponse {
    /// # 功能
    /// SignalR 连接 ID。
    #[serde(rename = "connectionId")]
    connection_id: String,
    /// # 功能
    /// 可用传输列表。
    #[serde(rename = "availableTransports")]
    available_transports: Vec<TransportInfo>,
}

/// # 功能
/// SignalR 传输描述。
#[derive(Clone, Debug, serde::Serialize)]
struct TransportInfo {
    /// # 功能
    /// 传输名称。
    transport: String,
    /// # 功能
    /// 支持的传输格式。
    #[serde(rename = "transferFormats")]
    transfer_formats: Vec<String>,
}

/// # 功能
/// SignalR negotiate 处理器。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `Json<NegotiateResponse>`: negotiate 响应。
///
/// ## 副作用
/// 生成连接 ID。
#[handler]
async fn negotiate_handler() -> Json<NegotiateResponse> {
    Json(NegotiateResponse {
        connection_id: uuid::Uuid::new_v4().to_string(),
        available_transports: vec![
            TransportInfo {
                transport: "WebSockets".to_owned(),
                transfer_formats: vec!["Text".to_owned()],
            },
            TransportInfo {
                transport: "ServerSentEvents".to_owned(),
                transfer_formats: vec!["Text".to_owned()],
            },
            TransportInfo {
                transport: "LongPolling".to_owned(),
                transfer_formats: vec!["Text".to_owned()],
            },
        ],
    })
}

/// # 功能
/// SignalR WebSocket 处理器。
///
/// ## 参数
/// - `req`: HTTP 请求。
/// - `res`: HTTP 响应。
///
/// ## 返回
/// - `Result<(), StatusError>`: 升级结果。
///
/// ## 副作用
/// 升级连接并处理 SignalR JSON Hub 帧。
#[handler]
async fn websocket_handler(req: &mut Request, res: &mut Response) -> Result<(), StatusError> {
    WebSocketUpgrade::new()
        .upgrade(req, res, |mut ws| async move {
            while let Some(Ok(message)) = ws.recv().await {
                if message.is_text() {
                    let payload = message.as_str().unwrap_or_default().to_owned();
                    if is_handshake_request(&payload) {
                        let _ = ws.send(Message::text(handshake_response())).await;
                        continue;
                    }
                    if let Ok(messages) = decode_messages(&payload) {
                        for message in messages {
                            if let HubMessage::Invocation(invocation) = message {
                                let response = dispatch_invocation(invocation).await;
                                if let Ok(encoded) = encode_message(&response) {
                                    let _ = ws.send(Message::text(encoded)).await;
                                }
                            }
                        }
                    }
                }
            }
        })
        .await
}

/// # 功能
/// 分发 SignalR Hub Invocation。
///
/// ## 参数
/// - `invocation`: Invocation 消息。
///
/// ## 返回
/// - `HubMessage`: Completion 消息。
///
/// ## 副作用
/// 当前骨架只返回协议兼容响应。
async fn dispatch_invocation(invocation: poprako_signalr::InvocationMessage) -> HubMessage {
    let invocation_id = invocation.invocation_id.unwrap_or_else(|| "0".to_owned());
    let result = match invocation.target.as_str() {
        "JoinProject" => json!(TranslatorProjectState {
            project_key: invocation
                .arguments
                .first()
                .and_then(|v| v.get("project_key"))
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_owned(),
            page_editors: Vec::new()
        }),
        "OpenPage" => json!(null),
        "TryAcquirePageLock" => json!({ "acquired": true, "editor": null }),
        "UpdatePageLockMode" | "ReleaseCurrentPageLock" | "SyncPageSnapshot" => json!(null),
        _ => {
            return HubMessage::completion_error(
                invocation_id,
                format!("未知 Hub 方法：{}", invocation.target),
            )
        }
    };
    HubMessage::completion(invocation_id, Some(result))
}
