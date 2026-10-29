/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { paypalService } from '../services/paypal';
import { sentinelEngine } from '../services/sentinel';
import { proofEngine } from '../services/proofEngine';
import { crashTestService } from '../services/crashTestService';
import { aiProvider } from '../services/aiProvider';
import { SystemHealth } from '../../src/types/server';

export const apiRouter = Router();

// ==============================================================================
// 1. HEALTH & SYSTEM STATUS
// ==============================================================================
apiRouter.get('/health', (req: Request, res: Response) => {
  const health: SystemHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: db.getDbType(),
      connected: true,
      storagePath: db.getStoragePath(),
    },
    paypalSandbox: paypalService.getConfigStatus(),
    aiProvider: {
      configured: aiProvider.isConfigured(),
      provider: aiProvider.isConfigured() ? 'gemini' : 'deterministic_demo',
    },
  };
  res.json(health);
});

// ==============================================================================
// 2. AGENTS & MARKETPLACE
// ==============================================================================
apiRouter.get('/agents', (req: Request, res: Response) => {
  const { category, role, search } = req.query;
  let agents = db.getAgents();

  if (category && category !== 'all') {
    agents = agents.filter((a) => a.category === category);
  }
  if (role && role !== 'all') {
    agents = agents.filter((a) => a.role === role);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    agents = agents.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.capabilities || []).some((c) => c.toLowerCase().includes(q))
    );
  }

  res.json({ count: agents.length, agents });
});

apiRouter.get('/agents/:id', (req: Request, res: Response) => {
  const agent = db.getAgentById(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

apiRouter.post('/agents/execute-task', async (req: Request, res: Response) => {
  const { agentId, taskTitle, scope, requirements } = req.body;
  const agent = db.getAgentById(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Target agent not found' });
  }

  try {
    const result = await aiProvider.executeAgentTask({
      agentId,
      agentName: agent.name,
      taskTitle: taskTitle || 'Specialist Task Execution',
      scope: scope || agent.tagline,
      requirements: Array.isArray(requirements) ? requirements : agent.capabilities,
    });
    res.json(result);
  } catch (err) {
    console.error('Agent execution error:', err);
    res.status(500).json({ error: 'Agent execution failed' });
  }
});

// ==============================================================================
// 3. CONTRACT FORGE & LIFECYCLE
// ==============================================================================
apiRouter.get('/contracts', (req: Request, res: Response) => {
  const contracts = db.getContracts();
  res.json({ count: contracts.length, contracts });
});

apiRouter.get('/contracts/:id', (req: Request, res: Response) => {
  const contract = db.getContractById(req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  const versions = db.getContractVersions(contract.id);
  res.json({ contract, versions });
});

apiRouter.post('/contracts', (req: Request, res: Response) => {
  const {
    title,
    buyerAgentId,
    sellerAgentId,
    verifierAgentId,
    scope,
    deliverables,
    acceptanceCriteria,
    budgetUsd,
    deadline,
    revisionPolicy,
    sentinelPolicy,
  } = req.body;

  // Server-side validation
  if (!title || !buyerAgentId || !sellerAgentId || !budgetUsd) {
    return res.status(400).json({ error: 'Missing required contract fields' });
  }

  if (typeof budgetUsd !== 'number' || budgetUsd <= 0) {
    return res.status(400).json({ error: 'Contract budget must be a positive number' });
  }

  try {
    const newContract = db.createContract({
      title,
      buyerAgentId,
      sellerAgentId,
      verifierAgentId: verifierAgentId || 'agent-verifier-2',
      scope: scope || 'Standard contract scope',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      budgetUsd,
      currency: 'USD',
      deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      revisionPolicy: revisionPolicy || 'Up to 2 verification iterations before refund.',
      sentinelRiskScore: 10,
      sentinelPolicy: sentinelPolicy || 'strict',
      status: 'escrow_locked',
      paypalPaymentStatus: 'escrow_held',
    });

    res.status(201).json(newContract);
  } catch (err) {
    console.error('Contract creation error:', err);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

apiRouter.patch('/contracts/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const updated = db.updateContractStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  res.json(updated);
});

// ==============================================================================
// 4. PAYPAL SENTINEL (RISK INTELLIGENCE)
// ==============================================================================
apiRouter.get('/sentinel/alerts', (req: Request, res: Response) => {
  const alerts = db.getSentinelAlerts();
  res.json({ count: alerts.length, alerts });
});

apiRouter.get('/sentinel/alerts/:id', (req: Request, res: Response) => {
  const alert = db.getSentinelAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Sentinel alert not found' });
  }
  res.json(alert);
});

apiRouter.post('/sentinel/evaluate', (req: Request, res: Response) => {
  const {
    contractId,
    sellerAgentId,
    invoiceAmountUsd,
    deliverableSha256,
    scopeText,
    sourceIpOrAsn,
    policy,
  } = req.body;

  if (!contractId || !sellerAgentId || typeof invoiceAmountUsd !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters for risk evaluation' });
  }

  const evaluation = sentinelEngine.evaluate({
    contractId,
    sellerAgentId,
    invoiceAmountUsd,
    deliverableSha256: deliverableSha256 || '',
    scopeText,
    sourceIpOrAsn,
    policy,
  });

  res.json(evaluation);
});

apiRouter.post('/sentinel/decision', (req: Request, res: Response) => {
  const { alertId, action, reviewerId, notes } = req.body;

  if (!alertId || !action || !['authorized', 'rejected', 'escalated'].includes(action)) {
    return res.status(400).json({ error: 'Invalid decision payload' });
  }

  const updatedAlert = db.updateSentinelDecision(
    alertId,
    action,
    reviewerId || 'Analyst-Session-0x49',
    notes
  );

  if (!updatedAlert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json(updatedAlert);
});

// ==============================================================================
// 5. PROOF ENGINE (INDEPENDENT VERIFICATION)
// ==============================================================================
apiRouter.get('/proof-engine/records', (req: Request, res: Response) => {
  const records = db.getProofRecords();
  res.json({ count: records.length, records });
});

apiRouter.post('/proof-engine/verify', async (req: Request, res: Response) => {
  const { contractId, verifierAgentId, deliverablePayload } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: 'contractId is required' });
  }

  try {
    const record = await proofEngine.verifyContract({
      contractId,
      verifierAgentId,
      deliverablePayload,
    });
    res.json(record);
  } catch (err: unknown) {
    console.error('ProofEngine verification error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Verification failed' });
  }
});

// ==============================================================================
// 6. TRUST CRASH TEST (ADVERSARIAL ATTACK LAB)
// ==============================================================================
apiRouter.get('/crash-test/scenarios', (req: Request, res: Response) => {
  const scenarios = db.getCrashScenarios();
  res.json({ count: scenarios.length, scenarios });
});

apiRouter.get('/crash-test/runs', (req: Request, res: Response) => {
  const runs = db.getCrashTestRuns();
  const metrics = crashTestService.calculateMetrics();
  res.json({ runs, metrics });
});

apiRouter.post('/crash-test/execute', async (req: Request, res: Response) => {
  const { scenarioId, policy } = req.body;

  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' });
  }

  try {
    const run = await crashTestService.executeScenario(
      scenarioId,
      policy || 'standard'
    );
    const metrics = crashTestService.calculateMetrics();
    res.json({ run, metrics });
  } catch (err) {
    console.error('Crash test execution error:', err);
    res.status(500).json({ error: 'Simulation execution failed' });
  }
});

apiRouter.post('/crash-test/reset', (req: Request, res: Response) => {
  crashTestService.resetAllRuns();
  const metrics = crashTestService.calculateMetrics();
  res.json({ message: 'Crash test history reset', metrics });
});

// ==============================================================================
// 7. TRUST LEDGER (CRYPTOGRAPHIC AUDIT)
// ==============================================================================
apiRouter.get('/ledger', (req: Request, res: Response) => {
  const { eventType, search } = req.query;
  let events = db.getLedgerEvents();

  if (eventType && eventType !== 'all') {
    events = events.filter((e) => e.eventType === eventType);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    events = events.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.contractId.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.blockHash.toLowerCase().includes(q)
    );
  }

  res.json({ count: events.length, events });
});

// ==============================================================================
// 8. PAYPAL SANDBOX INTEGRATION
// ==============================================================================
apiRouter.get('/paypal/status', (req: Request, res: Response) => {
  const status = paypalService.getConfigStatus();
  res.json(status);
});

apiRouter.get('/paypal/transactions', (req: Request, res: Response) => {
  const transactions = db.getPayPalTransactions();
  res.json({ count: transactions.length, transactions });
});

apiRouter.post('/paypal/create-order', async (req: Request, res: Response) => {
  const { contractId, amountUsd } = req.body;

  if (!contractId || typeof amountUsd !== 'number' || amountUsd <= 0) {
    return res.status(400).json({ error: 'Valid contractId and amountUsd are required' });
  }

  const contract = db.getContractById(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Server-side budget check
  if (amountUsd !== contract.budgetUsd) {
    return res.status(400).json({
      error: `Order amount ($${amountUsd}) must match authorized contract budget ($${contract.budgetUsd})`,
    });
  }

  try {
    const orderResponse = await paypalService.createOrder({
      contractId,
      amountUsd,
      description: `NEXUS Escrow Hold: ${contract.title}`,
    });

    const tx = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      orderId: orderResponse.id,
      contractId,
      buyerEmail: 'procure@alphaprocure.corp',
      sellerMerchantId: contract.sellerAgentId,
      amountUsd,
      status: 'ESCROW_HOLD' as const,
      createdAt: new Date().toISOString(),
      sentinelRiskPassed: true,
      proofVerified: false,
      authorizationCode: orderResponse.isSimulated
        ? `SIMULATED-DEV-${orderResponse.id.substring(0, 10)}`
        : `AUTH-SANDBOX-${orderResponse.id.substring(0, 10)}`,
      sandboxMode: !orderResponse.isSimulated,
      webhookReceived: false, // Strictly false at creation; only updated after verified webhook arrives
      isSimulated: orderResponse.isSimulated,
    };

    db.savePayPalTransaction(tx);

    res.status(201).json({ order: orderResponse, transaction: tx });
  } catch (err: unknown) {
    console.error('PayPal create-order error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Order creation failed' });
  }
});

apiRouter.post('/paypal/capture-order', async (req: Request, res: Response) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const tx = db.getPayPalTransactionByOrderId(orderId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found for orderId' });
  }

  if (tx.status === 'CAPTURED') {
    return res.status(400).json({ error: 'Order is already captured. Duplicate capture rejected.' });
  }

  // Server-side verification guard: Sentinel + Proof Engine
  if (!tx.sentinelRiskPassed) {
    return res.status(403).json({ error: 'Payment capture blocked: PayPal Sentinel risk flag unresolved.' });
  }
  if (!tx.proofVerified) {
    return res.status(403).json({ error: 'Payment capture blocked: Independent Proof Engine attestation required.' });
  }

  try {
    const captureResponse = await paypalService.captureOrder(orderId);

    // CONFIRMATION CHECK: Only update ledger and transaction status after confirmed PayPal API response!
    if (!captureResponse || !captureResponse.id || (captureResponse.status !== 'COMPLETED' && captureResponse.status !== 'PENDING')) {
      throw new Error(`PayPal capture was not confirmed: status is ${captureResponse?.status || 'UNKNOWN'}`);
    }

    tx.status = 'CAPTURED';
    tx.capturedAt = new Date().toISOString();
    tx.captureId = captureResponse.id;
    db.savePayPalTransaction(tx);
    db.updateContractStatus(tx.contractId, 'completed');

    // Record on ledger ONLY AFTER confirmed PayPal response
    db.recordLedgerEvent({
      eventType: 'PAYPAL_CAPTURE',
      contractId: tx.contractId,
      actorAgentId: 'agent-verifier-1',
      payloadHash: captureResponse.id,
      summary: `PayPal ${captureResponse.isSimulated ? 'Simulated' : 'Sandbox'} capture confirmed for ${orderId} ($${tx.amountUsd.toLocaleString()} USD)`,
      metadata: {
        orderId,
        captureId: captureResponse.id,
        amountUsd: tx.amountUsd,
        isSimulated: captureResponse.isSimulated,
        confirmedStatus: captureResponse.status,
      },
    });

    res.json({ capture: captureResponse, transaction: tx });
  } catch (err: unknown) {
    console.error('PayPal capture-order error:', err);
    const rawMsg = err instanceof Error ? err.message : 'Payment capture failed';
    const isUnapproved = rawMsg.includes('ORDER_NOT_APPROVED');

    res.status(isUnapproved ? 422 : 500).json({
      error: isUnapproved
        ? 'PayPal Sandbox order is pending buyer authorization. Payer must approve the transaction via the PayPal checkout link before escrow settlement can be captured.'
        : rawMsg,
      code: isUnapproved ? 'ORDER_NOT_APPROVED' : 'CAPTURE_FAILED',
      details: rawMsg,
    });
  }
});

apiRouter.post('/paypal/refund-order', async (req: Request, res: Response) => {
  const { orderId, amountUsd, note } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const tx = db.getPayPalTransactionByOrderId(orderId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found for order' });
  }

  if (tx.status === 'REFUNDED') {
    return res.status(400).json({ error: 'Transaction is already refunded.' });
  }

  try {
    let refundId = `REFUND-${Date.now()}`;
    let refundStatus = 'COMPLETED';

    if (tx.status === 'CAPTURED' && tx.captureId) {
      // Live capture refund via PayPal Sandbox API
      const refund = await paypalService.refundCapture(
        tx.captureId,
        amountUsd || tx.amountUsd,
        note
      );

      // CONFIRMATION CHECK: Only update ledger and transaction status after confirmed PayPal API response!
      if (!refund || !refund.id || (refund.status !== 'COMPLETED' && refund.status !== 'PENDING')) {
        throw new Error(`PayPal refund API did not confirm completion: status is ${refund?.status || 'UNKNOWN'}`);
      }

      refundId = refund.id;
      refundStatus = refund.status;
    } else {
      // Escrow hold released before capture
      refundId = `ESCROW-RELEASE-${Date.now()}`;
    }

    tx.status = 'REFUNDED';
    tx.refundId = refundId;
    db.savePayPalTransaction(tx);
    db.updateContractStatus(tx.contractId, 'disputed');

    // Record on ledger ONLY AFTER confirmed refund
    db.recordLedgerEvent({
      eventType: 'PAYPAL_AUTH',
      contractId: tx.contractId,
      actorAgentId: 'agent-buyer-1',
      payloadHash: refundId,
      summary: `PayPal Escrow refunded to buyer for ${orderId} ($${tx.amountUsd.toLocaleString()} USD)`,
      metadata: {
        orderId,
        refundId,
        refundStatus,
        amountUsd: tx.amountUsd,
        isSimulated: Boolean(tx.isSimulated),
      },
    });

    res.json({
      refund: {
        id: refundId,
        status: refundStatus,
        amount: { value: (amountUsd || tx.amountUsd).toFixed(2), currency_code: 'USD' },
      },
      transaction: tx,
    });
  } catch (err: unknown) {
    console.error('PayPal refund error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Refund failed' });
  }
});

// ==============================================================================
// 7. PAYPAL WEBHOOK (SIGNATURE VERIFICATION & IDEMPOTENT PROCESSING)
// ==============================================================================

apiRouter.get('/paypal/webhook/config', (req: Request, res: Response) => {
  const configStatus = paypalService.getConfigStatus();
  const appUrl = process.env.APP_URL || 'https://your-app-domain.run.app';

  res.json({
    webhookConfigured: configStatus.webhookIdConfigured,
    clientConfigured: configStatus.clientIdConfigured,
    mode: configStatus.mode,
    notice: configStatus.notice,
    recommendedWebhookUrl: `${appUrl.replace(/\/+$/, '')}/api/paypal/webhook`,
    requiredEvents: [
      'CHECKOUT.ORDER.APPROVED',
      'PAYMENT.CAPTURE.COMPLETED',
      'PAYMENT.CAPTURE.DENIED',
      'PAYMENT.CAPTURE.REFUNDED',
    ],
    postDeploymentInstructions: [
      '1. Obtain your public HTTPS URL after deployment (e.g. Cloud Run URL).',
      '2. In developer.paypal.com, navigate to Apps & Credentials -> Select your Sandbox App.',
      '3. Click "Add Webhook" and enter <PUBLIC_HTTPS_URL>/api/paypal/webhook.',
      '4. Subscribe to the 4 essential events listed above.',
      '5. Copy the generated Webhook ID and add PAYPAL_WEBHOOK_ID to your AI Studio Secrets.',
    ],
  });
});

apiRouter.get('/paypal/webhook/events', (req: Request, res: Response) => {
  const events = db.getProcessedWebhookEvents();
  res.json({ count: events.length, events });
});

apiRouter.post('/paypal/webhook', async (req: Request, res: Response) => {
  const event = req.body;
  const eventType = event?.event_type || 'UNKNOWN';
  const eventId = (event?.id as string) || (req.headers['paypal-transmission-id'] as string) || '';
  const resource = event?.resource;
  const resourceId = (resource?.id as string) || (resource?.supplementary_data?.related_ids?.order_id as string) || '';

  console.log(`[PayPal Webhook] Incoming event: ${eventType} (Event ID: ${eventId || 'none'}, Resource: ${resourceId || 'none'})`);

  // IDEMPOTENCY CHECK:
  // If this specific PayPal event has already been processed, acknowledge 200 without duplicate execution
  if (eventId && db.isWebhookEventProcessed(eventId)) {
    console.log(`[PayPal Webhook IDEMPOTENT] Duplicate event detected for ${eventId}. Bypassing re-execution.`);
    return res.status(200).json({
      received: true,
      duplicate: true,
      eventId,
      eventType,
      status: 'SKIPPED_DUPLICATE',
      notice: 'Event already processed idempotently. No duplicate state change or ledger entry created.',
    });
  }

  // CRYPTOGRAPHIC SIGNATURE VERIFICATION:
  // Calls PayPal's /v1/notifications/verify-webhook-signature API if PAYPAL_WEBHOOK_ID is set.
  // If PAYPAL_WEBHOOK_ID is unconfigured, honestly returns verified: false.
  const verification = await paypalService.verifyWebhookSignature(req.headers, event);

  if (!verification.verified) {
    console.warn(`[PayPal Webhook] Signature verification [${verification.status}]: ${verification.reason}`);

    if (eventId) {
      db.recordProcessedWebhookEvent({
        id: `PWE-${eventId}`,
        eventId,
        eventType,
        resourceId,
        processedAt: new Date().toISOString(),
        status: 'UNVERIFIED',
        summary: `Webhook received in unverified status: ${verification.status} (${verification.reason})`,
      });
    }

    // Always return HTTP 200 acknowledge to prevent PayPal webhook retry storms,
    // but honestly report verification failure and do NOT mutate critical ledger states without verified signature.
    return res.status(200).json({
      received: true,
      verified: false,
      status: verification.status,
      notice: verification.reason,
      eventType,
      eventId,
    });
  }

  // IF CRYPTOGRAPHICALLY VERIFIED BY PAYPAL:
  console.log(`[PayPal Webhook VERIFIED] Processing verified event: ${eventType} (${eventId})`);

  try {
    let actionSummary = `Processed PayPal webhook: ${eventType}`;

    if (eventType === 'CHECKOUT.ORDER.APPROVED' && resourceId) {
      const tx = db.getPayPalTransactionByOrderId(resourceId);
      if (tx && tx.status === 'CREATED') {
        tx.status = 'ESCROW_HOLD';
        tx.webhookReceived = true;
        db.savePayPalTransaction(tx);
        actionSummary = `Escrow hold locked for order ${resourceId}`;
        db.recordLedgerEvent({
          eventType: 'PAYPAL_AUTH',
          contractId: tx.contractId,
          actorAgentId: tx.buyerEmail,
          payloadHash: resourceId,
          summary: `PayPal verified webhook: Buyer authorized escrow hold for order ${resourceId}`,
          metadata: { orderId: resourceId, eventType, eventId },
        });
      }
    } else if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && resourceId) {
      const transactions = db.getPayPalTransactions();
      const tx = transactions.find(
        (t) => t.orderId === resourceId || t.orderId === resource?.supplementary_data?.related_ids?.order_id
      );
      if (tx && tx.status !== 'CAPTURED') {
        tx.status = 'CAPTURED';
        tx.capturedAt = new Date().toISOString();
        tx.webhookReceived = true;
        db.savePayPalTransaction(tx);
        db.updateContractStatus(tx.contractId, 'completed');
        actionSummary = `Capture completed and contract settled for order ${resourceId}`;
      }
    } else if (eventType === 'PAYMENT.CAPTURE.DENIED' && resourceId) {
      const transactions = db.getPayPalTransactions();
      const tx = transactions.find((t) => t.orderId === resourceId);
      if (tx) {
        tx.status = 'HELD_FOR_REVIEW';
        tx.webhookReceived = true;
        db.savePayPalTransaction(tx);
        db.updateContractStatus(tx.contractId, 'disputed');
        actionSummary = `Payment capture was denied by PayPal for ${resourceId}`;
      }
    } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED' && resourceId) {
      const transactions = db.getPayPalTransactions();
      const tx = transactions.find((t) => t.orderId === resourceId);
      if (tx) {
        tx.status = 'REFUNDED';
        tx.webhookReceived = true;
        db.savePayPalTransaction(tx);
        db.updateContractStatus(tx.contractId, 'disputed');
        actionSummary = `Refund completed for order ${resourceId}`;
      }
    }

    // Record idempotency token
    if (eventId) {
      db.recordProcessedWebhookEvent({
        id: `PWE-${eventId}`,
        eventId,
        eventType,
        resourceId,
        processedAt: new Date().toISOString(),
        status: 'PROCESSED',
        summary: actionSummary,
      });
    }

    return res.status(200).json({
      received: true,
      verified: true,
      eventType,
      eventId,
      processed: true,
      summary: actionSummary,
    });
  } catch (err: unknown) {
    console.error('[PayPal Webhook] Error processing event:', err);
    return res.status(200).json({
      received: true,
      verified: true,
      error: 'Error processing verified event body',
    });
  }
});

