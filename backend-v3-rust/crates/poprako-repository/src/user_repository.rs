use poprako_entity::user::{ActiveModel, Column, Entity, Model};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DbErr, EntityTrait, PaginatorTrait,
    QueryFilter, QueryOrder,
};

/// # 功能
/// user_table 仓储入口，聚合 `user_table` 表的 CRUD 与按 ID 查询。
/// 写操作单方法内独立提交，不自动开启事务；批量场景由 Service 包事务。
///
/// ## 关联
/// - 表：`user_table`
pub struct UserRepository;

impl UserRepository {
    /// # 功能
    /// 读取 `user_table` 全部行，按 `created_at` 升序返回。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    ///
    /// ## 返回
    /// - `Ok(Vec<Model>)`: 全部实体，可能为空 Vec。
    /// - `Err(DbErr)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`。
    pub async fn find_all<C>(db: &C) -> Result<Vec<Model>, DbErr>
    where
        C: ConnectionTrait,
    {
        Entity::find().order_by_asc(Column::CreatedAt).all(db).await
    }

    /// # 功能
    /// 按主键读取 `user_table` 单行。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    /// - `id`: 主键字符串。
    ///
    /// ## 返回
    /// - `Ok(Some(Model))`: 找到实体。
    /// - `Ok(None)`: 无匹配行。
    /// - `Err(DbErr)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`。
    pub async fn find_by_id<C>(db: &C, id: &str) -> Result<Option<Model>, DbErr>
    where
        C: ConnectionTrait,
    {
        Entity::find_by_id(id.to_owned()).one(db).await
    }

    /// # 功能
    /// 按 QQ 账号读取 `user_table` 单行，忽略已软删除行。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    /// - `qq`: 登录用 QQ 账号。
    ///
    /// ## 返回
    /// - `Ok(Some(Model))`: 找到用户实体。
    /// - `Ok(None)`: 无匹配用户或用户已软删除。
    /// - `Err(DbErr)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`。
    pub async fn find_by_qq<C>(db: &C, qq: &str) -> Result<Option<Model>, DbErr>
    where
        C: ConnectionTrait,
    {
        Entity::find()
            .filter(Column::Qq.eq(qq.to_owned()))
            .filter(Column::DeletedAt.is_null())
            .one(db)
            .await
    }

    /// # 功能
    /// 统计 `user_table` 全部行数。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    ///
    /// ## 返回
    /// - `Ok(u64)`: 总行数。
    /// - `Err(DbErr)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`。
    pub async fn count_all<C>(db: &C) -> Result<u64, DbErr>
    where
        C: ConnectionTrait,
    {
        Entity::find().count(db).await
    }

    /// # 功能
    /// 插入 `user_table` 单行。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    /// - `active_model`: 待插入 ActiveModel。
    ///
    /// ## 返回
    /// - `Ok(Model)`: 插入后实体。
    /// - `Err(DbErr)`: 写入失败。
    ///
    /// ## 副作用
    /// 写入 `user_table` 单行。
    pub async fn insert<C>(db: &C, active_model: ActiveModel) -> Result<Model, DbErr>
    where
        C: ConnectionTrait,
    {
        active_model.insert(db).await
    }

    /// # 功能
    /// 更新 `user_table` 单行。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    /// - `active_model`: 待更新 ActiveModel。
    ///
    /// ## 返回
    /// - `Ok(Model)`: 更新后实体。
    /// - `Err(DbErr)`: 更新失败。
    ///
    /// ## 副作用
    /// 更新 `user_table` 单行。
    pub async fn update<C>(db: &C, active_model: ActiveModel) -> Result<Model, DbErr>
    where
        C: ConnectionTrait,
    {
        active_model.update(db).await
    }

    /// # 功能
    /// 按主键删除 `user_table` 单行。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接，可为池连接或事务句柄。
    /// - `id`: 主键字符串。
    ///
    /// ## 返回
    /// - `Ok(())`: 删除命令已执行。
    /// - `Err(DbErr)`: 删除失败。
    ///
    /// ## 副作用
    /// 删除 `user_table` 单行。
    pub async fn delete_by_id<C>(db: &C, id: &str) -> Result<(), DbErr>
    where
        C: ConnectionTrait,
    {
        Entity::delete_by_id(id.to_owned())
            .exec(db)
            .await
            .map(|_| ())
    }
}
