use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use sea_orm::{ActiveValue::Set, DatabaseConnection};

use poprako_core::{AppError, AppResult, JwtService};
use poprako_dto::{LoginUserArgs, LoginUserResult, RegisterUserArgs, UserInfo};
use poprako_entity::user::{ActiveModel as UserActiveModel, Model as UserModel};
use poprako_repository::user_repository::UserRepository;

/// # 功能
/// 用户服务，负责登录、注册、当前用户读取与用户响应转换。
#[derive(Clone)]
pub struct UserService {
    /// # 功能
    /// SeaORM 数据库连接池。
    db: DatabaseConnection,
    /// # 功能
    /// JWT 签发与校验服务。
    jwt: JwtService,
}

impl UserService {
    /// # 功能
    /// 创建用户服务。
    ///
    /// ## 参数
    /// - `db`: SeaORM 数据库连接池。
    /// - `jwt`: JWT 服务。
    ///
    /// ## 返回
    /// - `Self`: 用户服务实例。
    ///
    /// ## 副作用
    /// 无。
    pub fn new(db: DatabaseConnection, jwt: JwtService) -> Self {
        Self { db, jwt }
    }

    /// # 功能
    /// 使用 QQ 与密码登录。
    ///
    /// ## 参数
    /// - `args`: 登录参数。
    ///
    /// ## 返回
    /// - `Ok(LoginUserResult)`: 登录令牌。
    /// - `Err(AppError)`: 用户不存在、密码错误或数据库失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`；不写缓存。
    pub async fn login(&self, args: LoginUserArgs) -> AppResult<LoginUserResult> {
        let user = UserRepository::find_by_qq(&self.db, &args.qq)
            .await?
            .ok_or(AppError::Unauthorized)?;
        let password_matches = verify(args.password, &user.password_hash)
            .map_err(|error| AppError::External(error.to_string()))?;
        if !password_matches {
            return Err(AppError::Unauthorized);
        }
        let access_token = self.jwt.sign(&user.id, &user.name, user.is_super_admin)?;
        Ok(LoginUserResult { access_token })
    }

    /// # 功能
    /// 注册用户。
    ///
    /// ## 参数
    /// - `args`: 注册参数。
    ///
    /// ## 返回
    /// - `Ok(LoginUserResult)`: 注册后的登录令牌。
    /// - `Err(AppError)`: 参数、哈希或数据库失败。
    ///
    /// ## 副作用
    /// 写入 `user_table` 单行；邀请码与成员关系事务后续由 Member 模块接入。
    pub async fn register(&self, args: RegisterUserArgs) -> AppResult<LoginUserResult> {
        let name = args.username.clone().unwrap_or(args.name);
        let qq = args.qq.unwrap_or_else(|| name.clone());
        if name.trim().is_empty() || qq.trim().is_empty() || args.password.is_empty() {
            return Err(AppError::BadRequest("用户名、QQ 与密码不能为空".to_owned()));
        }
        let password_hash = hash(args.password, DEFAULT_COST)
            .map_err(|error| AppError::External(error.to_string()))?;
        let user_id = uuid::Uuid::new_v4().to_string();
        let active_model = UserActiveModel {
            id: Set(user_id.clone()),
            name: Set(name.clone()),
            qq: Set(qq),
            avatar_oss_key: Set(String::new()),
            is_avatar_uploaded: Set(false),
            password_hash: Set(password_hash),
            is_super_admin: Set(false),
            created_at: Set(Utc::now().into()),
            updated_at: Set(Utc::now().into()),
            deleted_at: Set(None),
        };
        let user = UserRepository::insert(&self.db, active_model).await?;
        let access_token = self.jwt.sign(&user.id, &user.name, user.is_super_admin)?;
        Ok(LoginUserResult { access_token })
    }

    /// # 功能
    /// 按 ID 读取当前用户信息。
    ///
    /// ## 参数
    /// - `user_id`: 用户 ID。
    ///
    /// ## 返回
    /// - `Ok(UserInfo)`: 用户响应信息。
    /// - `Err(AppError)`: 用户不存在或数据库失败。
    ///
    /// ## 副作用
    /// 只读 `user_table`。
    pub async fn current_user(&self, user_id: &str) -> AppResult<UserInfo> {
        let user = UserRepository::find_by_id(&self.db, user_id)
            .await?
            .ok_or(AppError::NotFound)?;
        Ok(Self::to_info(user))
    }

    /// # 功能
    /// 将用户实体转换为前端响应 DTO。
    ///
    /// ## 参数
    /// - `user`: 用户实体。
    ///
    /// ## 返回
    /// - `UserInfo`: 用户响应 DTO。
    ///
    /// ## 副作用
    /// 无。
    pub fn to_info(user: UserModel) -> UserInfo {
        let avatar_url = if user.avatar_oss_key.is_empty() {
            None
        } else {
            Some(user.avatar_oss_key.clone())
        };
        UserInfo {
            id: user.id,
            name: user.name.clone(),
            qq: user.qq,
            avatar_url: avatar_url.clone(),
            is_avatar_uploaded: Some(user.is_avatar_uploaded),
            is_super_admin: Some(user.is_super_admin),
            created_at: Some(user.created_at.with_timezone(&Utc)),
            updated_at: Some(user.updated_at.with_timezone(&Utc)),
            username: Some(user.name),
            avatar: avatar_url,
        }
    }
}
