# Comic 管理核心接口解析与覆盖情况

本文记录从本地 HAR 样本中解析出的 Comic 管理接口，用于后续对接和补抓。
它是**观察记录**，不是后端 OpenAPI 契约快照，不替代 [swagger.json](swagger.json)。
接口以实际后端实现为准；标注为“待补”的条目在补抓前不应作为对接依据。
本文按样本字段把 `categories` 记为主标签、`tags` 记为副标签。

## 样本信息

| 项       | 内容                                                           |
| -------- | -------------------------------------------------------------- |
| 样本文件 | `test-resource/downloa_pica`（无 `.har` 后缀，内容为 HAR 1.2） |
| 抓取时间 | 2026-11-04 15:25–15:34 UTC                                     |
| 请求总数 | 30 条，其中业务请求 27 条，其余 3 条为页面 RUM 上报            |
| 页面     | `https://{dashboard-host}/comics` 及其详情页                   |
| API 前缀 | `https://{api-host}/admin`                                     |
| 证据索引 | 见文末[证据索引](#证据索引)                                    |

样本中的主机名、`api-key` 值和鉴权信息不写入本文。HAR 内的 `api-key` 是明文，
且没有 `Authorization` 或 `Cookie`，复现请求时需要自行补充有效鉴权。

## 覆盖总览

图例：**已覆盖** = 请求与响应均已解析；**部分覆盖** = 只捕获到该能力的一部分；
**待补** = 样本中没有对应请求。

| #   | 能力                | 方法与路径                             | 证据          | 覆盖     |
| --- | ------------------- | -------------------------------------- | ------------- | -------- |
| 1   | 创建 comic          | `POST /admin/comics`                   | #5            | 已覆盖   |
| 2   | 获取 comic 信息     | `GET /admin/comics/{comicId}`          | #6            | 已覆盖   |
| 3   | 修改 comic 信息     | `PUT /admin/comics/{comicId}/thumb`    | #13           | 部分覆盖 |
| 4   | 创建 chapter        | `POST /admin/comics/{comicId}/eps`     | #10           | 已覆盖   |
| 5   | 上传 chapter pages  | `POST /admin/eps/{epId}/pages`         | #12、#14、#15 | 已覆盖   |
| 6   | 申请上架            | `POST /admin/comics/{comicId}/request` | #27           | 已覆盖   |
| 7   | 获取 tags（主、副） | `GET /admin/tags`                      | #16–#24       | 部分覆盖 |
| 8   | 添加 tags（主、副） | `PUT /admin/comics/{comicId}/tags`     | #17、#25      | 部分覆盖 |

### 主要缺口

1. 没有捕获**修改 comic 基本信息**的请求（标题、作者、简介、汉化组、连载状态）。
2. 没有捕获**主标签（`categories`）词表获取和修改**的请求；主标签只在创建时提交。
3. 副标签保存后没有重新获取详情，无法从样本确认持久化结果。
4. 缺少鉴权头信息，无法确认管理端登录态的实际传递方式。

补抓要求见[缺失项与补抓清单](#缺失项与补抓清单)。

## 通用约定

### 请求

- `accept: application/vnd.picacomic.com.v1+json`
- JSON 请求使用 `content-type: application/json`
- 文件上传使用 `multipart/form-data`
- 携带 `api-key` 请求头（值不落文档）
- 样本中所有请求带 `origin`、`referer` 指向 dashboard，源站校验可能依赖它们
- 管理端请求路径统一以 `/admin` 开头

### 响应

统一信封：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- 成功时 `code` 与 HTTP 状态码均为 200。
- 部分写操作只返回 `code` 和 `message`，不返回 `data`。
- 响应 `content-type` 为 `application/json; charset=utf-8`。
- 时间是 ISO 8601 UTC 字符串；ID 是 24 位十六进制字符串（Mongo ObjectId 形态）。

### 分页

样本中列表统一为以下形态，默认每页 20 条：

```json
{
  "docs": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

`limit` 由服务端固定返回，样本中未见调用方传 `limit`。

## 接口解析

### 1. 创建 comic

**状态：已覆盖** ｜ `POST /admin/comics`

请求体：

```json
{
  "categories": ["東方"],
  "finished": true,
  "title": "これからのはなし | 自此之后的那段事",
  "author": "高宮七瀬",
  "description": "嫦娥啊，你看到了吗",
  "chineseTeam": "白杨汉化组"
}
```

| 字段          | 类型       | 必填 | 说明                    |
| ------------- | ---------- | ---- | ----------------------- |
| `title`       | `string`   | 是   | 漫画标题                |
| `author`      | `string`   | 是   | 作者                    |
| `description` | `string`   | 是   | 简介                    |
| `chineseTeam` | `string`   | 是   | 汉化组                  |
| `categories`  | `string[]` | 是   | 主标签标题，不是 tag ID |
| `finished`    | `boolean`  | 是   | 是否已完结              |

响应 `data.comic`：

```json
{
  "_id": "6aeb4f576a91247f3700e34a",
  "title": "これからのはなし | 自此之后的那段事",
  "author": "高宮七瀬",
  "description": "嫦娥啊，你看到了吗",
  "chineseTeam": "白杨汉化组",
  "_creator": "689d7b98f6e7f7561476ec16",
  "allowComment": true,
  "allowDownload": true,
  "finished": true,
  "active": true,
  "pagesCount": 0,
  "epsCount": 0,
  "categories": ["東方"],
  "tags": [],
  "created_at": "2026-11-04T15:29:27.562Z",
  "updated_at": "2026-11-04T15:29:27.563Z"
}
```

解析要点：

- 请求未传 `allowComment`、`allowDownload`，服务端默认补为 `true`。
- `active`、`pagesCount`、`epsCount`、`tags` 由服务端初始化。
- 创建成功后返回完整 comic，可直接作为详情页初始数据。

### 2. 获取 comic 信息

**状态：已覆盖** ｜ `GET /admin/comics/{comicId}`

响应在 comic 之外附带两个申请上架相关字段：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "comic": {
      "_id": "6aeb4f576a91247f3700e34a",
      "title": "これからのはなし | 自此之后的那段事",
      "author": "高宮七瀬",
      "description": "嫦娥啊，你看到了吗",
      "chineseTeam": "白杨汉化组",
      "_creator": "689d7b98f6e7f7561476ec16",
      "allowComment": true,
      "allowDownload": true,
      "pagesCount": 0,
      "epsCount": 0,
      "finished": true,
      "active": true,
      "categories": ["東方"],
      "tags": [],
      "created_at": "2026-11-04T15:29:27.562Z",
      "updated_at": "2026-11-04T15:29:27.563Z"
    },
    "requestLimit": 1,
    "suggestDays": -1
  }
}
```

解析要点：

- `requestLimit` 与 `suggestDays` 是申请上架表单的提示数据，样本中只有一组值。
- `tags` 返回字符串数组；创建后为空。
- 详情中的 `active` 在申请上架后会变化，见第 6 节。

### 3. 修改 comic 信息（部分覆盖）

**状态：部分覆盖** ｜ 目前只有封面上传

样本中与“修改”相关的请求只有封面：

`PUT /admin/comics/{comicId}/thumb`，`multipart/form-data`：

```text
Content-Disposition: form-data; name="thumb"; filename="cover_01.jpg"
Content-Type: image/jpeg
```

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "thumb": {
      "originalName": "cover_01.jpg",
      "path": "sub_storage_1/d6/9a/d69a9054-43ce-4dcb-bd23-0b7d0c250fbb.jpg",
      "fileServer": "https://{storage-host}"
    }
  }
}
```

解析要点：

- 表单字段名固定为 `thumb`，样本中一次上传一张。
- 响应返回可拼接的存储路径与文件服务器。
- 封面更新是独立接口，不会随 comic 基本信息一起保存。

**待补：基本信息修改**

样本中没有 `PUT` 或 `PATCH /admin/comics/{comicId}`，以下内容未知：

| 待确认项        | 说明                                     |
| --------------- | ---------------------------------------- |
| 方法与路径      | 是否为 `PUT /admin/comics/{comicId}`     |
| 请求字段        | 是否与创建一致，是否允许部分字段         |
| 主标签处理      | `categories` 是否通过该接口整体替换      |
| `finished` 语义 | 是否与上架状态联动                       |
| 响应            | 返回完整 comic 还是仅 `code`/`message`   |
| 并发与校验      | 是否使用版本号、`updated_at` 或 409 冲突 |

补抓后在本节补充请求/响应示例，并把覆盖总览中的状态改为“已覆盖”。

### 4. 创建 chapter

**状态：已覆盖** ｜ `POST /admin/comics/{comicId}/eps`

请求体：

```json
{ "title": "第1話" }
```

响应 `data.ep`：

```json
{
  "_id": "6aeb4f682ab26a7f692a3253",
  "_comic": "6aeb4f576a91247f3700e34a",
  "title": "第1話",
  "order": 1,
  "pagesCount": 0,
  "created_at": "2026-11-04T15:29:44.938Z",
  "updated_at": "2026-11-04T15:29:44.939Z"
}
```

解析要点：

- 只需标题，`order` 由服务端按已有章节自动分配。
- 新建章节 `pagesCount` 为 0。
- 样本中章节列表接口为 `GET /admin/comics/{comicId}/eps?offset=0`，返回同样的分页信封。

### 5. 上传 chapter pages

**状态：已覆盖** ｜ `POST /admin/eps/{epId}/pages`

请求为 `multipart/form-data`，**同一个字段 `files` 重复多次**，每次一个文件：

```text
Content-Disposition: form-data; name="files"; filename="01.jpg"
Content-Type: image/jpeg
<二进制内容>

Content-Disposition: form-data; name="files"; filename="02.jpg"
Content-Type: image/jpeg
<二进制内容>
```

样本分 3 批上传 15 张：

| 请求 | 文件                                    | 数量 | Content-Length | 耗时   |
| ---- | --------------------------------------- | ---- | -------------- | ------ |
| #12  | `01.jpg`–`06.jpg`                       | 6    | 5,841,712      | 12.6 s |
| #14  | `07.jpg`–`11.jpg`                       | 5    | 5,084,840      | 6.8 s  |
| #15  | `12.jpg`–`14.jpg`、`baka2.1.1_PPT_.jpg` | 4    | 3,241,638      | 8.7 s  |

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "pages": {
      "invalidFiles": [],
      "validFiles": [
        {
          "order": 1,
          "_ep": "6aeb4f682ab26a7f692a3253",
          "media": {
            "originalName": "01.jpg",
            "path": "sub_storage_1/c6/3b/c63b15ac-af68-4d96-9970-60e8b496dfe5.jpg",
            "fileServer": "https://{storage-host}"
          },
          "created_at": "2026-11-04T15:30:04.175Z",
          "updated_at": "2026-11-04T15:30:04.175Z",
          "_id": "6aeb4f7c04982e7fa67df1a8"
        }
      ]
    }
  }
}
```

解析要点：

- 不传 `order`，样本中服务端按当前 `pagesCount` 递增分配：第一批 1–6，第二批 7–11，第三批 12–15。
- `order` 与文件名无关；`baka2.1.1_PPT_.jpg` 作为第 15 张仍排最后。
- 响应区分 `validFiles` 与 `invalidFiles`，前端应据此提示部分失败。
- HAR 导出省略了二进制内容，`postData.text` 只有 multipart 头；真实体积看 `content-length`。
- 批量上传耗时较长（6.8–12.6 s），请求超时和进度反馈需要单独处理。

分页读取页面：

`GET /admin/eps/{epId}/pages?offset=15&sort=1`

```json
{
  "data": {
    "pages": { "docs": [], "total": 15, "limit": 20, "offset": 15 },
    "epTitle": "第1話",
    "comicTitle": "これからのはなし | 自此之后的那段事",
    "comicId": "6aeb4f576a91247f3700e34a"
  }
}
```

样本中 `sort=1` 的具体排序语义未验证；只知道偏移 `offset=15`、总数 15 时返回空列表。

### 6. 申请上架

**状态：已覆盖** ｜ `POST /admin/comics/{comicId}/request`

请求无 body，无 `content-type`，`content-length: 0`。

响应只有信封：

```json
{ "code": 200, "message": "success" }
```

解析要点：

- 接口本身不返回申请状态，需要重新获取 comic 或列表确认。
- 申请后列表中的该漫画变为：

```json
{
  "active": false,
  "requestStatus": {
    "dateTime": "2026-11-04T15:34:36.942Z",
    "status": "review"
  }
}
```

- 即提交后进入 `review`，`active` 变为 `false`。这是样本中观察到的副作用，不是响应体契约。
- 申请前详情返回 `requestLimit: 1`、`suggestDays: -1`，其准确语义待与后端确认。

### 7. 获取 tags（部分覆盖）

**状态：部分覆盖** ｜ `GET /admin/tags?q={关键词}&offset={偏移}`

响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "tags": {
      "docs": [
        {
          "_id": "584c506e8737452efc6f3706",
          "title": "無H內容",
          "created_at": "2026-11-04T15:30:40.688Z"
        }
      ],
      "total": 1,
      "limit": 20,
      "offset": 0
    }
  }
}
```

解析要点：

- `q` 是包含匹配：查 `日常` 同时命中 `日常` 和 `魔物娘的同居日常`。
- 简繁似乎做了归一：查简体 `无H内容` 命中繁体 `無H內容`。该行为由样本观察得出，未验证是否为服务端保证。
- 分页固定每页 20 条，样本用 `offset=20/40` 翻页，共 54 条结果。
- **`created_at` 不可作为标签创建时间**：同一个标签 `無H內容` 在 #16 返回 `15:30:40.688Z`，在 #18 返回 `15:32:58.219Z`；`東方` 的所有结果时间都等于查询时刻。它更像是响应时的投影值。
- 该接口只覆盖副标签检索，没有区分主/副标签的参数。

**待补：主标签词表**

样本中没有单独的 `categories` 查询请求。主标签目前只能从 comic 的 `categories` 字段回显中看到。
若存在主标签选择器，其选项来源接口需要补抓，并确认：

- 路径与分页方式；
- 主标签是否也有独立 ID（区别于标题字符串）；
- 是否允许新增主标签，还是只能从固定词表选择。

### 8. 添加 tags（部分覆盖）

**状态：部分覆盖** ｜ `PUT /admin/comics/{comicId}/tags`

请求体：

```json
{ "tags": ["無H內容", "日常", "東方: 純狐", "東方: 赫卡提亞"] }
```

响应只有信封：

```json
{ "code": 200, "message": "success" }
```

解析要点：

- 传的是**标签标题字符串**，不是 `_id`。
- 从样本看是**整体替换**语义，不是增量追加：先提交 `{"tags":[]}` 清空，再一次性写入 4 个。
- 保存成功后没有重新获取详情，样本无法验证这些标签是否真的持久化。
- 样本中的列表项不返回 `tags` 字段，因此也不能通过列表确认。
- 主标签 `categories` 不在此接口内，保存副标签不会改动主标签。

**待补：主标签写入**

样本中没有修改 `categories` 的请求。需要补抓“编辑主标签并保存”的操作，确认：

- 是否复用 comic 基本信息修改接口；
- 是否也采用整体替换；
- 主标签增删是否影响已上架状态或审核。

## 主副标签对照

| 维度       | 主标签（`categories`）         | 副标签（`tags`）                             |
| ---------- | ------------------------------ | -------------------------------------------- |
| 数据形态   | `string[]`，标题字符串         | `string[]`，标题字符串                       |
| 获取词表   | **未覆盖**，无独立请求         | `GET /admin/tags?q=&offset=`                 |
| 获取已选值 | comic 详情/列表的 `categories` | comic 详情的 `tags`；列表不返回              |
| 写入       | 仅创建时提交；**修改未覆盖**   | `PUT /admin/comics/{comicId}/tags`，整体替换 |
| 分页       | 未知                           | 固定 20 条，`offset` 翻页                    |
| 备注       | 创建时示例传 `["東方"]`        | 保存后需重新拉详情确认；`created_at` 不可信  |

## 缺失项与补抓清单

按优先级排列。补抓后同步更新[覆盖总览](#覆盖总览)和对应小节的“待补”内容。

- [ ] **修改 comic 基本信息**：编辑标题、作者、简介、汉化组、连载状态并保存。
- [ ] **修改主标签**：在已有 comic 上增删 `categories` 并保存。
- [ ] **获取主标签词表**：打开主标签选择器，记录选项加载请求。
- [ ] **验证副标签持久化**：保存后刷新详情页，记录 `GET /admin/comics/{comicId}` 返回的 `tags` 顺序。
- [ ] **确认鉴权头**：重新导出时保留管理端登录态，确认实际使用的请求头名称（不要写入真实凭据）。
- [ ] **确认分页参数**：尝试传入 `limit`，确认是否可覆盖默认 20 条。
- [ ] **确认失败响应**：至少补抓一次 4xx/5xx，记录业务错误码与 `message` 结构。
- [ ] **确认页面排序**：对 `GET /admin/eps/{epId}/pages` 的 `sort` 取值做对比。

补抓记录建议使用同一模板：

```text
方法 + 路径：
请求头（脱敏）：
请求体 / multipart 字段：
响应状态与 body：
观察到的副作用：
样本条目编号：
```

## 证据索引

| 条目 | 时间（UTC） | 方法 | 路径                                             | 状态 | 用途            |
| ---- | ----------- | ---- | ------------------------------------------------ | ---- | --------------- |
| #5   | 15:29:27    | POST | `/admin/comics`                                  | 200  | 创建 comic      |
| #6   | 15:29:40    | GET  | `/admin/comics/{comicId}`                        | 200  | 获取详情        |
| #7   | 15:29:40    | GET  | `/admin/comics/{comicId}/eps?offset=0`           | 200  | 章节列表        |
| #10  | 15:29:44    | POST | `/admin/comics/{comicId}/eps`                    | 200  | 创建 chapter    |
| #11  | 15:29:47    | GET  | `/admin/eps/{epId}/pages?offset=0&sort=1`        | 200  | 上传前页面列表  |
| #12  | 15:29:52    | POST | `/admin/eps/{epId}/pages`                        | 200  | 上传 6 张       |
| #13  | 15:29:54    | PUT  | `/admin/comics/{comicId}/thumb`                  | 200  | 上传封面        |
| #14  | 15:30:05    | POST | `/admin/eps/{epId}/pages`                        | 200  | 上传 5 张       |
| #15  | 15:30:12    | POST | `/admin/eps/{epId}/pages`                        | 200  | 上传 4 张       |
| #16  | 15:30:40    | GET  | `/admin/tags?q=无H内容`                          | 200  | 标签检索        |
| #17  | 15:30:48    | PUT  | `/admin/comics/{comicId}/tags`                   | 200  | 清空标签        |
| #18  | 15:32:58    | GET  | `/admin/tags?q=无H内容`                          | 200  | 标签检索        |
| #19  | 15:33:01    | GET  | `/admin/tags?q=日常`                             | 200  | 标签检索        |
| #20  | 15:33:03    | GET  | `/admin/tags?q=東方`                             | 200  | 标签检索第 1 页 |
| #21  | 15:33:05    | GET  | `/admin/tags?offset=20&q=東方`                   | 200  | 标签检索第 2 页 |
| #22  | 15:33:10    | GET  | `/admin/tags?offset=40&q=東方`                   | 200  | 标签检索第 3 页 |
| #23  | 15:33:49    | GET  | `/admin/tags?q=純狐`                             | 200  | 标签检索        |
| #24  | 15:34:21    | GET  | `/admin/tags?q=赫卡提亞`                         | 200  | 标签检索        |
| #25  | 15:34:23    | PUT  | `/admin/comics/{comicId}/tags`                   | 200  | 写入 4 个标签   |
| #26  | 15:34:26    | GET  | `/admin/eps/{epId}/pages?offset=15&sort=1`       | 200  | 上传后页面列表  |
| #27  | 15:34:37    | POST | `/admin/comics/{comicId}/request`                | 200  | 申请上架        |
| #28  | 15:34:37    | GET  | `/admin/comics?q=&offset=0&status=&f=&sort=&sh=` | 200  | 申请后列表状态  |

路径中的 `{comicId}`、`{epId}` 在样本中分别为
`6aeb4f576a91247f3700e34a` 和 `6aeb4f682ab26a7f692a3253`。
`status`、`f`、`sort`、`sh` 等列表查询参数样本中均为空，尚未验证取值语义。

## 维护约定

- 新 HAR 覆盖旧样本时，先更新本文的样本信息、覆盖总览和证据索引，再删除失效结论。
- 本文只记录从样本观察到的行为；与后端实现冲突时以后端为准，并标注冲突点。
- 不在此文档中保存 `api-key`、`Authorization`、`Cookie` 或任何真实凭据。
- 需要正式契约时更新 [swagger.json](swagger.json)，不把本文扩写成第二份 OpenAPI 快照。
- `test-resource/` 已被 `.gitignore` 排除，本文引用的样本只存在于本地，不随仓库分发。
