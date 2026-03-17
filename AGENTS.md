# mcp-server-wechat-mp

## ⚠️ DEPRECATED — Replaced by Skill

**As of 2026-03-17**, this MCP server is **deprecated**. WeChat MP publishing is now handled by the `wechat-mp-publisher` skill which uses direct `curl` API calls instead of an MCP long-running process. This eliminates chronic MCP disconnection issues.

**Replacement**: `~/.agents/skills/wechat-mp-publisher/SKILL.md`

The source code is kept as reference for the WeChat API logic (see `src/wechat.ts`).

## Overview
MCP Server for WeChat Official Account (微信公众号). Enabled AI agents to publish articles via MCP protocol.

## Architecture
- TypeScript + MCP SDK + axios
- 4 tools: upload_article_image, upload_cover_image, create_draft, delete_draft
- Token auto-refresh with caching
- `publish_draft` removed — WeChat freepublish requires QR code scan, MCP can't handle it.

## Key Files
| Path | Purpose |
|------|---------|
| `src/index.ts` | MCP Server entry |
| `src/wechat.ts` | WeChat API Client (reference for curl equivalents) |

## Accounts

Two accounts, credentials in Bitwarden (API Keys folder):

| Owner | AppID | Bitwarden Search |
|---|---|---|
| noahxm@qq.com (个人博客) | `wxff3a9ab8ac898524` | "WeChat Official Account (公众号)" |
| ssxl0126@qq.com (施施小洛) | `wx164e95f8b19449e2` | "WeChat Official Account - ssxl" |

IP Whitelist: `117.9.169.176` (CHINANET-SD, dynamic — may need updating per account)

## Materials Folder
```
Vault/Projects/mcp-server-wechat-mp/materials/
├── covers/      # Cover images (900×383 for 2.35:1 ratio)
├── articles/    # Processed HTML articles ready for upload
├── images/      # In-article images
```

## WeChat MP HTML Constraints
- **No external CSS/JS** — all styles must be inline
- **No class/id selectors** — WeChat strips them
- **Images**: must use `mmbiz.qpic.cn` domain (upload via API first)
- **Max width**: ~677px (mobile viewport)
- **Mermaid diagrams**: must be pre-rendered as PNG images

## Resolved Issues
- OpenCode sandbox doesn't pass `HOME` env → fixed by explicit env in MCP config
- Symlink paths break shebang resolution → use absolute `node` path
- WeChat API requires IP whitelist → current: `117.9.169.176` (dynamic ISP IP)
- `freepublish/submit` API returns "api unauthorized" → requires QR scan auth, removed from MCP tools
- WeChat strips `\n` in `<pre>` tags → use `<br/>` for code block line breaks
- ASCII art diagrams render poorly on mobile → convert to gradient-colored `<section>` cards
- `<td>` without `text-align:left` gets justified → add explicit text-align to all table cells
- **MCP chronic disconnections** → migrated to skill-based `curl` approach (2026-03-17)
