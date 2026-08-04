# Frontend Deployment

生产部署由 `.github/workflows/ci.yml` 在 `main` 通过全部检查后触发。部署 job 使用
GitHub Actions `production` environment；environment 与所需仓库配置已经建立，
不支持从开发机直接发布。

## 生产拓扑

```text
Cloudflare (proxied)
  -> poprako-web-nginx:80/443 on the production host
       |- poprako.com -> SPA files and /api/* -> poprako-server-prod:8888
       `- api.poprako.com (DNS only, same host) -> poprako-server-prod:8888

Docker network: poprako-prod
```

Nginx 以独立容器运行，是唯一公开 80/443 的入口。它和后端容器加入
`poprako-prod` 网络；PostgreSQL 不加入前端发布链路。权威 Nginx 配置保存在
`deploy/poprako-web/nginx.conf`，远端安装路径是
`/opt/poprako-web/nginx.conf`。

两个域名解析到同一台生产服务器，但使用不同代理方式：主站经 Cloudflare 代理，
`api.poprako.com` 为 DNS-only。主站继续反代 `/api/*`，以 443 暴露后端；部署 job
从 `production` environment 的 `API_BASE_URL` secret 注入构建，其值必须为
`https://api.poprako.com/api/v1`。API 域名通过 CORS 只允许 `https://poprako.com`。

`/api/health` 只接受后端容器自身的 loopback 请求。跨容器请求即使来自同一
Docker network 也不是 loopback，因此前端部署不得用该接口做健康检查。

## 发布布局

```text
/var/www/poprako-web
|- current -> releases/<full-commit-sha>/site
|- previous -> releases/<previous-full-commit-sha>/site
`- releases/
   `- <full-commit-sha>/
      |- poprako-web-sha-<full-commit-sha>.tar.gz
      |- ga-remote-deploy.sh
      `- site/
```

新版本完整解压并确认存在 `index.html` 后，脚本才原子切换 `current`。健康检查
失败时恢复 `previous`；成功后只保留当前和上一个 SHA 版本。不要直接修改 release
目录内的文件。

## 权限与证书

- 维护操作使用 SSH 别名 `prk-deploy`；CI 通过仓库配置直接连接同一个远端
  `deploy` 用户。
- `deploy:deploy` 管理 `/var/www/poprako-web`，目录权限为 `0755`，文件权限为
  `0644`。
- Nginx 只读挂载前端发布目录；CI 用户不需要修改 Nginx 容器或配置。
- `/opt/poprako-web/nginx.conf`、`/var/www/certbot` 和
  `/etc/letsencrypt` 继续由 root 管理。
- Certbot 使用 `/var/www/certbot` 的 webroot 完成 HTTP-01 验证，续期成功后通过
  deploy hook reload `poprako-web-nginx`。
- 服务器配置操作记录在远端 `/root/CHANGELOG.md`，仓库文档不复制服务器凭据。

## GitHub Actions 契约

`production` environment 向部署 job 提供以下值：

```text
DEPLOY_HOST
DEPLOY_USER
DEPLOY_PORT
DEPLOY_ROOT
DEPLOY_HEALTHCHECK_URL
DEPLOY_SSH_PRIVATE_KEY
DEPLOY_KNOWN_HOSTS
API_BASE_URL
```

这些值只存在于 GitHub 配置中，不提交 `.env` 或示例凭据文件。当前生产契约要求：

```text
DEPLOY_USER=deploy
DEPLOY_ROOT=/var/www/poprako-web
DEPLOY_HEALTHCHECK_URL=https://poprako.com/
API_BASE_URL=https://api.poprako.com/api/v1
```

`DEPLOY_KNOWN_HOSTS` 必须使用预先核验的主机公钥记录；workflow 不得通过
`ssh-keyscan` 动态信任目标。

## 部署流程

`scripts/ci-deploy-production.sh` 在 GitHub runner 上：

1. 使用 frozen lockfile 安装依赖并执行生产构建；
2. 用完整 commit SHA 创建不可变 tarball；
3. 通过固定 known-host 校验上传产物和远程脚本；
4. 调用 `scripts/ga-remote-deploy.sh` 解压并原子切换 symlink；
5. 请求 `https://poprako.com/` 验证新站点，失败时恢复旧 symlink。

环境审批、执行者、commit 和结果由 GitHub Actions 保存审计记录。

## 验证与回滚

仓库内的部署测试覆盖产物结构、重复 SHA 幂等、symlink 切换、健康检查失败回滚
和版本保留：

```sh
sh scripts/test-deployment.sh
sh scripts/ci-check.sh
```

成功部署的 job 输出包含 `deployed_commit`、`current_site` 和
`healthcheck=passed`。服务器只读检查使用：

```sh
ssh prk-deploy 'readlink /var/www/poprako-web/current'
curl --fail --location https://poprako.com/
```

需要回滚时，重新运行目标历史 `main` commit 的 deployment。当前脚本只保留当前
和上一版本；不要人工覆盖 `current` 指向的站点内容。
