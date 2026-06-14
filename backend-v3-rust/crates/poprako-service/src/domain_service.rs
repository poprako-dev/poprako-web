use poprako_core::{AppError, AppResult};
use poprako_dto::{DomainInfo, DomainMutationArgs, ListFilter};
use sea_orm::DatabaseConnection;

/// # 功能
/// 通用 MVC Service，承载 REST 资源编排入口。
#[derive(Clone)]
pub struct DomainService {
    /// # 功能
    /// SeaORM 数据库连接池。
    db: DatabaseConnection,
}

impl DomainService {
    /// # 功能
    /// 创建通用业务服务。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接池。
    ///
    /// ## 返回
    /// - `Self`: 业务服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    /// # 功能
    /// 返回底层数据库连接。
    ///
    /// ## 参数
    /// 无。
    ///
    /// ## 返回
    /// - `&DatabaseConnection`: 数据库连接引用。
    ///
    /// ## 副作用
    /// 无。
    pub fn db(&self) -> &DatabaseConnection {
        &self.db
    }

    /// # 功能
    /// 查询指定资源列表。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `filter`: 列表筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 资源列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读数据库；当前骨架返回空列表。
    pub async fn list(&self, resource: &str, _filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        if resource.is_empty() {
            return Err(AppError::BadRequest("资源名称不能为空".to_owned()));
        }
        Ok(Vec::new())
    }

    /// # 功能
    /// 按 ID 查询指定资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `id`: 资源 ID。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 资源信息。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读数据库；当前骨架返回轻量对象。
    pub async fn get(&self, resource: &str, id: &str) -> AppResult<DomainInfo> {
        if id.is_empty() {
            return Err(AppError::BadRequest("资源 ID 不能为空".to_owned()));
        }
        Ok(DomainInfo {
            id: id.to_owned(),
            name: Some(resource.to_owned()),
            ..DomainInfo::default()
        })
    }

    /// # 功能
    /// 创建指定资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `args`: 创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后资源。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 当前骨架不写库。
    pub async fn create(&self, resource: &str, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        Ok(DomainInfo {
            id: uuid::Uuid::new_v4().to_string(),
            name: args.name.or_else(|| Some(resource.to_owned())),
            title: args.title,
            description: args.description,
            team_id: args.team_id,
            user_id: args.user_id,
            workset_id: args.workset_id,
            comic_id: args.comic_id,
            chapter_id: args.chapter_id,
            page_id: args.page_id,
            status: args.status,
            ..DomainInfo::default()
        })
    }

    /// # 功能
    /// 更新指定资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `id`: 资源 ID。
    /// - `args`: 更新参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 更新后资源。
    /// - `Err(AppError)`: 更新失败。
    ///
    /// ## 副作用
    /// 当前骨架不写库。
    pub async fn update(
        &self,
        resource: &str,
        id: &str,
        args: DomainMutationArgs,
    ) -> AppResult<DomainInfo> {
        Ok(DomainInfo {
            id: id.to_owned(),
            name: args.name.or_else(|| Some(resource.to_owned())),
            title: args.title,
            description: args.description,
            status: args.status,
            ..DomainInfo::default()
        })
    }

    /// # 功能
    /// 删除指定资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `id`: 资源 ID。
    ///
    /// ## 返回
    /// - `Ok(())`: 删除成功。
    /// - `Err(AppError)`: 删除失败。
    ///
    /// ## 副作用
    /// 当前骨架不写库。
    pub async fn delete(&self, _resource: &str, id: &str) -> AppResult<()> {
        if id.is_empty() {
            return Err(AppError::BadRequest("资源 ID 不能为空".to_owned()));
        }
        Ok(())
    }
}
