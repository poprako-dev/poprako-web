# Poprako Rust MVC 后端

## 功能

Salvo + SeaORM + Redis 的 Rust MVC 后端，覆盖 REST API、SignalR JSON Hub 协议子集、数据库迁移和测试入口。

## 使用说明

```bash
cp .env.sample .env
cargo run -p poprako-migration
cargo run -p poprako-api
cargo test --workspace
cargo fmt --check
```
