use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `chapter_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`chapter_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "chapter_table")]
pub struct Model {
    /// # 功能
    /// 章节唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 漫画 ID。
    pub comic_id: String,
    /// # 功能
    /// 漫画内序号。
    pub index: i32,
    /// # 功能
    /// 副标题。
    pub subtitle: String,
    /// # 功能
    /// 页面数量。
    pub page_count: i32,
    /// # 功能
    /// 单元总数。
    pub total_unit_count: i32,
    /// # 功能
    /// 已翻译单元数。
    pub translated_unit_count: i32,
    /// # 功能
    /// 已校对单元数。
    pub proofread_unit_count: i32,
    /// # 功能
    /// 上传时间。
    pub uploaded_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 翻译中时间。
    pub transalating_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 翻译完成时间。
    pub translated_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 校对中时间。
    pub proofreading_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 校对完成时间。
    pub proofread_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 嵌字中时间。
    pub typesetting_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 嵌字完成时间。
    pub typeset_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 审核完成时间。
    pub reviewed_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 发布时间。
    pub published_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 创建者 ID。
    pub creator_id: String,
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
/// `chapter_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `chapter_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
