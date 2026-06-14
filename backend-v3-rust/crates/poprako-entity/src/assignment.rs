use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `assignment_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`assignment_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "assignment_table")]
pub struct Model {
    /// # 功能
    /// 分配唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 章节 ID。
    pub chapter_id: String,
    /// # 功能
    /// 用户 ID。
    pub user_id: String,
    /// # 功能
    /// 协作团队 ID。
    pub assigned_team_id: Option<String>,
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
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
}

/// # 功能
/// `assignment_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `assignment_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
