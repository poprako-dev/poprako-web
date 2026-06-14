use poprako_core::{AppConfig, AppError, AppResult};
use poprako_dto::PresignUploadResult;

/// # 功能
/// OSS 预签名服务。
#[derive(Clone, Debug)]
pub struct OssService {
    /// # 功能
    /// OSS 公网基础地址。
    public_base_url: Option<String>,
    /// # 功能
    /// OSS S3 兼容端点。
    endpoint: Option<String>,
    /// # 功能
    /// OSS 存储桶名称。
    bucket: Option<String>,
}

impl OssService {
    /// # 功能
    /// 基于应用配置创建 OSS 服务。
    ///
    /// ## 参数
    /// - `config`: 应用配置。
    ///
    /// ## 返回
    /// - `Self`: OSS 服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(config: &AppConfig) -> Self {
        Self {
            public_base_url: config.oss_public_base_url.clone(),
            endpoint: config.oss_endpoint.clone(),
            bucket: config.oss_bucket.clone(),
        }
    }

    /// # 功能
    /// 生成上传预签名结果。
    ///
    /// ## 参数
    /// - `scope`: 上传场景。
    /// - `resource_id`: 资源 ID。
    ///
    /// ## 返回
    /// - `Ok(PresignUploadResult)`: 上传地址、对象键与公网地址。
    /// - `Err(AppError)`: 参数不合法。
    ///
    /// ## 副作用
    /// 当前阶段不访问 OSS 网络；返回与 S3/R2/OSS 兼容的目标 URL 占位。
    pub async fn presign_upload(
        &self,
        scope: &str,
        resource_id: &str,
    ) -> AppResult<PresignUploadResult> {
        if scope.is_empty() || resource_id.is_empty() {
            return Err(AppError::BadRequest(
                "上传场景和资源 ID 不能为空".to_owned(),
            ));
        }
        let oss_key = format!("{scope}/{resource_id}/{}", uuid::Uuid::new_v4());
        let public_url = self
            .public_base_url
            .as_ref()
            .map(|base| format!("{}/{}", base.trim_end_matches('/'), oss_key));
        let upload_url = self
            .endpoint
            .as_ref()
            .zip(self.bucket.as_ref())
            .map(|(endpoint, bucket)| {
                format!(
                    "{}/{}/{}",
                    endpoint.trim_end_matches('/'),
                    bucket.trim_matches('/'),
                    oss_key
                )
            })
            .or_else(|| public_url.clone())
            .unwrap_or_else(|| format!("oss://{oss_key}"));
        Ok(PresignUploadResult {
            upload_url,
            oss_key,
            public_url,
        })
    }
}
