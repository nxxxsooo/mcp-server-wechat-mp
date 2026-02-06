#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { WeChatClient } from './wechat.js';

dotenv.config();

const APP_ID = process.env.WECHAT_APP_ID;
const APP_SECRET = process.env.WECHAT_APP_SECRET;

if (!APP_ID || !APP_SECRET) {
  console.error('Error: WECHAT_APP_ID and WECHAT_APP_SECRET environment variables are required.');
  process.exit(1);
}

const client = new WeChatClient(APP_ID, APP_SECRET);

const server = new Server(
  {
    name: 'mcp-server-wechat-mp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'upload_article_image',
      description: 'Upload an image for use INSIDE article content (returns URL).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Absolute path to the image file',
          },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'upload_cover_image',
      description: 'Upload an image for use as article COVER/THUMBNAIL (returns media_id).',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Absolute path to the image file',
          },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'create_draft',
      description: 'Create a new article draft (saves to Draft Box).',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Article title' },
          content: { type: 'string', description: 'Article HTML content' },
          thumb_media_id: { type: 'string', description: 'Media ID of cover image' },
          author: { type: 'string', description: 'Author name (optional)' },
          digest: { type: 'string', description: 'Article digest/summary (optional)' },
          content_source_url: { type: 'string', description: 'Original source URL (optional)' },
        },
        required: ['title', 'content', 'thumb_media_id'],
      },
    },
    {
      name: 'publish_draft',
      description: 'Publish a draft by its Media ID (Freepublish).',
      inputSchema: {
        type: 'object',
        properties: {
          media_id: { type: 'string', description: 'Draft Media ID' },
        },
        required: ['media_id'],
      },
    },
    {
      name: 'delete_draft',
      description: 'Delete a draft from the Draft Box.',
      inputSchema: {
        type: 'object',
        properties: {
          media_id: { type: 'string', description: 'Draft Media ID to delete' },
        },
        required: ['media_id'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'upload_article_image': {
        const { filePath } = request.params.arguments as { filePath: string };
        const url = await client.uploadArticleImage(filePath);
        return {
          content: [{ type: 'text', text: JSON.stringify({ url }) }],
        };
      }

      case 'upload_cover_image': {
        const { filePath } = request.params.arguments as { filePath: string };
        const result = await client.uploadMaterial(filePath);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      }

      case 'create_draft': {
        const args = request.params.arguments as any;
        const articles = [
          {
            title: args.title,
            content: args.content,
            thumb_media_id: args.thumb_media_id,
            author: args.author,
            digest: args.digest,
            content_source_url: args.content_source_url,
          },
        ];
        const draftId = await client.addDraft(articles);
        return {
          content: [{ type: 'text', text: JSON.stringify({ draft_id: draftId }) }],
        };
      }

      case 'publish_draft': {
        const { media_id } = request.params.arguments as { media_id: string };
        const publishId = await client.publishDraft(media_id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ publish_id: publishId }) }],
        };
      }

      case 'delete_draft': {
        const { media_id } = request.params.arguments as { media_id: string };
        await client.deleteDraft(media_id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ deleted: true, media_id }) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();

async function main() {
  await server.connect(transport);
  console.error('WeChat MP MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
