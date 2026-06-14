use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `role_request_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`role_request_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "role_request_table")]
pub struct Model {
    /// # 功能
    /// 申请唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 章节 ID。
    pub chapter_id: String,
    /// # 功能
    /// 用户 ID。
    pub user_id: String,
    /// # 功能
    /// 申请角色。
    pub role: i32,
    /// # 功能
    /// 状态。
    pub status: String,
    /// # 功能
    /// 申请团队 ID。
    pub applied_team_id: Option<String>,
    /// # 功能
    /// 申请时间。
    pub requested_at: DateTimeWithTimeZone,
    /// # 功能
    /// 审核者 ID。
    pub reviewed_by: Option<String>,
    /// # 功能
    /// 审核时间。
    pub reviewed_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 拒绝原因。
    pub rejection_reason: Option<String>,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
    /// # 功能
    /// 软删除时间。
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

/// # 功能
/// `role_request_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `role_request_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
