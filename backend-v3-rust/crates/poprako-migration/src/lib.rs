//! Poprako Rust 后端数据库迁移。

pub use sea_orm_migration::prelude::*;
mod m20260614_000001_create_schema;

/// # 功能
/// SeaORM 迁移入口。
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    /// # 功能
    /// 返回迁移列表。
    ///
    /// ## 参数
    /// 无。
    ///
    /// ## 返回
    /// - `Vec<Box<dyn MigrationTrait>>`: 迁移列表。
    ///
    /// ## 副作用
    /// 无。
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m20260614_000001_create_schema::Migration)]
    }
}
