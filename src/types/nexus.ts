/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentRole = 'buyer' | 'seller' | 'verifier';

export type AgentTrustState = 'verified' | 'under_audit' | 'suspicious' | 'active';

export interface Agent {
  id: string;
  name: string;
  handle: string;
  role: AgentRole;
  trustState: AgentTrustState;
  trustScore: number; // 0 - 100
  category: 'code' | 'security' | 'data' | 'finance' | 'research' | 'verification';
  tagline: string;
  description: string;
  modelBackbone: string;
  hourlyRateUsd: number;
  fixedJobMinUsd: number;
  escrowDepositUsd: number;
  jobsCompleted: number;
  disputeRate: number; // percentage
  verifiableHash: string;
  walletAddress: string;
  paypalMerchantId: string;
  isDemo: boolean;
  capabilities: string[];
  recentContracts: string[];
  coordinates: { x: number; y: number }; // For network graph visual layout
}

export type ContractStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'escrow_locked' 
  | 'in_progress' 
  | 'submitted_for_proof' 
  | 'sentinel_flagged' 
  | 'proof_verified' 
  | 'completed' 
  | 'disputed';

export interface AcceptanceCriterion {
  id: string;
  title: string;
  type: 'test_coverage' | 'schema' | 'latency' | 'security' | 'deliverable_hash';
  targetValue: string;
  actualValue?: string;
  status: 'pending' | 'passed' | 'failed' | 'needs_review';
  evidenceLog?: string;
}

export interface Contract {
  id: string;
  title: string;
  buyerAgentId: string;
  sellerAgentId: string;
  verifierAgentId: string;
  scope: string;
  deliverables: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  budgetUsd: number;
  currency: 'USD';
  deadline: string;
  revisionPolicy: string;
  sentinelRiskScore: number;
  sentinelPolicy: 'standard' | 'strict' | 'zero_trust';
  status: ContractStatus;
  paypalOrderId?: string;
  paypalPaymentStatus: 'unpaid' | 'escrow_held' | 'released' | 'refunded';
  createdAt: string;
  completedAt?: string;
  contractSha256: string;
}

export type SentinelSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface SentinelRiskFactor {
  factor: string;
  scoreImpact: number; // e.g. +35
  status: 'nominal' | 'warning' | 'critical';
  details: string;
}

export interface SentinelAlert {
  id: string;
  transactionId: string;
  contractId: string;
  agentId: string;
  timestamp: string;
  riskScore: number; // 0-100
  severity: SentinelSeverity;
  alertType: 
    | 'duplicate_invoice'
    | 'abnormal_spending'
    | 'collusion_detected'
    | 'prompt_injection'
    | 'unverified_identity'
    | 'deliverable_spoof';
  summary: string;
  explanation: string;
  factors: SentinelRiskFactor[];
  rawPayloadSnippet: string;
  recommendedAction: 'authorize' | 'escalate' | 'reject';
  decisionStatus: 'pending' | 'authorized' | 'rejected' | 'escalated';
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ProofVerificationRecord {
  id: string;
  contractId: string;
  verifierAgentId: string;
  timestamp: string;
  criteriaResults: AcceptanceCriterion[];
  overallVerdict: 'passed' | 'failed' | 'needs_review';
  deliverableSha256: string;
  verifierSignature: string;
  executionLogs: string[];
  disputeNotes?: string;
}

export interface CrashScenario {
  id: string;
  title: string;
  adversaryAgentName: string;
  attackVector: string;
  description: string;
  injectedAnomaly: string;
  expectedLossUsd: number;
  payload: Record<string, unknown>;
}

export interface CrashTestRun {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  timestamp: string;
  policy: 'permissive' | 'standard' | 'zero_trust';
  intercepted: boolean;
  interceptedBy: 'PayPal Sentinel' | 'Proof Engine' | 'Authorization Gate' | 'None (Breach)';
  riskScore: number;
  verdict: 'ATTACK_NEUTRALIZED' | 'FLAGGED_FOR_HUMAN' | 'EXPLOIT_SUCCEEDED';
  mitigationSteps: string[];
  savedAmountUsd: number;
  executionTrace: Array<{
    step: string;
    status: 'pass' | 'flag' | 'block';
    message: string;
  }>;
}

export interface LedgerEvent {
  id: string;
  blockHeight: number;
  timestamp: string;
  eventType: 'CONTRACT_CREATED' | 'SENTINEL_SCAN' | 'PROOF_VERIFIED' | 'PAYPAL_AUTH' | 'PAYPAL_CAPTURE' | 'DISPUTE_RAISED';
  contractId: string;
  actorAgentId: string;
  payloadHash: string;
  prevBlockHash: string;
  blockHash: string;
  summary: string;
  metadata: Record<string, unknown>;
}

export interface PayPalTransaction {
  id: string;
  orderId: string;
  contractId: string;
  buyerEmail: string;
  sellerMerchantId: string;
  amountUsd: number;
  status: 'CREATED' | 'ESCROW_HOLD' | 'CAPTURED' | 'REFUNDED' | 'HELD_FOR_REVIEW';
  createdAt: string;
  capturedAt?: string;
  captureId?: string;
  refundId?: string;
  sentinelRiskPassed: boolean;
  proofVerified: boolean;
  authorizationCode: string;
  sandboxMode: boolean;
  webhookReceived: boolean;
  isSimulated?: boolean;
}

export interface ProcessedWebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  resourceId?: string;
  processedAt: string;
  status: 'PROCESSED' | 'SKIPPED_DUPLICATE' | 'FAILED' | 'UNVERIFIED';
  summary?: string;
}
