use serde::{Deserialize, Serialize};
use serde_json::Value;

/// # 功能
/// SignalR JSON Hub 协议记录分隔符。
pub const RECORD_SEPARATOR: char = '';

/// # 功能
/// SignalR 协议错误。
#[derive(Debug, thiserror::Error)]
pub enum SignalRError {
    /// # 功能
    /// JSON 序列化或反序列化失败。
    #[error("JSON 协议错误：{0}")]
    Json(#[from] serde_json::Error),
    /// # 功能
    /// 不支持的协议消息。
    #[error("不支持的 SignalR 消息")]
    Unsupported,
}

/// # 功能
/// SignalR Invocation 消息。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InvocationMessage {
    /// # 功能
    /// 消息类型，Invocation 固定为 1。
    #[serde(rename = "type")]
    pub message_type: i32,
    /// # 功能
    /// 调用 ID。
    #[serde(rename = "invocationId", skip_serializing_if = "Option::is_none")]
    pub invocation_id: Option<String>,
    /// # 功能
    /// Hub 方法或客户端事件名。
    pub target: String,
    /// # 功能
    /// 调用参数。
    #[serde(default)]
    pub arguments: Vec<Value>,
}

/// # 功能
/// SignalR Completion 消息。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CompletionMessage {
    /// # 功能
    /// 消息类型，Completion 固定为 3。
    #[serde(rename = "type")]
    pub message_type: i32,
    /// # 功能
    /// 对应 Invocation ID。
    #[serde(rename = "invocationId")]
    pub invocation_id: String,
    /// # 功能
    /// 成功结果。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    /// # 功能
    /// 错误消息。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// # 功能
/// SignalR Ping 消息。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PingMessage {
    /// # 功能
    /// 消息类型，Ping 固定为 6。
    #[serde(rename = "type")]
    pub message_type: i32,
}

/// # 功能
/// SignalR Hub 消息枚举。
#[derive(Clone, Debug)]
pub enum HubMessage {
    /// # 功能
    /// Invocation 消息。
    Invocation(InvocationMessage),
    /// # 功能
    /// Completion 消息。
    Completion(CompletionMessage),
    /// # 功能
    /// Ping 消息。
    Ping(PingMessage),
}

impl HubMessage {
    /// # 功能
    /// 构造成功 Completion。
    ///
    /// ## 参数
    /// - `invocation_id`: 调用 ID。
    /// - `result`: 调用结果。
    ///
    /// ## 返回
    /// - `Self`: Completion 消息。
    ///
    /// ## 副作用
    /// 无。
    pub fn completion(invocation_id: String, result: Option<Value>) -> Self {
        Self::Completion(CompletionMessage {
            message_type: 3,
            invocation_id,
            result,
            error: None,
        })
    }

    /// # 功能
    /// 构造失败 Completion。
    ///
    /// ## 参数
    /// - `invocation_id`: 调用 ID。
    /// - `error`: 错误消息。
    ///
    /// ## 返回
    /// - `Self`: Completion 消息。
    ///
    /// ## 副作用
    /// 无。
    pub fn completion_error(invocation_id: String, error: String) -> Self {
        Self::Completion(CompletionMessage {
            message_type: 3,
            invocation_id,
            result: None,
            error: Some(error),
        })
    }

    /// # 功能
    /// 构造服务端推送事件。
    ///
    /// ## 参数
    /// - `target`: 客户端事件名。
    /// - `payload`: 事件载荷。
    ///
    /// ## 返回
    /// - `Self`: 无调用 ID 的 Invocation。
    ///
    /// ## 副作用
    /// 无。
    pub fn event(target: &str, payload: Value) -> Self {
        Self::Invocation(InvocationMessage {
            message_type: 1,
            invocation_id: None,
            target: target.to_owned(),
            arguments: vec![payload],
        })
    }
}

/// # 功能
/// 判断文本帧是否为 SignalR JSON Hub 握手请求。
///
/// ## 参数
/// - `payload`: WebSocket 文本帧。
///
/// ## 返回
/// - `true`: 是握手请求。
/// - `false`: 不是握手请求。
///
/// ## 副作用
/// 无。
pub fn is_handshake_request(payload: &str) -> bool {
    payload.contains("\"protocol\"")
        && payload.contains("\"json\"")
        && payload.contains("\"version\"")
}

/// # 功能
/// 生成 SignalR JSON Hub 握手成功响应。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `String`: `{}\x1e` 文本帧。
///
/// ## 副作用
/// 无。
pub fn handshake_response() -> String {
    format!("{{}}{RECORD_SEPARATOR}")
}

/// # 功能
/// 解码 SignalR 文本帧中的 Hub 消息。
///
/// ## 参数
/// - `payload`: WebSocket 文本帧。
///
/// ## 返回
/// - `Ok(Vec<HubMessage>)`: 消息列表。
/// - `Err(SignalRError)`: 协议错误。
///
/// ## 副作用
/// 无。
pub fn decode_messages(payload: &str) -> Result<Vec<HubMessage>, SignalRError> {
    let mut messages = Vec::new();
    for raw in payload
        .split(RECORD_SEPARATOR)
        .filter(|part| !part.trim().is_empty())
    {
        if raw.contains("\"protocol\"") && raw.contains("\"version\"") {
            continue;
        }
        let value: Value = serde_json::from_str(raw)?;
        match value.get("type").and_then(Value::as_i64) {
            Some(1) => messages.push(HubMessage::Invocation(serde_json::from_value(value)?)),
            Some(3) => messages.push(HubMessage::Completion(serde_json::from_value(value)?)),
            Some(6) => messages.push(HubMessage::Ping(PingMessage { message_type: 6 })),
            _ => return Err(SignalRError::Unsupported),
        }
    }
    Ok(messages)
}

/// # 功能
/// 编码 SignalR Hub 消息为文本帧。
///
/// ## 参数
/// - `message`: Hub 消息。
///
/// ## 返回
/// - `Ok(String)`: 带记录分隔符的文本。
/// - `Err(SignalRError)`: 序列化失败。
///
/// ## 副作用
/// 无。
pub fn encode_message(message: &HubMessage) -> Result<String, SignalRError> {
    let raw = match message {
        HubMessage::Invocation(value) => serde_json::to_string(value)?,
        HubMessage::Completion(value) => serde_json::to_string(value)?,
        HubMessage::Ping(value) => serde_json::to_string(value)?,
    };
    Ok(format!("{raw}{RECORD_SEPARATOR}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn decode_messages_splits_record_separator_frames() {
        let payload = "{\"type\":1,\"invocationId\":\"1\",\"target\":\"JoinProject\",\"arguments\":[{}]}\x1e{\"type\":6}\x1e";
        let messages = decode_messages(payload).expect("decode");
        assert_eq!(messages.len(), 2);
    }
    #[test]
    fn encode_message_appends_record_separator() {
        let payload = encode_message(&HubMessage::event(
            "ProjectStateUpdated",
            json!({"project_key":"p1"}),
        ))
        .expect("encode");
        assert!(payload.ends_with(RECORD_SEPARATOR));
    }

    #[test]
    fn handshake_response_matches_signalr_json_protocol() {
        assert!(is_handshake_request(
            "{\"protocol\":\"json\",\"version\":1}\x1e"
        ));
        assert_eq!(handshake_response(), "{}\x1e");
    }
}
