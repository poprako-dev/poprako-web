use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// # 功能
/// `workset_table` 的 SeaORM 实体模型。
///
/// ## 关联
/// - 表：`workset_table`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "workset_table")]
pub struct Model {
    /// # 功能
    /// 工作集唯一标识。
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// # 功能
    /// 团队 ID。
    pub team_id: String,
    /// # 功能
    /// 团队内序号。
    pub index: i32,
    /// # 功能
    /// 工作集名称。
    pub name: String,
    /// # 功能
    /// 工作集描述。
    pub description: Option<String>,
    /// # 功能
    /// 作者。
    pub author: Option<String>,
    /// # 功能
    /// 状态。
    pub status: Option<String>,
    /// # 功能
    /// 封面对象键。
    pub cover_oss_key: String,
    /// # 功能
    /// 封面是否已上传。
    pub is_cover_uploaded: bool,
    /// # 功能
    /// 默认翻译用户 ID。
    pub translator_user_id: Option<String>,
    /// # 功能
    /// 默认校对用户 ID。
    pub proofreader_user_id: Option<String>,
    /// # 功能
    /// 默认嵌字用户 ID。
    pub typesetter_user_id: Option<String>,
    /// # 功能
    /// 默认审核用户 ID。
    pub reviewer_user_id: Option<String>,
    /// # 功能
    /// 漫画数量。
    pub comic_count: i32,
    /// # 功能
    /// 创建时间。
    pub created_at: DateTimeWithTimeZone,
    /// # 功能
    /// 更新时间。
    pub updated_at: DateTimeWithTimeZone,
}

/// # 功能
/// `workset_table` 的关系枚举。
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

/// # 功能
/// `workset_table` ActiveModel 行为入口。
impl ActiveModelBehavior for ActiveModel {}
