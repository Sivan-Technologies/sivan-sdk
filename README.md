# @sivanai/sdk

Official Node.js and TypeScript SDK for Sivan Payment Ai.  
Dispatch branded interactive WhatsApp checkout flows, provision multi-chain embedded wallets, collect local mobile money and bank transfer payments across Africa, and verify durable webhook callbacks.

---

## Installation

```bash
npm install @sivanai/sdk
```

Or using pnpm:
```bash
pnpm add @sivanai/sdk
```

Or using yarn:
```bash
yarn add @sivanai/sdk
```

---

## Quickstart

Initialize the client with your secret API key:

```typescript
import { SivanClient } from '@sivanai/sdk';

const sivan = new SivanClient({
  secretKey: process.env.SIVAN_SECRET_KEY!, // e.g. sk_live_...
  webhookSecret: process.env.SIVAN_WEBHOOK_SECRET // e.g. whsec_...
});
```

---

## 1. Dispatching a WhatsApp Checkout Flow

### Kenya Corridor (Safaricom M-Pesa . KES)

```typescript
const flow = await sivan.flows.dispatch({
  customerPhone: '+254712345678',
  customerName: 'Juma Mwangi',
  amount: 4500,
  currency: 'KES',
  orderReference: 'ORD-KE-9001',
  greetingMessage: 'Hello Juma! Complete your payment below:',
  buttonLabel: 'Pay with M-Pesa'
});

console.log('Dispatched flow reference:', flow.flow.reference);
console.log('Customer checkout link:', flow.flow.checkoutUrl);
```

### Nigeria Corridor (Bank Transfer & Cards . NGN)

```typescript
const flow = await sivan.flows.dispatch({
  customerPhone: '+2348012345678',
  customerName: 'Chidi Okafor',
  amount: 15000,
  currency: 'NGN',
  orderReference: 'ORD-NG-5501',
  includeVirtualAccount: true // Generates dedicated Wema Bank NUBAN for bank transfer
});

console.log('Dedicated Account:', flow.flow.dedicatedAccountNumber);
console.log('Bank Name:', flow.flow.dedicatedBankName);
```

---

## 2. Embedded Multi-Chain & Fiat Wallets (`sivan.wallets`)

### Provision User Wallet (`solana`, `celo`, `base`, `stellar`, `starknet`)

```typescript
const wallet = await sivan.wallets.create('usr_9921_alpha', 'solana');
console.log('Wallet Address:', wallet.address);
```

### Query Unified Spendable Balances

```typescript
const balance = await sivan.wallets.getBalance('usr_9921_alpha');
console.log('Total USD Value:', balance.totalUsdValue);
console.log('NGN Balance:', balance.fiat.ngnBalance);
```

### Generate Dedicated NUBAN Virtual Account

```typescript
const dva = await sivan.wallets.createVirtualAccount({
  userId: 'usr_9921_alpha',
  customerName: 'Emeka Obi',
  customerEmail: 'emeka@example.com',
  customerPhone: '2348012345678'
});
console.log('Deposit Account:', dva.accountNumber, dva.bankName);
```

### Instant Internal Transfer & Bank Off-Ramp

```typescript
// Internal P2P Wallet Transfer
await sivan.wallets.transfer('usr_9921_alpha', {
  recipientPhone: '2348099887766',
  amount: 5000,
  currency: 'NGN',
  narration: 'Freelance milestone payout'
});

// Near-Instant Bank Withdrawal (NIBSS NIP)
const withdrawal = await sivan.wallets.withdrawNgn({
  userId: 'usr_9921_alpha',
  amountNgn: 10000,
  accountNumber: '0123456789',
  bankCode: '058',
  accountName: 'EMEKA OBI'
});
```

---

## 3. Verifying Inbound Webhook Callbacks

Sivan delivers signed webhooks via a durable outbox with exponential backoff (+1m, +5m, +15m, +1h, +6h). Verify signatures using constant-time HMAC-SHA256:

```typescript
import express from 'express';
import { SivanClient } from '@sivanai/sdk';

const app = express();
const sivan = new SivanClient({
  secretKey: process.env.SIVAN_SECRET_KEY!,
  webhookSecret: process.env.SIVAN_WEBHOOK_SECRET!
});

app.post('/api/sivan-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-sivan-signature'];

  const isValid = sivan.webhooks.verifySignature(req.body, signature);
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === 'payment.successful') {
    console.log(`Payment confirmed for order ${event.orderReference} (${event.amount} ${event.currency})`);
  }

  res.status(200).send({ received: true });
});
```

---

## Support & Resources

• Website: https://sivantech.online  
• Payment App: https://app.sivantech.online  
• Staging API Sandbox: https://api-staging.sivantech.online  
• Official Support: support@sivantech.online  

License: Apache-2.0
