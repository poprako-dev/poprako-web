use poprako_core::AppResult;
use poprako_dto::{DomainInfo, DomainMutationArgs, ListFilter};

use crate::DomainService;

/// # 功能
/// 团队领域服务，聚合 Team、Member、Invitation 三个协作入口。
#[derive(Clone)]
pub struct TeamDomainService {
    /// # 功能
    /// 通用领域服务。
    domain_service: DomainService,
}

impl TeamDomainService {
    /// # 功能
    /// 创建团队领域服务。
    ///
    /// ## 参数
    /// - `domain_service`: 通用领域服务。
    ///
    /// ## 返回
    /// - `Self`: 团队领域服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(domain_service: DomainService) -> Self {
        Self { domain_service }
    }

    /// # 功能
    /// 查询团队列表。
    ///
    /// ## 参数
    /// - `filter`: 列表筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 团队列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读团队相关表。
    pub async fn list_teams(&self, filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        self.domain_service.list("teams", filter).await
    }

    /// # 功能
    /// 创建团队。
    ///
    /// ## 参数
    /// - `args`: 团队创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后的团队。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 写入 `team_table`；当前骨架通过通用服务占位。
    pub async fn create_team(&self, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        self.domain_service.create("teams", args).await
    }

    /// # 功能
    /// 查询成员列表。
    ///
    /// ## 参数
    /// - `filter`: 成员筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 成员列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `member_table`。
    pub async fn list_members(&self, filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        self.domain_service.list("members", filter).await
    }

    /// # 功能
    /// 创建成员。
    ///
    /// ## 参数
    /// - `args`: 成员创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后的成员。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 写入 `member_table`；当前骨架通过通用服务占位。
    pub async fn create_member(&self, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        self.domain_service.create("members", args).await
    }

    /// # 功能
    /// 查询邀请列表。
    ///
    /// ## 参数
    /// - `filter`: 邀请筛选参数。
    ///
    /// ## 返回
    /// - `Ok(Vec<DomainInfo>)`: 邀请列表。
    /// - `Err(AppError)`: 查询失败。
    ///
    /// ## 副作用
    /// 只读 `invitation_table`。
    pub async fn list_invitations(&self, filter: ListFilter) -> AppResult<Vec<DomainInfo>> {
        self.domain_service.list("invitations", filter).await
    }

    /// # 功能
    /// 创建邀请。
    ///
    /// ## 参数
    /// - `args`: 邀请创建参数。
    ///
    /// ## 返回
    /// - `Ok(DomainInfo)`: 创建后的邀请。
    /// - `Err(AppError)`: 创建失败。
    ///
    /// ## 副作用
    /// 写入 `invitation_table`；当前骨架通过通用服务占位。
    pub async fn create_invitation(&self, args: DomainMutationArgs) -> AppResult<DomainInfo> {
        self.domain_service.create("invitations", args).await
    }
}
