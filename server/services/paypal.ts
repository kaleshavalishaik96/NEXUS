/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  webhookId?: string;
  isConfigured: boolean;
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: Array<{ href: string; rel: string; method: string }>;
  isSimulated: boolean;
}

export interface PayPalCaptureResponse {
  id: string; // Capture ID
  status: 'COMPLETED' | 'DECLINED' | 'FAILED' | 'PENDING';
  amount: { value: string; currency_code: string };
  seller_receivable_breakdown?: {
    gross_amount: { value: string; currency_code: string };
    paypal_fee: { value: string; currency_code: string };
    net_amount: { value: string; currency_code: string };
  };
  isSimulated: boolean;
}

export interface PayPalRefundResponse {
  id: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amount: { value: string; currency_code: string };
  isSimulated: boolean;
}

class PayPalService {
  private config: PayPalConfig;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';

    const isConfigured = Boolean(
      clientId &&
      clientSecret &&
      clientId !== 'YOUR_PAYPAL_SANDBOX_CLIENT_ID' &&
      clientSecret !== 'YOUR_PAYPAL_SANDBOX_CLIENT_SECRET'
    );

    this.config = {
      clientId,
      clientSecret,
      baseUrl: baseUrl.replace(/\/+$/, ''),
      webhookId,
      isConfigured,
    };
  }

  public getConfigStatus(): {
    configured: boolean;
    baseUrl: string;
    clientIdConfigured: boolean;
    webhookIdConfigured: boolean;
    mode: 'live_sandbox' | 'simulated_fallback';
    notice: string;
  } {
    const webhookConfigured = Boolean(
      this.config.webhookId &&
      this.config.webhookId !== 'YOUR_PAYPAL_SANDBOX_WEBHOOK_ID'
    );

    return {
      configured: this.config.isConfigured,
      baseUrl: this.config.baseUrl,
      clientIdConfigured: Boolean(this.config.clientId && this.config.clientId !== 'YOUR_PAYPAL_SANDBOX_CLIENT_ID'),
      webhookIdConfigured: webhookConfigured,
      mode: this.config.isConfigured ? ('live_sandbox' as const) : ('simulated_fallback' as const),
      notice: this.config.isConfigured
        ? `Connected to PayPal Sandbox API endpoint. Webhook verification: ${webhookConfigured ? 'ACTIVE' : 'STANDBY (PAYPAL_WEBHOOK_ID unconfigured)'}`
        : 'Sandbox credentials not set in .env. Operating in isolated developer test mode.',
    };
  }

  /**
   * Verifies an incoming PayPal webhook event signature using PayPal Sandbox API.
   * If PAYPAL_WEBHOOK_ID is unconfigured, honestly returns verified: false without failing runtime.
   */
  public async verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    webhookEvent: unknown
  ): Promise<{ verified: boolean; status: 'VERIFIED' | 'UNVERIFIED' | 'FAILED'; reason?: string }> {
    const getHeader = (name: string): string => {
      const val = headers[name.toLowerCase()] || headers[name];
      return Array.isArray(val) ? val[0] : (val || '');
    };

    const webhookId = this.config.webhookId;
    const isWebhookIdConfigured = Boolean(webhookId && webhookId !== 'YOUR_PAYPAL_SANDBOX_WEBHOOK_ID');

    if (!isWebhookIdConfigured) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        reason: 'PAYPAL_WEBHOOK_ID is unconfigured in development. Signature validation bypassed (no automated settlement performed).',
      };
    }

    if (!this.config.isConfigured) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        reason: 'PayPal Sandbox client credentials unconfigured. Cannot verify signature against PayPal API.',
      };
    }

    const authAlgo = getHeader('paypal-auth-algo');
    const certUrl = getHeader('paypal-cert-url');
    const transmissionId = getHeader('paypal-transmission-id');
    const transmissionSig = getHeader('paypal-transmission-sig');
    const transmissionTime = getHeader('paypal-transmission-time');

    if (!transmissionId || !transmissionSig || !certUrl || !authAlgo) {
      return {
        verified: false,
        status: 'FAILED',
        reason: 'Missing required PayPal transmission verification headers (paypal-transmission-id, paypal-transmission-sig, cert-url, auth-algo).',
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const verificationPayload = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      };

      const res = await fetch(`${this.config.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          verified: false,
          status: 'FAILED',
          reason: `PayPal verification API responded with HTTP ${res.status}: ${errorText}`,
        };
      }

      const result = await res.json();
      if (result.verification_status === 'SUCCESS') {
        return {
          verified: true,
          status: 'VERIFIED',
        };
      } else {
        return {
          verified: false,
          status: 'FAILED',
          reason: `PayPal signature verification status: ${result.verification_status}`,
        };
      }
    } catch (err: unknown) {
      return {
        verified: false,
        status: 'FAILED',
        reason: err instanceof Error ? err.message : 'Unknown error during signature verification',
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config.isConfigured) {
      throw new Error('PayPal Sandbox credentials not configured in environment variables.');
    }

    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    const response = await fetch(`${this.config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Failed to authenticate with PayPal Sandbox API: ${response.status} ${errBody}`);
    }

    const data = await response.json();
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return this.cachedToken.token;
  }

  /**
   * Create an Order on PayPal Sandbox (intent: CAPTURE).
   */
  public async createOrder(params: {
    contractId: string;
    amountUsd: number;
    currency?: string;
    description?: string;
  }): Promise<PayPalOrderResponse> {
    const currency = params.currency || 'USD';
    const amountStr = params.amountUsd.toFixed(2);
    const requestId = `nexus-${params.contractId}-${Date.now()}`;

    if (!this.config.isConfigured) {
      // Deterministic simulated order with explicit isSimulated flag
      const simulatedOrderId = `PAYPAL-ORD-SIM-${crypto.createHash('sha256').update(requestId).digest('hex').substring(0, 10).toUpperCase()}`;
      return {
        id: simulatedOrderId,
        status: 'CREATED',
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${simulatedOrderId}`,
            rel: 'approve',
            method: 'GET',
          },
        ],
        isSimulated: true,
      };
    }

    const accessToken = await this.getAccessToken();
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.contractId,
          description: params.description || `NEXUS Autonomous Contract Escrow: ${params.contractId}`,
          amount: {
            currency_code: currency,
            value: amountStr,
          },
        },
      ],
      application_context: {
        brand_name: 'NEXUS Trust Fabric',
        user_action: 'PAY_NOW',
        return_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/paypal/return`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/paypal/cancel`,
      },
    };

    const response = await fetch(`${this.config.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Sandbox createOrder failed: ${response.status} ${err}`);
    }

    const orderData = await response.json();
    return {
      id: orderData.id,
      status: orderData.status,
      links: orderData.links || [],
      isSimulated: false,
    };
  }

  /**
   * Capture an authorized Order on PayPal Sandbox.
   */
  public async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    const requestId = `nexus-cap-${orderId}-${Date.now()}`;

    if (!this.config.isConfigured || orderId.startsWith('PAYPAL-ORD-SIM-')) {
      const captureId = `CAP-SIM-${crypto.createHash('sha256').update(requestId).digest('hex').substring(0, 12).toUpperCase()}`;
      return {
        id: captureId,
        status: 'COMPLETED',
        amount: { value: '0.00', currency_code: 'USD' },
        isSimulated: true,
      };
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Sandbox captureOrder failed: ${response.status} ${err}`);
    }

    const captureData = await response.json();
    const captureUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];

    return {
      id: captureUnit?.id || captureData.id,
      status: captureUnit?.status || captureData.status,
      amount: captureUnit?.amount || { value: '0.00', currency_code: 'USD' },
      seller_receivable_breakdown: captureUnit?.seller_receivable_breakdown,
      isSimulated: false,
    };
  }

  /**
   * Refund a captured payment on PayPal Sandbox.
   */
  public async refundCapture(captureId: string, amount?: number, note?: string): Promise<PayPalRefundResponse> {
    if (!this.config.isConfigured || captureId.startsWith('CAP-SIM-')) {
      return {
        id: `REFUND-SIM-${Date.now()}`,
        status: 'COMPLETED',
        amount: { value: amount ? amount.toFixed(2) : '0.00', currency_code: 'USD' },
        isSimulated: true,
      };
    }

    const accessToken = await this.getAccessToken();
    const payload: Record<string, unknown> = {
      note_to_payer: note || 'NEXUS Contract Escrow Refund (Failed acceptance criteria or dispute resolution)',
    };
    if (amount) {
      payload.amount = {
        value: amount.toFixed(2),
        currency_code: 'USD',
      };
    }

    const response = await fetch(`${this.config.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Sandbox refund failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      amount: data.amount,
      isSimulated: false,
    };
  }
}

export const paypalService = new PayPalService();
