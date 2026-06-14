use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `chapter_collaborator_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`chapter_collaborator_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "chapter_collaborator_table")]
pub struct Model {
    /// # 功能
    /// 协作记录唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 章节 ID。
    pub chapter_id: String,
    /// # 功能
    /// 团队 ID。
    pub team_id: String,
    /// # 功能
    /// 协作角色。
    pub role: String,
    /// # 功能
    /// 状态。
    pub status: String,
    /// # 功能
    /// 创建者 ID。
    pub created_by: String,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
    /// # 功能
    /// 过期时间。
    pub expires_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 软删除时间。
    pub deleted_at: Option<DateTimeWithTimeZone>,
}

/// # 功能
/// `chapter_collaborator_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `chapter_collaborator_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
