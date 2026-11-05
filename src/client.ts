import type { SivanClientOptions } from './types.js';
import { SivanApiError, SivanAuthenticationError, SivanError, SivanNetworkError } from './errors.js';
import { FlowsResource } from './resources/flows.js';
import { WebhooksResource } from './resources/webhooks.js';
import { WalletsResource } from './resources/wallets.js';

export class SivanClient {
  readonly flows: FlowsResource;
  readonly webhooks: WebhooksResource;
  readonly wallets: WalletsResource;

  private readonly secretKey: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: SivanClientOptions) {
    if (!options?.secretKey) {
      throw new SivanError('Sivan secretKey is required (e.g. sk_live_...)');
    }

    if (!options.secretKey.startsWith('sk_live_') && !options.secretKey.startsWith('sk_test_')) {
      throw new SivanError("Invalid secretKey format. Expected 'sk_live_...' or 'sk_test_...'");
    }

    this.secretKey = options.secretKey;
    this.webhookSecret = options.webhookSecret;
    this.baseUrl = (options.baseUrl || 'https://api-staging.sivantech.online').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || 15000;

    this.flows = new FlowsResource(this);
    this.webhooks = new WebhooksResource(this);
    this.wallets = new WalletsResource(this);
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret;
  }

  /**
   * Static helper to verify an inbound webhook signature directly.
   */
  static verifyWebhookSignature(
    rawBody: string | Buffer,
    signatureHeader: string | string[] | undefined,
    webhookSecret?: string
  ): boolean {
    const verifier = new WebhooksResource();
    return verifier.verifySignature(rawBody, signatureHeader, webhookSecret);
  }

  /**
   * Internal HTTP client dispatcher.
   */
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init.headers || {});

    headers.set('Authorization', `Bearer ${this.secretKey}`);
    headers.set('Accept', 'application/json');
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('User-Agent', '@sivanai/sdk-node/0.0.6');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text.slice(0, 300) };
      }

      if (response.status === 401 || response.status === 403) {
        throw new SivanAuthenticationError(data?.error || data?.message || 'Authentication failed. Check your secretKey.');
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new SivanApiError(errorMsg, response.status, data);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof SivanError) {
        throw err;
      }
      if (err?.name === 'AbortError') {
        throw new SivanNetworkError(`Request timed out after ${this.timeoutMs}ms while contacting ${url}`);
      }
      throw new SivanNetworkError(err?.message || 'Network request failed');
    } finally {
      clearTimeout(timer);
    }
  }
}
