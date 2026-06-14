use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `page_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`page_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "page_table")]
pub struct Model {
    /// # 功能
    /// 页面唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 章节 ID。
    pub chapter_id: String,
    /// # 功能
    /// 章节内序号。
    pub index: i32,
    /// # 功能
    /// 图片对象键。
    pub oss_key: Option<String>,
    /// # 功能
    /// 原始文件名。
    pub source_file_name: Option<String>,
    /// # 功能
    /// 图片宽度。
    pub image_width: Option<i32>,
    /// # 功能
    /// 图片高度。
    pub image_height: Option<i32>,
    /// # 功能
    /// 图片更新时间。
    pub image_updated_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 是否已上传。
    pub uploaded: bool,
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
    /// 翻译完成时间。
    pub translated_at: Option<DateTimeWithTimeZone>,
    /// # 功能
    /// 创建者 ID。
    pub creator_id: String,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
}

/// # 功能
/// `page_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `page_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
