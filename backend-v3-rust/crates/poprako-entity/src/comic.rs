use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `comic_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`comic_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "comic_table")]
pub struct Model {
    /// # 功能
    /// 漫画唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 工作集 ID。
    pub workset_id: String,
    /// # 功能
    /// 工作集内序号。
    pub index: i32,
    /// # 功能
    /// 标题。
    pub title: String,
    /// # 功能
    /// 作者。
    pub author: String,
    /// # 功能
    /// 描述。
    pub description: String,
    /// # 功能
    /// 章节数量。
    pub chapter_count: i32,
    /// # 功能
    /// 创建者 ID。
    pub creator_id: String,
    /// # 功能
    /// 最后活跃时间。
    pub last_active_at: DateTimeWithTimeZone,
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
/// `comic_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `comic_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
