//! SignalR JSON Hub 协议子集。

pub mod protocol;
pub use protocol::{
    decode_messages, encode_message, handshake_response, is_handshake_request, CompletionMessage,
    HubMessage, InvocationMessage, PingMessage, SignalRError, RECORD_SEPARATOR,
};
