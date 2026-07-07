# Frontend Deployment

## Deployment layout

The frontend is published as static files and served directly by nginx.

```text
/var/www/poprako-w
|- current -> /var/www/poprako-w/releases/<image_tag>/site
|- releases/
|  |- <image_tag>/
|     |- poprako-w-<image_tag>.tar.gz
|     |- site/
|- shared/
   |- bin/
      |- frontend-switch-release.sh
```

## One-time server preparation

1. Create the deployment directories.

```sh
sudo mkdir -p /var/www/poprako-w/releases /var/www/poprako-w/shared/bin
```

2. Install the nginx server block from `docs/nginx.default`.

3. Validate and reload nginx.

```sh
sudo nginx -t
sudo systemctl reload nginx
```

## Local upload step

Run the local script from the repository root or any other directory.

```sh
sh scripts/frontend-package-release.sh <server-host> [server-user]
```

If `server-user` is omitted, the script uses the current local username.

Equivalent environment-variable form:

```sh
SERVER_HOST=<server-host> \
SERVER_USER=<server-user> \
IMAGE_TAG=$(git rev-parse --short=12 HEAD) \
sh scripts/frontend-package-release.sh
```

What it does:

1. Runs `pnpm exec vite build` locally.
2. Packs `dist/` into `poprako-w-<image_tag>.tar.gz`.
3. Uploads the archive to `/var/www/poprako-w/releases/<image_tag>/`.
4. Uploads the remote switch script to `/var/www/poprako-w/shared/bin/`.

The deployment script intentionally uses `vite build` instead of `pnpm build`
because the repository currently has unrelated type-check and Storybook errors
that block `tsc -b` but do not prevent generating the production static bundle.

If you want the local script to run the remote switch step automatically, add
`RUN_REMOTE=1`.

```sh
SERVER_HOST=<server-host> \
SERVER_USER=<server-user> \
RUN_REMOTE=1 \
sh scripts/frontend-package-release.sh
```

## Remote switch step

If you do not use `RUN_REMOTE=1`, log in to the server and run:

```sh
sudo IMAGE_TAG=<image_tag> sh /var/www/poprako-w/shared/bin/frontend-switch-release.sh
```

Optional overrides:

```sh
sudo IMAGE_TAG=<image_tag> \
WEB_USER=www-data \
WEB_GROUP=www-data \
sh /var/www/poprako-w/shared/bin/frontend-switch-release.sh
```

The remote script:

1. Extracts the archive into `/var/www/poprako-w/releases/<image_tag>/site`.
2. Updates `/var/www/poprako-w/current` to point at the new release.
3. Applies the same ownership and permissions that were previously handled by
   `scripts/fe-perm-enable.sh`.

## Validation

After deployment, verify these checks on the server:

```sh
ls -l /var/www/poprako-w/current
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/api/health
sudo nginx -t
```

If you access a deep SPA route such as `/workspace/123`, nginx should return
`index.html`, while `/api/...` should still be proxied to `127.0.0.1:8888`.
