use chrono::Utc;
use dashmap::DashMap;
use poprako_core::{AppError, AppResult};
use poprako_dto::{
    TranslatorPageEditorState, TranslatorPageSnapshot, TranslatorProjectState,
    TryAcquirePageLockResult,
};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

/// # 功能
/// Redis fanout 信封，用于跨实例广播 SignalR Hub 事件。
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FanoutEnvelope {
    /// # 功能
    /// SignalR 客户端事件名。
    pub event: String,
    /// # 功能
    /// 事件载荷。
    pub payload: Value,
    /// # 功能
    /// 需要排除的连接 ID。
    pub exclude_connection_id: Option<String>,
}

/// # 功能
/// 协作 Redis 状态仓储。
#[derive(Clone)]
pub struct CollaborationRedisStore {
    /// # 功能
    /// Redis 客户端。
    client: redis::Client,
}

impl CollaborationRedisStore {
    /// # 功能
    /// 创建协作 Redis 状态仓储。
    ///
    /// ## 参数
    /// - `redis_url`: Redis 连接字符串。
    ///
    /// ## 返回
    /// - `Ok(Self)`: Redis 仓储实例。
    /// - `Err(AppError)`: URL 无效。
    ///
    /// ## 副作用
    /// 仅创建客户端。
    pub fn new(redis_url: &str) -> AppResult<Self> {
        Ok(Self {
            client: redis::Client::open(redis_url).map_err(|e| AppError::Redis(e.to_string()))?,
        })
    }

    /// # 功能
    /// 生成页面锁键。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `String`: Redis 键。
    ///
    /// ## 副作用
    /// 无。
    pub fn editor_key(project_key: &str, page_key: &str) -> String {
        format!("poprako:hub:{{{project_key}}}:editor:{page_key}")
    }

    /// # 功能
    /// 生成快照键。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `String`: Redis 键。
    ///
    /// ## 副作用
    /// 无。
    pub fn snapshot_key(project_key: &str, page_key: &str) -> String {
        format!("poprako:hub:{{{project_key}}}:snapshot:{page_key}")
    }

    /// # 功能
    /// 生成广播通道。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    ///
    /// ## 返回
    /// - `String`: Redis 通道。
    ///
    /// ## 副作用
    /// 无。
    pub fn fanout_channel(project_key: &str) -> String {
        format!("poprako:hub:fanout:{{{project_key}}}")
    }

    /// # 功能
    /// 尝试写入页面锁。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    /// - `editor`: 编辑者状态。
    ///
    /// ## 返回
    /// - `Ok(bool)`: 是否抢锁成功。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 可能写入 Redis 页面锁。
    pub async fn try_set_editor(
        &self,
        project_key: &str,
        page_key: &str,
        editor: &TranslatorPageEditorState,
    ) -> AppResult<bool> {
        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        let key = Self::editor_key(project_key, page_key);
        let exists: Option<String> = conn
            .get(&key)
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        if let Some(raw) = exists {
            let current: TranslatorPageEditorState =
                serde_json::from_str(&raw).map_err(|e| AppError::External(e.to_string()))?;
            if current.user_id != editor.user_id {
                return Ok(false);
            }
        }
        let value = serde_json::to_string(editor).map_err(|e| AppError::External(e.to_string()))?;
        conn.set::<_, _, ()>(&key, value)
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        Ok(true)
    }

    /// # 功能
    /// 读取页面锁持有者。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `Ok(Option<TranslatorPageEditorState>)`: 锁持有者。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 只读 Redis。
    pub async fn get_editor(
        &self,
        project_key: &str,
        page_key: &str,
    ) -> AppResult<Option<TranslatorPageEditorState>> {
        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        let raw: Option<String> = conn
            .get(Self::editor_key(project_key, page_key))
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        raw.map(|v| serde_json::from_str(&v).map_err(|e| AppError::External(e.to_string())))
            .transpose()
    }

    /// # 功能
    /// 删除页面锁。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `Ok(())`: 删除完成。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 删除 Redis 键。
    pub async fn delete_editor(&self, project_key: &str, page_key: &str) -> AppResult<()> {
        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        conn.del::<_, ()>(Self::editor_key(project_key, page_key))
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        Ok(())
    }

    /// # 功能
    /// 保存页面快照。
    ///
    /// ## 参数
    /// - `snapshot`: 页面快照。
    ///
    /// ## 返回
    /// - `Ok(())`: 保存完成。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 写入 Redis 快照键。
    pub async fn save_snapshot(&self, snapshot: &TranslatorPageSnapshot) -> AppResult<()> {
        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        let value =
            serde_json::to_string(snapshot).map_err(|e| AppError::External(e.to_string()))?;
        conn.set::<_, _, ()>(
            Self::snapshot_key(&snapshot.project_key, &snapshot.page_key),
            value,
        )
        .await
        .map_err(|e| AppError::Redis(e.to_string()))?;
        Ok(())
    }

    /// # 功能
    /// 读取页面快照。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `Ok(Option<TranslatorPageSnapshot>)`: 页面快照。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 只读 Redis。
    pub async fn get_snapshot(
        &self,
        project_key: &str,
        page_key: &str,
    ) -> AppResult<Option<TranslatorPageSnapshot>> {
        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        let raw: Option<String> = conn
            .get(Self::snapshot_key(project_key, page_key))
            .await
            .map_err(|e| AppError::Redis(e.to_string()))?;
        raw.map(|v| serde_json::from_str(&v).map_err(|e| AppError::External(e.to_string())))
            .transpose()
    }
}

/// # 功能
/// Translator 协作业务服务。
#[derive(Clone)]
pub struct TranslatorCollaborationService {
    /// # 功能
    /// Redis 状态仓储。
    store: Arc<CollaborationRedisStore>,
    /// # 功能
    /// 本机状态缓存。
    local_states: Arc<DashMap<String, TranslatorProjectState>>,
}

impl TranslatorCollaborationService {
    /// # 功能
    /// 创建 Translator 协作业务服务。
    ///
    /// ## 参数
    /// - `store`: Redis 状态仓储。
    ///
    /// ## 返回
    /// - `Self`: 协作服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(store: CollaborationRedisStore) -> Self {
        Self {
            store: Arc::new(store),
            local_states: Arc::new(DashMap::new()),
        }
    }

    /// # 功能
    /// 加入协作项目。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    ///
    /// ## 返回
    /// - `Ok(TranslatorProjectState)`: 项目状态。
    /// - `Err(AppError)`: 参数错误。
    ///
    /// ## 副作用
    /// 更新本机缓存。
    pub async fn join_project(&self, project_key: &str) -> AppResult<TranslatorProjectState> {
        if project_key.is_empty() {
            return Err(AppError::BadRequest("项目键不能为空".to_owned()));
        }
        Ok(self
            .local_states
            .entry(project_key.to_owned())
            .or_insert_with(|| TranslatorProjectState {
                project_key: project_key.to_owned(),
                page_editors: Vec::new(),
            })
            .clone())
    }

    /// # 功能
    /// 打开页面并返回最近快照。
    ///
    /// ## 参数
    /// - `snapshot`: 当前页面参数。
    ///
    /// ## 返回
    /// - `Ok(Option<TranslatorPageSnapshot>)`: 最近快照。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 只读 Redis。
    pub async fn open_page(
        &self,
        snapshot: &TranslatorPageSnapshot,
    ) -> AppResult<Option<TranslatorPageSnapshot>> {
        self.store
            .get_snapshot(&snapshot.project_key, &snapshot.page_key)
            .await
    }

    /// # 功能
    /// 尝试获取页面锁。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    /// - `editor`: 编辑者状态。
    ///
    /// ## 返回
    /// - `Ok(TryAcquirePageLockResult)`: 抢锁结果。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 可能写入 Redis 页面锁。
    pub async fn try_acquire_page_lock(
        &self,
        project_key: &str,
        page_key: &str,
        mut editor: TranslatorPageEditorState,
    ) -> AppResult<TryAcquirePageLockResult> {
        editor.acquired_at = Utc::now().timestamp_millis();
        let acquired = self
            .store
            .try_set_editor(project_key, page_key, &editor)
            .await?;
        let current = if acquired {
            Some(editor)
        } else {
            self.store.get_editor(project_key, page_key).await?
        };
        Ok(TryAcquirePageLockResult {
            acquired,
            editor: current,
        })
    }

    /// # 功能
    /// 更新页面锁模式。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    /// - `mode`: 新模式。
    ///
    /// ## 返回
    /// - `Ok(())`: 更新完成。
    /// - `Err(AppError)`: 锁不存在或 Redis 错误。
    ///
    /// ## 副作用
    /// 更新 Redis 锁内容。
    pub async fn update_page_lock_mode(
        &self,
        project_key: &str,
        page_key: &str,
        mode: &str,
    ) -> AppResult<()> {
        let mut editor = self
            .store
            .get_editor(project_key, page_key)
            .await?
            .ok_or(AppError::NotFound)?;
        editor.mode = mode.to_owned();
        self.store
            .try_set_editor(project_key, page_key, &editor)
            .await?;
        Ok(())
    }

    /// # 功能
    /// 释放当前页面锁。
    ///
    /// ## 参数
    /// - `project_key`: 项目键。
    /// - `page_key`: 页面键。
    ///
    /// ## 返回
    /// - `Ok(())`: 释放完成。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 删除 Redis 锁键。
    pub async fn release_current_page_lock(
        &self,
        project_key: &str,
        page_key: &str,
    ) -> AppResult<()> {
        self.store.delete_editor(project_key, page_key).await
    }

    /// # 功能
    /// 同步页面快照。
    ///
    /// ## 参数
    /// - `snapshot`: 页面快照。
    ///
    /// ## 返回
    /// - `Ok(())`: 同步完成。
    /// - `Err(AppError)`: Redis 错误。
    ///
    /// ## 副作用
    /// 写入 Redis 快照。
    pub async fn sync_page_snapshot(&self, snapshot: &TranslatorPageSnapshot) -> AppResult<()> {
        self.store.save_snapshot(snapshot).await
    }
}
