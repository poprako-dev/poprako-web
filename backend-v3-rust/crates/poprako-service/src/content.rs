use poprako_core::AppResult;
use poprako_dto::{DomainInfo, DomainMutationArgs, ListFilter};

use crate::DomainService;

/// # 功能
/// 内容领域服务，聚合 Workset、Comic、Chapter、Page 的 MVC Service 入口。
#[derive(Clone)]
pub struct ContentDomainService {
    /// # 功能
    /// 通用领域服务。
    domain_service: DomainService,
}

impl ContentDomainService {
    /// # 功能
    /// 创建内容领域服务。
    ///
    /// ## 参数
    /// - `domain_service`: 通用领域服务。
    ///
    /// ## 返回
    /// - `Self`: 内容领域服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(domain_service: DomainService) -> Self {
        Self { domain_service }
    }

    /// # 功能
    /// 查询指定内容资源列表。
    ///
    /// ## 参数
    /// - `resource`: 资源名称，可为 `worksets`、`comics`、`chapters`、`pages`。
    /// - `filter`: 列表筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 内容资源列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读对应内容表。
    pub async fn list(&self, resource: &str, filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        self.domain_service.list(resource, filter).await
    }

    /// # 功能
    /// 创建指定内容资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称，可为 `worksets`、`comics`、`chapters`、`pages`。
    /// - `args`: 创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后的内容资源。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 写入对应内容表；当前骨架通过通用服务占位。
    pub async fn create(&self, resource: &str, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        self.domain_service.create(resource, args).await
    }

    /// # 功能
    /// 更新指定内容资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `id`: 资源 ID。
    /// - `args`: 更新参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 更新后的内容资源。
    /// - `Err(AppError)`: 更新失败。
    ///
    /// ## 副作用
    /// 更新对应内容表；当前骨架通过通用服务占位。
    pub async fn update(
        &self,
        resource: &str,
        id: &str,
        args: DomainMutationArgs,
    ) -> AppResult<DomainInfo> {
        self.domain_service.update(resource, id, args).await
    }
}
