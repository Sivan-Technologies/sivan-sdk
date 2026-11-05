import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { SivanClient, SivanError } from '../dist/index.js';

describe('SivanClient SDK Unit Tests (v0.0.6)', () => {
  test('throws SivanError when secretKey is missing', () => {
    assert.throws(() => {
      // @ts-expect-error testing missing secretKey
      new SivanClient({});
    }, /secretKey is required/);
  });

  test('throws SivanError when secretKey format is invalid', () => {
    assert.throws(() => {
      new SivanClient({ secretKey: 'invalid_key_prefix' });
    }, /Invalid secretKey format/);
  });

  test('initializes flows, webhooks, and wallets resources with valid sk_live_... key', () => {
    const sivan = new SivanClient({
      secretKey: 'sk_live_sample_key',
      webhookSecret: 'whsec_sample_secret_key',
    });

    assert.ok(sivan.flows, 'sivan.flows should be initialized');
    assert.ok(sivan.webhooks, 'sivan.webhooks should be initialized');
    assert.ok(sivan.wallets, 'sivan.wallets should be initialized');
    assert.equal(typeof sivan.wallets.create, 'function');
    assert.equal(typeof sivan.wallets.list, 'function');
    assert.equal(typeof sivan.wallets.getBalance, 'function');
    assert.equal(typeof sivan.wallets.createVirtualAccount, 'function');
    assert.equal(typeof sivan.wallets.transfer, 'function');
    assert.equal(typeof sivan.wallets.withdrawNgn, 'function');
    assert.equal(typeof sivan.wallets.withdrawGhs, 'function');
    assert.equal(typeof sivan.wallets.linkTelegram, 'function');
    assert.equal(sivan.getWebhookSecret(), 'whsec_sample_secret_key');
  });

  test('wallets resource validates required parameters before network call', async () => {
    const sivan = new SivanClient({
      secretKey: 'sk_live_sample_key',
    });

    await assert.rejects(
      () => sivan.wallets.create(''),
      /userId is required/
    );

    await assert.rejects(
      () => sivan.wallets.transfer('usr_1', { recipientPhone: '', amount: 5000 }),
      /recipientPhone and a positive amount are required/
    );

    await assert.rejects(
      () =>
        sivan.wallets.withdrawNgn({
          userId: 'usr_1',
          amountNgn: 0,
          accountNumber: '0123456789',
          bankCode: '058',
          accountName: 'TEST USER',
        }),
      /userId, accountNumber, bankCode, and amountNgn are required/
    );
  });

  test('webhooks.verifySignature and static verifyWebhookSignature accurately verify authentic signatures', () => {
    const webhookSecret = 'whsec_test_secret_12345';
    const sivan = new SivanClient({
      secretKey: 'sk_live_sample',
      webhookSecret,
    });

    const payload = JSON.stringify({
      event: 'payment.successful',
      orderReference: 'ORD-TEST-1',
      amount: 4500,
      currency: 'KES',
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    assert.equal(
      sivan.webhooks.verifySignature(payload, signature),
      true,
      'Instance verifySignature should verify authentic signature'
    );
    assert.equal(
      SivanClient.verifyWebhookSignature(payload, signature, webhookSecret),
      true,
      'Static verifyWebhookSignature should verify authentic signature'
    );
  });

  test('webhooks.verifySignature rejects tampered payloads or wrong signatures', () => {
    const webhookSecret = 'whsec_test_secret_12345';
    const sivan = new SivanClient({
      secretKey: 'sk_live_sample',
      webhookSecret,
    });

    const payload = JSON.stringify({ event: 'payment.successful', amount: 4500 });
    const wrongSignature = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    const isValid = sivan.webhooks.verifySignature(payload, wrongSignature);
    assert.equal(isValid, false, 'Tampered or wrong signature should be rejected');
  });
});
