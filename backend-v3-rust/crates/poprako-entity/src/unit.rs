use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `unit_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`unit_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "unit_table")]
pub struct Model {
    /// # 功能
    /// 翻校单元唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 页面 ID。
    pub page_id: String,
    /// # 功能
    /// 页面内序号。
    pub index: i32,
    /// # 功能
    /// 横坐标。
    pub x_coord: f32,
    /// # 功能
    /// 纵坐标。
    pub y_coord: f32,
    /// # 功能
    /// 是否在气泡内。
    pub in_bubble: bool,
    /// # 功能
    /// 是否已校对。
    pub is_proofread: bool,
    /// # 功能
    /// 翻译文本。
    pub translated_text: Option<String>,
    /// # 功能
    /// 翻译者 ID。
    pub translator_id: Option<String>,
    /// # 功能
    /// 翻译备注。
    pub translator_comment: Option<String>,
    /// # 功能
    /// 校对文本。
    pub proofreader_text: Option<String>,
    /// # 功能
    /// 校对者 ID。
    pub proofreader_id: Option<String>,
    /// # 功能
    /// 校对备注。
    pub proofreader_comment: Option<String>,
    /// # 功能
    /// 版本号。
    pub revision: i32,
    /// # 功能
    /// 最后编辑者 ID。
    pub last_edited_by: Option<String>,
    /// # 功能
    /// 最后编辑时间。
    pub last_edited_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
}

/// # 功能
/// `unit_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `unit_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
