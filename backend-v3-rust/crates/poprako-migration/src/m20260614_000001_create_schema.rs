use sea_orm_migration::prelude::*;

/// # 功能
/// 创建 Poprako 共享数据库结构。
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    /// # 功能
    /// 执行建表迁移。
    ///
    /// ## 参数
    /// - `manager`: SeaORM schema manager。
    ///
    /// ## 返回
    /// - `Result<(), DbErr>`: 执行结果。
    ///
    /// ## 副作用
    /// 创建扩展与业务表。
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(SCHEMA_SQL)
            .await?;
        Ok(())
    }

    /// # 功能
    /// 回滚建表迁移。
    ///
    /// ## 参数
    /// - `manager`: SeaORM schema manager。
    ///
    /// ## 返回
    /// - `Result<(), DbErr>`: 执行结果。
    ///
    /// ## 副作用
    /// 删除业务表。
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(DROP_SQL)
            .await?;
        Ok(())
    }
}

impl MigrationName for Migration {
    /// # 功能
    /// 返回迁移名称。
    ///
    /// ## 参数
    /// 无。
    ///
    /// ## 返回
    /// - `&str`: 迁移名称。
    ///
    /// ## 副作用
    /// 无。
    fn name(&self) -> &str {
        "m20260614_000001_create_schema"
    }
}

/// # 功能
/// 建表 SQL。
const SCHEMA_SQL: &str = r#"
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TABLE IF NOT EXISTS user_table (id text PRIMARY KEY, name text NOT NULL, qq text NOT NULL UNIQUE, avatar_oss_key text NOT NULL DEFAULT '', is_avatar_uploaded boolean NOT NULL DEFAULT false, password_hash text NOT NULL DEFAULT '', is_super_admin boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE IF NOT EXISTS team_table (id text PRIMARY KEY, name text NOT NULL UNIQUE, description text, avatar_oss_key text, is_avatar_uploaded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE IF NOT EXISTS member_table (id text PRIMARY KEY, user_id text NOT NULL REFERENCES user_table(id) ON DELETE CASCADE, team_id text NOT NULL REFERENCES team_table(id) ON DELETE CASCADE, assigned_raw_provider_at timestamptz, assigned_translator_at timestamptz, assigned_proofreader_at timestamptz, assigned_typesetter_at timestamptz, assigned_redrawer_at timestamptz, assigned_reviewer_at timestamptz, assigned_publisher_at timestamptz, assigned_admin_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE IF NOT EXISTS invitation_table (id text PRIMARY KEY, invitor_id text NOT NULL REFERENCES user_table(id) ON DELETE CASCADE, team_id text NOT NULL REFERENCES team_table(id) ON DELETE CASCADE, invitee_qq text NOT NULL, invitation_code text NOT NULL UNIQUE, to_be_raw_provider boolean NOT NULL DEFAULT false, to_be_translator boolean NOT NULL DEFAULT false, to_be_proofreader boolean NOT NULL DEFAULT false, to_be_typesetter boolean NOT NULL DEFAULT false, to_be_reviewer boolean NOT NULL DEFAULT false, to_be_publisher boolean NOT NULL DEFAULT false, to_be_admin boolean NOT NULL DEFAULT false, pending boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS workset_table (id text PRIMARY KEY, team_id text NOT NULL REFERENCES team_table(id) ON DELETE CASCADE, index integer NOT NULL, name text NOT NULL, description text, author text, status text, cover_oss_key text NOT NULL DEFAULT '', is_cover_uploaded boolean NOT NULL DEFAULT false, translator_user_id text REFERENCES user_table(id) ON DELETE SET NULL, proofreader_user_id text REFERENCES user_table(id) ON DELETE SET NULL, typesetter_user_id text REFERENCES user_table(id) ON DELETE SET NULL, reviewer_user_id text REFERENCES user_table(id) ON DELETE SET NULL, comic_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(team_id, index));
CREATE TABLE IF NOT EXISTS comic_table (id text PRIMARY KEY, workset_id text NOT NULL REFERENCES workset_table(id) ON DELETE CASCADE, index integer NOT NULL, title text NOT NULL, author text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', chapter_count integer NOT NULL DEFAULT 0, creator_id text NOT NULL REFERENCES user_table(id) ON DELETE RESTRICT, last_active_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(workset_id, index));
CREATE TABLE IF NOT EXISTS chapter_table (id text PRIMARY KEY, comic_id text NOT NULL REFERENCES comic_table(id) ON DELETE CASCADE, index integer NOT NULL DEFAULT 0, subtitle text NOT NULL DEFAULT '', page_count integer NOT NULL DEFAULT 0, total_unit_count integer NOT NULL DEFAULT 0, translated_unit_count integer NOT NULL DEFAULT 0, proofread_unit_count integer NOT NULL DEFAULT 0, uploaded_at timestamptz, transalating_at timestamptz, translated_at timestamptz, proofreading_at timestamptz, proofread_at timestamptz, typesetting_at timestamptz, typeset_at timestamptz, reviewed_at timestamptz, published_at timestamptz, creator_id text NOT NULL REFERENCES user_table(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz, UNIQUE(comic_id, index));
CREATE TABLE IF NOT EXISTS chapter_collaborator_table (id text PRIMARY KEY, chapter_id text NOT NULL REFERENCES chapter_table(id) ON DELETE CASCADE, team_id text NOT NULL REFERENCES team_table(id) ON DELETE CASCADE, role text NOT NULL, status text NOT NULL DEFAULT 'active', created_by text NOT NULL REFERENCES user_table(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, deleted_at timestamptz);
CREATE TABLE IF NOT EXISTS page_table (id text PRIMARY KEY, chapter_id text NOT NULL REFERENCES chapter_table(id) ON DELETE CASCADE, index integer NOT NULL DEFAULT 0, oss_key text, source_file_name text, image_width integer, image_height integer, image_updated_at timestamptz, uploaded boolean NOT NULL DEFAULT false, total_unit_count integer NOT NULL DEFAULT 0, translated_unit_count integer NOT NULL DEFAULT 0, proofread_unit_count integer NOT NULL DEFAULT 0, translated_at timestamptz, creator_id text NOT NULL REFERENCES user_table(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chapter_id, index));
CREATE TABLE IF NOT EXISTS unit_table (id text PRIMARY KEY, page_id text NOT NULL REFERENCES page_table(id) ON DELETE CASCADE, index integer NOT NULL, x_coord real NOT NULL, y_coord real NOT NULL, in_bubble boolean NOT NULL DEFAULT true, is_proofread boolean NOT NULL DEFAULT false, translated_text text, translator_id text REFERENCES user_table(id) ON DELETE SET NULL, translator_comment text, proofreader_text text, proofreader_id text REFERENCES user_table(id) ON DELETE SET NULL, proofreader_comment text, revision integer NOT NULL DEFAULT 1, last_edited_by text REFERENCES user_table(id) ON DELETE SET NULL, last_edited_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(page_id, index));
CREATE TABLE IF NOT EXISTS assignment_table (id text PRIMARY KEY, chapter_id text NOT NULL REFERENCES chapter_table(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES user_table(id) ON DELETE CASCADE, assigned_team_id text REFERENCES team_table(id) ON DELETE RESTRICT, assigned_raw_provider_at timestamptz, assigned_translator_at timestamptz, assigned_proofreader_at timestamptz, assigned_typesetter_at timestamptz, assigned_redrawer_at timestamptz, assigned_reviewer_at timestamptz, assigned_publisher_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(chapter_id, user_id));
CREATE TABLE IF NOT EXISTS role_request_table (id text PRIMARY KEY, chapter_id text NOT NULL REFERENCES chapter_table(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES user_table(id) ON DELETE CASCADE, role integer NOT NULL, status text NOT NULL DEFAULT 'pending', applied_team_id text REFERENCES team_table(id) ON DELETE SET NULL, requested_at timestamptz NOT NULL DEFAULT now(), reviewed_by text REFERENCES user_table(id) ON DELETE SET NULL, reviewed_at timestamptz, rejection_reason text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE IF NOT EXISTS app_migration_record_table (version text PRIMARY KEY, name text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
"#;

/// # 功能
/// 回滚 SQL。
const DROP_SQL: &str = r#"
DROP TABLE IF EXISTS app_migration_record_table;
DROP TABLE IF EXISTS role_request_table;
DROP TABLE IF EXISTS assignment_table;
DROP TABLE IF EXISTS unit_table;
DROP TABLE IF EXISTS page_table;
DROP TABLE IF EXISTS chapter_collaborator_table;
DROP TABLE IF EXISTS chapter_table;
DROP TABLE IF EXISTS comic_table;
DROP TABLE IF EXISTS workset_table;
DROP TABLE IF EXISTS invitation_table;
DROP TABLE IF EXISTS member_table;
DROP TABLE IF EXISTS team_table;
DROP TABLE IF EXISTS user_table;
"#;
