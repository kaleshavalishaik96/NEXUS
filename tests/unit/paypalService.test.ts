/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { paypalService } from '../../server/services/paypal';
import { db } from '../../server/db/database';

describe('PayPal Sandbox Service', () => {
  it('reports correct configuration status and mode', () => {
    const status = paypalService.getConfigStatus();
    expect(status).toHaveProperty('configured');
    expect(status).toHaveProperty('mode');
    expect(status.baseUrl).toBe('https://api-m.sandbox.paypal.com');
  });

  it('creates sandbox order with valid ID and intent', async () => {
    const order = await paypalService.createOrder({
      contractId: 'CTR-2026-081',
      amountUsd: 2850,
      description: 'Test contract escrow',
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('CREATED');
    expect(order.links.length).toBeGreaterThan(0);
  });

  it('captures order or strictly enforces PayPal buyer approval requirement', async () => {
    const order = await paypalService.createOrder({
      contractId: 'CTR-2026-081',
      amountUsd: 2850,
    });

    if (order.isSimulated) {
      const capture = await paypalService.captureOrder(order.id);
      expect(capture.id).toBeDefined();
      expect(capture.status).toBe('COMPLETED');
    } else {
      // In live PayPal sandbox, an order created via Checkout cannot be captured until approved by payer
      await expect(paypalService.captureOrder(order.id)).rejects.toThrow(/ORDER_NOT_APPROVED|422/);
    }
  });

  it('honestly reports UNVERIFIED when PAYPAL_WEBHOOK_ID is unconfigured', async () => {
    const result = await paypalService.verifyWebhookSignature(
      {
        'paypal-transmission-id': 'sim-transmission-123',
        'paypal-transmission-sig': 'sim-signature-abc',
        'paypal-cert-url': 'https://api.sandbox.paypal.com/cert.pem',
        'paypal-auth-algo': 'SHA256withRSA',
      },
      { event_type: 'CHECKOUT.ORDER.APPROVED' }
    );

    expect(result.verified).toBe(false);
    expect(result.status).toBe('UNVERIFIED');
    expect(result.reason).toContain('PAYPAL_WEBHOOK_ID');
  });

  it('reports missing headers when headers are absent', async () => {
    const result = await paypalService.verifyWebhookSignature({}, { event_type: 'CHECKOUT.ORDER.APPROVED' });
    expect(result.verified).toBe(false);
  });

  it('tracks webhook idempotency to prevent duplicate event execution', () => {
    const testEventId = 'WH-TEST-EVENT-' + Date.now();
    expect(db.isWebhookEventProcessed(testEventId)).toBe(false);

    db.recordProcessedWebhookEvent({
      id: `PWE-${testEventId}`,
      eventId: testEventId,
      eventType: 'CHECKOUT.ORDER.APPROVED',
      resourceId: 'ORD-TEST-999',
      processedAt: new Date().toISOString(),
      status: 'PROCESSED',
      summary: 'Order approved',
    });

    expect(db.isWebhookEventProcessed(testEventId)).toBe(true);

    // Recording duplicate does not produce multiple identical entries
    const countBefore = db.getProcessedWebhookEvents().filter((e) => e.eventId === testEventId).length;
    db.recordProcessedWebhookEvent({
      id: `PWE-${testEventId}`,
      eventId: testEventId,
      eventType: 'CHECKOUT.ORDER.APPROVED',
      processedAt: new Date().toISOString(),
      status: 'SKIPPED_DUPLICATE',
    });
    const countAfter = db.getProcessedWebhookEvents().filter((e) => e.eventId === testEventId).length;
    expect(countBefore).toBe(1);
    expect(countAfter).toBe(1);
  });
});
