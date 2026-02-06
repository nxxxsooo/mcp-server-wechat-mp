# mcp-server-wechat-mp

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.26-green)](https://modelcontextprotocol.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

A [Model Context Protocol](https://modelcontextprotocol.io/) server for managing **WeChat Official Accounts** (微信公众号). Enables AI agents to upload images, create article drafts, and publish content — all through MCP tools.

## Architecture

```
AI Agent (Claude / OpenCode)
    ↓ MCP (stdio)
mcp-server-wechat-mp
    ↓ HTTPS
WeChat Official Account API
    ↓
Draft Box → Publish → Followers
```

**Tech Stack**: TypeScript + MCP SDK + axios + form-data

## Features

| Tool | Description |
|------|-------------|
| `upload_article_image` | Upload images for article body (returns CDN URL) |
| `upload_cover_image` | Upload cover/thumbnail (returns `media_id`) |
| `create_draft` | Create article draft in 草稿箱 |
| `publish_draft` | Publish draft to followers (Freepublish) |

- **Auto token management** — access tokens are cached and refreshed 5 minutes before expiry
- **Stdio transport** — works with any MCP-compatible client

## Prerequisites

1. **Node.js** v18+
2. **WeChat Official Account** (subscription or service account)
   - AppID and AppSecret from [mp.weixin.qq.com](https://mp.weixin.qq.com/) → Settings → Basic Configuration
   - **IP Whitelist**: Add your machine's public IP in Basic Configuration → IP Whitelist

## Quick Start

```bash
git clone https://github.com/nxxxsooo/mcp-server-wechat-mp.git
cd mcp-server-wechat-mp
npm install
npm run build
```

### Integration with Claude Code / OpenCode

Add to your MCP config (`opencode.json`, `mcp.json`, or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wechat-mp": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-wechat-mp/dist/index.js"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

### Standalone

```bash
WECHAT_APP_ID=your_id WECHAT_APP_SECRET=your_secret node dist/index.js
```

## Tools Reference

### `upload_article_image`

Upload an image for use **inside** article content. Returns a permanent CDN URL (`mmbiz.qpic.cn`).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | ✅ | Absolute path to image file |

**Returns**: `{ url: "https://mmbiz.qpic.cn/..." }`

### `upload_cover_image`

Upload an image for use as article **cover/thumbnail**. Returns a `media_id` for use in `create_draft`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePath` | string | ✅ | Absolute path to image file |

**Returns**: `{ media_id: "...", url: "..." }`

> **Tip**: Recommended cover size is 900×383px (2.35:1 ratio) for optimal display in subscription feeds.

### `create_draft`

Create a new article draft in the Draft Box (草稿箱).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ✅ | Article title |
| `content` | string | ✅ | Article HTML content (inline styles only) |
| `thumb_media_id` | string | ✅ | Cover image media_id |
| `author` | string | | Author name |
| `digest` | string | | Summary shown in message list |
| `content_source_url` | string | | Link to original article |

**Returns**: `{ draft_id: "..." }`

> **Important**: WeChat strips `class`, `id`, and external CSS. All styles must be inline `style=""` attributes.

### `publish_draft`

Publish a draft to followers via Freepublish.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `media_id` | string | ✅ | Draft media_id from `create_draft` |

**Returns**: `{ publish_id: "..." }`

## Troubleshooting

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `40164` | IP not whitelisted | Add your IP to MP admin → Basic Config → IP Whitelist |
| `40001` | Invalid access token | Check AppID/AppSecret, ensure they match |
| `45009` | API rate limit | Wait and retry |
| `40009` | Invalid image size | Image must be < 10MB |

## License

ISC
