import type { SivanClient } from '../client.js';
import type {
  CreateVirtualAccountParams,
  DeveloperBalanceResult,
  LinkTelegramParams,
  LinkTelegramResult,
  UserWalletRecord,
  VirtualAccountResult,
  WalletChain,
  WalletTransferParams,
  WalletTransferResult,
  WithdrawalOrderResult,
  WithdrawGhsParams,
  WithdrawNgnParams,
} from '../types.js';
import { SivanError } from '../errors.js';

export class WalletsResource {
  constructor(private readonly client: SivanClient) {}

  /**
   * Provisions or retrieves an embedded smart wallet for a user on the specified blockchain network.
   * Idempotent: repeat calls return the existing wallet.
   *
   * @param userId Unique user identifier
   * @param chain Target blockchain network (defaults to 'solana')
   */
  async create(userId: string, chain: WalletChain = 'solana'): Promise<UserWalletRecord> {
    if (!userId) {
      throw new SivanError('userId is required to provision a wallet');
    }

    const res = await this.client.request<{ data: UserWalletRecord }>(
      `/api/users/${encodeURIComponent(userId)}/wallets`,
      {
        method: 'POST',
        body: JSON.stringify({ chain }),
      }
    );

    return res.data;
  }

  /**
   * Lists all multi-chain wallets belonging to a user.
   * Pass `{ balances: true }` to query live on-chain balances across networks.
   */
  async list(
    userId: string,
    options: { balances?: boolean } = { balances: true }
  ): Promise<UserWalletRecord[]> {
    if (!userId) {
      throw new SivanError('userId is required to list wallets');
    }

    const query = options?.balances ? '?balances=true' : '';
    const res = await this.client.request<{ data: UserWalletRecord[] }>(
      `/api/users/${encodeURIComponent(userId)}/wallets${query}`,
      { method: 'GET' }
    );

    return res.data;
  }

  /**
   * Queries the unified spendable balance across fiat (NGN, KES, GHS) and crypto ledgers for a user.
   */
  async getBalance(userId: string): Promise<DeveloperBalanceResult> {
    if (!userId) {
      throw new SivanError('userId is required to query balance');
    }

    return this.client.request<DeveloperBalanceResult>(
      `/api/v1/developer/balance/${encodeURIComponent(userId)}`,
      { method: 'GET' }
    );
  }

  /**
   * Generates a dedicated NUBAN virtual bank account for automated NGN wallet funding.
   */
  async createVirtualAccount(
    params: CreateVirtualAccountParams
  ): Promise<VirtualAccountResult> {
    if (!params.userId || !params.customerEmail || !params.customerPhone) {
      throw new SivanError('userId, customerEmail, and customerPhone are required');
    }

    return this.client.request<VirtualAccountResult>(
      '/api/virtual-accounts/paystack/create',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * Executes an instant peer-to-peer internal balance transfer between Sivan users.
   */
  async transfer(
    userId: string,
    params: WalletTransferParams
  ): Promise<WalletTransferResult> {
    if (!userId) {
      throw new SivanError('userId is required to initiate a transfer');
    }
    if (!params.recipientPhone || !params.amount || params.amount <= 0) {
      throw new SivanError('recipientPhone and a positive amount are required');
    }

    return this.client.request<WalletTransferResult>(
      `/api/users/${encodeURIComponent(userId)}/balance/transfers`,
      {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone: String(params.recipientPhone).replace(/^\+/, '').trim(),
          amount: params.amount,
          currency: params.currency || 'NGN',
          narration: params.narration,
        }),
      }
    );
  }

  /**
   * Initiates a near-instant bank withdrawal (NGN off-ramp via NIBSS NIP rails).
   */
  async withdrawNgn(params: WithdrawNgnParams): Promise<WithdrawalOrderResult> {
    if (!params.userId || !params.accountNumber || !params.bankCode || !params.amountNgn) {
      throw new SivanError('userId, accountNumber, bankCode, and amountNgn are required');
    }

    return this.client.request<WithdrawalOrderResult>('/api/ngn/offramp/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Initiates a mobile money withdrawal in Ghana (GHS off-ramp via MTN MoMo / Vodafone Cash).
   */
  async withdrawGhs(params: WithdrawGhsParams): Promise<WithdrawalOrderResult> {
    if (!params.userId || !params.mobileMoneyNumber || !params.amountGhs) {
      throw new SivanError('userId, mobileMoneyNumber, and amountGhs are required');
    }

    return this.client.request<WithdrawalOrderResult>('/api/ghs/offramp/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Links a user's Telegram account ID to their Sivan wallet identity for Telegram Mini-App access.
   */
  async linkTelegram(params: LinkTelegramParams): Promise<LinkTelegramResult> {
    if (!params.telegramUserId || !params.phone) {
      throw new SivanError('telegramUserId and phone are required');
    }

    return this.client.request<LinkTelegramResult>('/api/identity/link-telegram/redeem', {
      method: 'POST',
      body: JSON.stringify({
        telegramUserId: String(params.telegramUserId),
        phone: String(params.phone).replace(/^\+/, '').trim(),
      }),
    });
  }
}
