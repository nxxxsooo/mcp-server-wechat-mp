# WeChat Official Account (MP) MCP Server

A Model Context Protocol (MCP) server for managing WeChat Official Accounts (微信公众号).

## Features

- **Upload Images**: Upload images for article content or covers.
- **Create Drafts**: Create articles and save them to the Draft Box (草稿箱).
- **Publish**: Publish drafts to followers (Freepublish).

## Prerequisites

1.  **Node.js** (v18 or higher)
2.  **WeChat Official Account**:
    - AppID
    - AppSecret
    - **Important**: You must whitelist your IP address in the WeChat Admin Panel (Basic Configuration -> IP Whitelist).

## Configuration

Set the following environment variables:

```bash
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

## Usage

### Install

```bash
npm install
npm run build
```

### Run (Stdio)

```bash
node dist/index.js
```

### Integration with Claude Code / OpenCode

Add to your `opencode.json` or `mcp.json`:

```json
{
  "mcpServers": {
    "wechat-mp": {
      "command": "node",
      "args": ["/path/to/mcp-server-wechat-mp/dist/index.js"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

## Tools

### `upload_article_image`
Uploads an image for use INSIDE article content.
- **Input**: `filePath` (absolute path)
- **Output**: `url`

### `upload_cover_image`
Uploads an image for use as article COVER/THUMBNAIL.
- **Input**: `filePath` (absolute path)
- **Output**: `media_id`, `url`

### `create_draft`
Creates a new article draft.
- **Input**:
    - `title`: Article title
    - `content`: Article HTML content
    - `thumb_media_id`: Media ID of cover image
    - `author`: (Optional)
    - `digest`: (Optional)
    - `content_source_url`: (Optional)
- **Output**: `draft_id` (media_id of the draft)

### `publish_draft`
Publishes a draft.
- **Input**: `media_id` (Draft ID)
- **Output**: `publish_id`
