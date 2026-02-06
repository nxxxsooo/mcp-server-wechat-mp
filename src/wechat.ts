import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

interface AccessToken {
  token: string;
  expiresAt: number;
}

export class WeChatClient {
  private appId: string;
  private appSecret: string;
  private accessToken: AccessToken | null = null;
  private client: any; // Using any to avoid TS import issues with AxiosInstance

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.client = axios.create({
      baseURL: 'https://api.weixin.qq.com/cgi-bin',
    });
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.accessToken.expiresAt > now + 300000) { // Refresh 5 mins early
      return this.accessToken.token;
    }

    const response = await this.client.get('/token', {
      params: {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.appSecret,
      },
    });

    if (response.data.errcode) {
      throw new Error(`Failed to get access token: ${response.data.errmsg}`);
    }

    this.accessToken = {
      token: response.data.access_token,
      expiresAt: now + (response.data.expires_in * 1000),
    };

    return this.accessToken!.token;
  }

  // Upload image for article content (returns URL)
  async uploadArticleImage(filePath: string): Promise<string> {
    const token = await this.getAccessToken();
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));

    const response = await this.client.post('/media/uploadimg', form, {
      params: { access_token: token },
      headers: { ...form.getHeaders() },
    });

    if (response.data.errcode) {
      throw new Error(`Failed to upload image: ${response.data.errmsg}`);
    }

    return response.data.url;
  }

  // Upload permanent material (for cover thumb, returns media_id)
  async uploadMaterial(filePath: string, type: 'image' = 'image'): Promise<{ media_id: string; url: string }> {
    const token = await this.getAccessToken();
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));

    const response = await this.client.post('/material/add_material', form, {
      params: { access_token: token, type },
      headers: { ...form.getHeaders() },
    });

    if (response.data.errcode) {
      throw new Error(`Failed to upload material: ${response.data.errmsg}`);
    }

    return {
      media_id: response.data.media_id,
      url: response.data.url
    };
  }

  // Create Draft
  // https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
  async addDraft(articles: any[]): Promise<string> {
    const token = await this.getAccessToken();
    const response = await this.client.post('/draft/add', 
      { articles },
      { params: { access_token: token } }
    );

    if (response.data.errcode) {
      throw new Error(`Failed to create draft: ${response.data.errmsg}`);
    }

    return response.data.media_id; // Draft ID (media_id)
  }

  // Publish Draft
  // https://developers.weixin.qq.com/doc/offiaccount/Publish/Publish.html
  async publishDraft(mediaId: string): Promise<string> {
    const token = await this.getAccessToken();
    const response = await this.client.post('/freepublish/submit', 
      { media_id: mediaId },
      { params: { access_token: token } }
    );

    if (response.data.errcode) {
      throw new Error(`Failed to publish: ${response.data.errmsg}`);
    }

    return response.data.publish_id;
  }
}
