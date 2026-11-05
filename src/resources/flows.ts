import type { SivanClient } from '../client.js';
import type { DispatchFlowParams, DispatchedFlowResult, FlowRecord } from '../types.js';

export class FlowsResource {
  constructor(private readonly client: SivanClient) {}

  /**
   * Dispatches an interactive WhatsApp checkout flow to a customer phone number.
   *
   * @example
   * const flow = await sivan.flows.dispatch({
   *   customerPhone: '+254712345678',
   *   amount: 4500,
   *   currency: 'KES',
   *   orderReference: 'ORD-9001'
   * });
   */
  async dispatch(params: DispatchFlowParams): Promise<DispatchedFlowResult> {
    const payload = {
      customerPhone: params.customerPhone,
      amountNgn: params.amount,
      currency: params.currency || 'KES',
      customerName: params.customerName,
      orderReference: params.orderReference,
      flowType: params.flowType || 'checkout',
      includeVirtualAccount: params.includeVirtualAccount ?? false,
      greetingMessage: params.greetingMessage,
      buttonLabel: params.buttonLabel,
      successMessage: params.successMessage,
      metadata: params.metadata,
    };

    return this.client.request<DispatchedFlowResult>('/api/v1/business/flows/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Retrieves the current status, payment details, and virtual accounts of an order flow.
   *
   * @param reference The unique merchant order reference (e.g. ORD-9001)
   */
  async get(reference: string): Promise<FlowRecord> {
    const res = await this.client.request<{ success: boolean; flow: FlowRecord }>(
      `/api/v1/business/flows/${encodeURIComponent(reference)}`,
      { method: 'GET' }
    );
    return res.flow;
  }

  /**
   * Simulates settlement of an order flow in development / test environments.
   * Automatically queues a payment.successful webhook event into the durable outbox.
   */
  async simulateComplete(reference: string): Promise<{
    success: boolean;
    reference: string;
    status: string;
    message: string;
  }> {
    return this.client.request(`/api/v1/business/flows/${encodeURIComponent(reference)}/simulate-complete`, {
      method: 'POST',
    });
  }
}

