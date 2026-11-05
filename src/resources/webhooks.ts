import crypto from 'node:crypto';
import type { SivanClient } from '../client.js';
import { SivanError } from '../errors.js';

export class WebhooksResource {
  constructor(private readonly client?: SivanClient) { }

  /**
   * Cryptographically verifies that an inbound webhook payload genuinely originated
   * from Sivan's durable outbox dispatcher using HMAC-SHA256 with timing-safe comparison.
   *
   * @param rawBody The raw, unparsed request body string or Buffer received from the HTTP request.
   * @param signatureHeader The value of the X-Sivan-Signature header.
   * @param secret Optional merchant webhook secret override. Defaults to webhookSecret passed to SivanClient.
   * @returns boolean true if signature is valid, false otherwise.
   *
   * @example
   * const isValid = sivan.webhooks.verifySignature(req.rawBody, req.headers['x-sivan-signature']);
   */
  verifySignature(rawBody: string | Buffer, signatureHeader?: string | string[], secret?: string): boolean {
    const webhookSecret = secret || this.client?.getWebhookSecret();
    if (!webhookSecret) {
      throw new SivanError('Webhook secret is required to verify signatures. Pass webhookSecret to SivanClient options.');
    }

    if (!signatureHeader) {
      return false;
    }

    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    try {
      const computedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(computedHash, 'utf8');
      const receivedBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch {
      return false;
    }
  }
}

