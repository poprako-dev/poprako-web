use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `member_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`member_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "member_table")]
pub struct Model {
    /// # 功能
    /// 成员唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 用户 ID。
    pub user_id: String,
    /// # 功能
    /// 团队 ID。
    pub team_id: String,
    /// # 功能
    /// 生肉岗位分配时间。
    pub assigned_raw_provider_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 翻译岗位分配时间。
    pub assigned_translator_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 校对岗位分配时间。
    pub assigned_proofreader_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 嵌字岗位分配时间。
    pub assigned_typesetter_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 修图岗位分配时间。
    pub assigned_redrawer_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 审核岗位分配时间。
    pub assigned_reviewer_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 发布岗位分配时间。
    pub assigned_publisher_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 管理员岗位分配时间。
    pub assigned_admin_at: Option<DateTimeWithTimeZone>,
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
/// `member_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `member_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
