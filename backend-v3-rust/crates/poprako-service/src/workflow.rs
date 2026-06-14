use poprako_core::AppResult;
use poprako_dto::{DomainInfo, DomainMutationArgs, ListFilter};

use crate::DomainService;

/// # 功能
/// 工作流领域服务，聚合 Assignment、Unit、RoleRequest 与 ChapterCollaborator。
#[derive(Clone)]
pub struct WorkflowDomainService {
    /// # 功能
    /// 通用领域服务。
    domain_service: DomainService,
}

impl WorkflowDomainService {
    /// # 功能
    /// 创建工作流领域服务。
    ///
    /// ## 参数
    /// - `domain_service`: 通用领域服务。
    ///
    /// ## 返回
    /// - `Self`: 工作流领域服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(domain_service: DomainService) -> Self {
        Self { domain_service }
    }

    /// # 功能
    /// 查询指定工作流资源列表。
    ///
    /// ## 参数
    /// - `resource`: 资源名称，可为 `assignments`、`units`、`role-requests`、`chapter-collaborators`。
    /// - `filter`: 列表筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 工作流资源列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读对应工作流表。
    pub async fn list(&self, resource: &str, filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        self.domain_service.list(resource, filter).await
    }

    /// # 功能
    /// 创建指定工作流资源。
    ///
    /// ## 参数
    /// - `resource`: 资源名称。
    /// - `args`: 创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后的资源。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 写入对应工作流表；当前骨架通过通用服务占位。
    pub async fn create(&self, resource: &str, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        self.domain_service.create(resource, args).await
    }

    /// # 功能
    /// 审核岗位申请。
    ///
    /// ## 参数
    /// - `request_id`: 岗位申请 ID。
    /// - `args`: 审核参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 审核后的申请。
    /// - `Err(AppError)`: 审核失败。
    ///
    /// ## 副作用
    /// 更新 `role_request_table`；当前骨架通过通用服务占位。
    pub async fn review_role_request(
        &self,
        request_id: &str,
        args: DomainMutationArgs,
    ) -> AppResult<DomainInfo> {
        self.domain_service
            .update("role-requests", request_id, args)
            .await
    }
}
