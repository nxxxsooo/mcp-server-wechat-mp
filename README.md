# mcp-server-wechat-mp

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.26-green)](https://modelcontextprotocol.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

让 AI 直接发布文章到微信公众号的 [MCP](https://modelcontextprotocol.io/) 服务器。

支持 Claude Code、OpenCode、Claude Desktop 等任何 MCP 客户端。

**[项目主页](https://mjshao.fun/mcp-server-wechat-mp/)** · **[GitHub](https://github.com/nxxxsooo/mcp-server-wechat-mp)**

## 它能做什么

| 工具 | 功能 |
|------|------|
| `upload_article_image` | 上传文章内图片，返回微信 CDN 链接 |
| `upload_cover_image` | 上传封面图，返回 `media_id` |
| `create_draft` | 创建文章草稿到草稿箱 |
| `delete_draft` | 删除草稿 |
| `publish_draft` | 发布草稿到粉丝 |

- access token 自动管理（缓存 + 过期前 5 分钟自动刷新）
- stdio 传输，兼容所有 MCP 客户端

## 三步开始用

### 第一步：获取公众号密钥

1. 打开 [mp.weixin.qq.com](https://mp.weixin.qq.com/)，扫码登录你的公众号
2. 左侧菜单 → **设置与开发** → **基本配置**
3. 找到 **开发者ID(AppID)** — 直接复制
4. 找到 **开发者密码(AppSecret)** → 点「重置」→ 扫码确认 → **立刻复制保存**（只显示一次！）
5. 找到 **IP白名单** → 点「查看」→ 添加你电脑的公网 IP

> 💡 不知道自己的公网 IP？终端执行 `curl -s ifconfig.me` 即可。如果用了代理，需要加代理的 IP 和直连的 IP 都加上。

### 第二步：安装

```bash
git clone https://github.com/nxxxsooo/mcp-server-wechat-mp.git
cd mcp-server-wechat-mp
npm install
npm run build
```

### 第三步：配置到你的 AI 工具

把下面的配置加到你的 MCP 配置文件里：

**OpenCode** → `~/.config/opencode/opencode.json` 或 `~/.config/opencode/mcp.json`

**Claude Code** → `~/.claude/mcp.json`

**Claude Desktop** → `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wechat-mp": {
      "command": "node",
      "args": ["/你的路径/mcp-server-wechat-mp/dist/index.js"],
      "env": {
        "WECHAT_APP_ID": "你的AppID",
        "WECHAT_APP_SECRET": "你的AppSecret"
      }
    }
  }
}
```

> ⚠️ `args` 里必须写**绝对路径**，不能用 `~` 或相对路径。

配置完重启你的 AI 工具，就能用了。

## 用法示例

跟 AI 说：

```
帮我把这篇博客发到公众号：/path/to/article.md
```

AI 会自动：上传图片 → 转换格式 → 创建草稿 → 等你确认后发布。

## 工具参数详情

### `upload_article_image`

上传文章**正文**里用的图片。微信要求文章内图片必须在微信 CDN 上，不能用外链。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filePath` | string | ✅ | 图片文件的绝对路径 |

返回：`{ url: "https://mmbiz.qpic.cn/..." }`

### `upload_cover_image`

上传文章**封面图**。推荐尺寸 900×383（2.35:1），这是订阅号消息列表里的显示比例。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filePath` | string | ✅ | 图片文件的绝对路径 |

返回：`{ media_id: "...", url: "..." }`

### `create_draft`

创建文章草稿，保存到公众号后台的草稿箱。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 文章标题 |
| `content` | string | ✅ | 文章 HTML 内容（**必须全部内联样式**） |
| `thumb_media_id` | string | ✅ | 封面图的 media_id |
| `author` | string | | 作者名 |
| `digest` | string | | 摘要，显示在订阅号消息列表 |
| `content_source_url` | string | | 原文链接 |

返回：`{ draft_id: "..." }`

> ⚠️ 微信会删除所有 `class`、`id` 属性和外部 CSS。文章样式**必须**写成 `style="..."` 内联形式。

### `delete_draft`

删除草稿箱里的草稿。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `media_id` | string | ✅ | 要删除的草稿 media_id |

返回：`{ deleted: true, media_id: "..." }`

### `publish_draft`

把草稿发布给粉丝。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `media_id` | string | ✅ | 草稿的 media_id |

返回：`{ publish_id: "..." }`

## 常见问题

| 错误码 | 意思 | 怎么解决 |
|--------|------|----------|
| `40164` | IP 不在白名单 | 去公众号后台 → 基本配置 → IP白名单，加上你的 IP |
| `40001` | access token 无效 | 检查 AppID 和 AppSecret 是否正确 |
| `45009` | 接口调用超限 | 等一会再试 |
| `40009` | 图片太大 | 图片不能超过 10MB |
| `-32000: Connection closed` | MCP 连接断开 | 检查 `args` 路径是否正确，确保 `env` 里有 `HOME` 变量 |

## 技术架构

```
AI Agent（Claude / OpenCode）
    ↓ MCP 协议（stdio）
mcp-server-wechat-mp（TypeScript）
    ↓ HTTPS（axios）
api.weixin.qq.com
    ↓
草稿箱 → 发布 → 粉丝收到推送
```

**技术栈**：TypeScript + MCP SDK + axios + form-data

## License

ISC
