export interface SivanClientOptions {
  /**
   * Secret API key (e.g. sk_live_... or sk_test_...).
   */
  secretKey: string;

  /**
   * Optional merchant webhook secret (e.g. whsec_...) used to verify inbound signatures.
   */
  webhookSecret?: string;

  /**
   * Custom API base URL. Defaults to https://api-staging.sivantech.online
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds. Defaults to 15000 (15 seconds).
   */
  timeoutMs?: number;
}

export type SivanCurrency = 'KES' | 'NGN' | 'GHS' | 'USD' | 'USDC' | 'USDT' | string;

export type WalletChain =
  | 'solana'
  | 'celo'
  | 'base'
  | 'stellar'
  | 'starknet'
  | 'ethereum'
  | 'bsc'
  | 'arbitrum';

export interface DispatchFlowParams {
  /**
   * Recipient customer phone number in international format (e.g. +254712345678 or 2348012345678).
   */
  customerPhone: string;

  /**
   * Total payment amount for the customer checkout.
   */
  amount: number;

  /**
   * Currency corridor. Defaults to KES for Kenya, NGN for Nigeria, GHS for Ghana.
   */
  currency?: SivanCurrency;

  /**
   * Full name of customer for personalized WhatsApp copy.
   */
  customerName?: string;

  /**
   * Unique order reference in your database or store (e.g. ORD-1002).
   */
  orderReference?: string;

  /**
   * Flow type. Defaults to 'checkout'.
   */
  flowType?: 'checkout' | string;

  /**
   * When true on NGN corridor, dynamically binds a dedicated NUBAN virtual bank account.
   * Defaults to false (clean direct checkout flow).
   */
  includeVirtualAccount?: boolean;

  /**
   * Custom greeting displayed on WhatsApp (e.g. 'Hello! Your order from Acme is ready for payment.')
   */
  greetingMessage?: string;

  /**
   * Custom action button label on WhatsApp (e.g. 'Pay with M-Pesa' or 'Pay Invoice').
   */
  buttonLabel?: string;

  /**
   * Custom success text displayed when payment is verified.
   */
  successMessage?: string;

  /**
   * Arbitrary JSON metadata returned in webhook callbacks.
   */
  metadata?: Record<string, any>;
}

export interface DispatchedFlowResult {
  success: boolean;
  merchant: {
    id: string;
    name: string;
  };
  flow: {
    reference: string;
    status: string;
    customerPhone: string;
    amountNgn: number;
    checkoutUrl: string;
    dedicatedAccountNumber?: string | null;
    dedicatedBankName?: string | null;
  };
}

export interface FlowRecord {
  id: string;
  merchantId: string;
  reference: string;
  customerPhone: string;
  customerName?: string;
  amountNgn: number;
  currency: string;
  flowType: string;
  status: 'PENDING' | 'DISPATCHED' | 'COMPLETED' | 'EXPIRED' | 'FAILED' | string;
  dedicatedAccountNumber?: string | null;
  dedicatedBankName?: string | null;
  metaMessageId?: string | null;
  greetingMessage?: string | null;
  buttonLabel?: string | null;
  successMessage?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string | null;
}

export interface WebhookEvent<TMetadata = Record<string, any>> {
  event: 'payment.successful' | string;
  flowId: string;
  merchantId: string;
  orderReference: string;
  amount: number;
  currency: string;
  customerPhone: string;
  customerName?: string;
  metadata: TMetadata;
  timestamp: string;
}

export interface WalletAssetBalance {
  asset: string;
  amount: number;
}

export interface UserWalletRecord {
  userId?: string;
  chain: WalletChain;
  address: string;
  acceptedAssets: string[];
  balances?: WalletAssetBalance[];
}

export interface DeveloperBalanceResult {
  userId: string;
  totalUsdValue: number;
  fiat: {
    ngnBalance: number;
    kesBalance?: number;
    ghsBalance?: number;
  };
  crypto: Array<{
    chain: WalletChain | string;
    asset: string;
    balance: number;
  }>;
}

export interface CreateVirtualAccountParams {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface VirtualAccountResult {
  success: boolean;
  accountNumber: string;
  bankName: string;
  accountName: string;
  currency: string;
  assignedAt: string;
}

export interface WalletTransferParams {
  recipientPhone: string;
  amount: number;
  currency?: SivanCurrency;
  narration?: string;
}

export interface WalletTransferResult {
  success: boolean;
  transferId: string;
  amount: number;
  currency: string;
  status: string;
  completedAt?: string;
}

export interface WithdrawNgnParams {
  userId: string;
  amountNgn: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  withdrawalPin?: string;
}

export interface WithdrawGhsParams {
  userId: string;
  amountGhs: number;
  mobileMoneyNumber: string;
  provider: 'MTN' | 'VODAFONE' | 'AIRTELTIGO' | string;
}

export interface WithdrawalOrderResult {
  success: boolean;
  orderId: string;
  status: string;
  settlementRail?: string;
  estimatedSettlementTime?: string;
}

export interface LinkTelegramParams {
  telegramUserId: string;
  phone: string;
}

export interface LinkTelegramResult {
  success: boolean;
  userId: string;
  phone: string;
  telegramLinked: boolean;
}
