# Frontend Deployment

生产部署由 `.github/workflows/ci.yml` 在 `main` 通过所有检查后触发。部署 job
使用受保护的 `production` environment，不支持从开发机直接发布。

## 发布布局

```text
/var/www/poprako-web
|- current -> releases/<full-commit-sha>/site
|- previous -> releases/<previous-full-commit-sha>/site
|- releases/
|  |- <full-commit-sha>/
|     |- poprako-web-sha-<full-commit-sha>.tar.gz
|     |- ga-remote-deploy.sh
|     |- site/
```

新版本解压完成并验证 `index.html` 后才原子切换 `current`。健康检查失败时
恢复 `previous`；成功后只保留当前和上一个 SHA 版本。

## 一次性主机准备

1. 创建专用、非 root 部署用户，并让它拥有专用部署目录。

```sh
sudo install -d -o poprako-deploy -g poprako-deploy \
  /var/www/poprako-web/releases
```

2. 按 `deploy/poprako-web/nginx.conf.example` 配置站点、域名和 TLS，再验证并重载
   nginx。

```sh
sudo nginx -t
sudo systemctl reload nginx
```

3. 为 GitHub 仓库创建受保护的 `production` environment，要求部署审批，并按
   `deploy/poprako-web/github-production-secrets.env.example` 配置 environment
   secrets。

部署私钥应只允许专用用户访问该目录。`DEPLOY_KNOWN_HOSTS` 必须来自预先核验
的主机公钥，不能在 workflow 中使用 `ssh-keyscan` 动态信任目标。

## 部署流程

`scripts/ci-deploy-production.sh` 在 GitHub runner 上：

1. 以 frozen lockfile 安装依赖并执行生产构建；
2. 用完整 commit SHA 创建不可变 tarball；
3. 通过严格 known-host 校验上传产物和远程脚本；
4. 调用 `scripts/ga-remote-deploy.sh` 解压并切换 symlink；
5. 通过 `DEPLOY_HEALTHCHECK_URL` 验证 nginx 暴露的新站点。

远程脚本在失败时恢复旧 symlink。部署 job 的环境审批、执行者、commit 和结果
由 GitHub Actions 保留审计记录。

## 验证与回滚

成功部署应在 job 输出中包含 `deployed_commit`、`current_site` 和 HTTP 健康检查
结果。主机上可以只读确认：

```sh
readlink /var/www/poprako-web/current
readlink /var/www/poprako-web/previous
curl --fail --head https://web.example.com/
```

自动回滚只覆盖本次失败切换。需要人工回滚时，重新运行目标历史 `main`
commit 的 deployment，或在受控维护窗口把 `current` 原子指回仍保留的
`previous`。不要直接修改某个 release 目录内的文件。
