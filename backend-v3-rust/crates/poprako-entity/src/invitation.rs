use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `invitation_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`invitation_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "invitation_table")]
pub struct Model {
    /// # 功能
    /// 邀请唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 邀请者 ID。
    pub invitor_id: String,
    /// # 功能
    /// 团队 ID。
    pub team_id: String,
    /// # 功能
    /// 被邀请 QQ。
    pub invitee_qq: String,
    /// # 功能
    /// 邀请码。
    pub invitation_code: String,
    /// # 功能
    /// 是否授予生肉岗位。
    pub to_be_raw_provider: bool,
    /// # 功能
    /// 是否授予翻译岗位。
    pub to_be_translator: bool,
    /// # 功能
    /// 是否授予校对岗位。
    pub to_be_proofreader: bool,
    /// # 功能
    /// 是否授予嵌字岗位。
    pub to_be_typesetter: bool,
    /// # 功能
    /// 是否授予审核岗位。
    pub to_be_reviewer: bool,
    /// # 功能
    /// 是否授予发布岗位。
    pub to_be_publisher: bool,
    /// # 功能
    /// 是否授予管理员岗位。
    pub to_be_admin: bool,
    /// # 功能
    /// 是否待使用。
    pub pending: bool,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
}

/// # 功能
/// `invitation_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `invitation_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
