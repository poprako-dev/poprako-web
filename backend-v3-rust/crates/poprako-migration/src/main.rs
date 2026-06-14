use sea_orm_migration::prelude::*;

/// # 功能
/// 迁移命令行入口。
///
/// ## 参数
/// 无。
///
/// ## 返回
/// - `Result<(), DbErr>`: 迁移执行结果。
///
/// ## 副作用
/// 根据 `DATABASE_URL` 修改 PostgreSQL 数据库结构。
#[tokio::main]
async fn main() -> Result<(), DbErr> {
    cli::run_cli(poprako_migration::Migrator).await;
    Ok(())
}
