use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `team_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`team_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "team_table")]
pub struct Model {
    /// # 功能
    /// 团队唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 团队名称。
    pub name: String,
    /// # 功能
    /// 团队描述。
    pub description: Option<String>,
    /// # 功能
    /// 头像对象键。
    pub avatar_oss_key: Option<String>,
    /// # 功能
    /// 头像是否已上传。
    pub is_avatar_uploaded: bool,
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
/// `team_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `team_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
