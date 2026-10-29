/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  Agent,
  Contract,
  SentinelAlert,
  ProofVerificationRecord,
  CrashScenario,
  CrashTestRun,
  LedgerEvent,
  PayPalTransaction,
  ProcessedWebhookEvent,
} from '../../src/types/nexus';
import {
  INITIAL_AGENTS,
  INITIAL_CONTRACTS,
  INITIAL_SENTINEL_ALERTS,
  INITIAL_PROOF_RECORDS,
  CRASH_SCENARIOS,
  INITIAL_LEDGER_EVENTS,
  INITIAL_PAYPAL_TRANSACTIONS,
} from '../../src/data/mockNexusData';
import { generateCanonicalSha256, computeBlockHash } from '../services/crypto';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

export interface ContractVersion {
  version: number;
  contractId: string;
  timestamp: string;
  contractSha256: string;
  scope: string;
  budgetUsd: number;
  acceptanceCriteriaCount: number;
  modifiedBy: string;
  changeSummary: string;
}

export interface ContractApprovalEvent {
  id: string;
  contractId: string;
  version: number;
  actorId: string;
  role: 'buyer' | 'seller' | 'verifier';
  timestamp: string;
  decision: 'approved' | 'rejected';
  signatureHash: string;
}

export interface DatabaseSchema {
  schemaVersion: number;
  lastUpdated: string;
  agents: Agent[];
  contracts: Contract[];
  contractVersions: ContractVersion[];
  contractApprovals: ContractApprovalEvent[];
  sentinelAlerts: SentinelAlert[];
  proofRecords: ProofVerificationRecord[];
  crashScenarios: CrashScenario[];
  crashTestRuns: CrashTestRun[];
  ledgerEvents: LedgerEvent[];
  paypalTransactions: PayPalTransaction[];
  processedWebhookEvents: ProcessedWebhookEvent[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus_storage.json');
const CONFIG_FILE = path.resolve(process.cwd(), 'firebase-applet-config.json');

class NexusDatabase {
  private data: DatabaseSchema;
  private isFirestoreEnabled = false;
  private firestoreDb: Firestore | null = null;
  private firestoreProjectId = '';
  private firestoreDatabaseId = '';

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadDatabase();
    this.runMigrations();
    this.initFirestore();
  }

  private async initFirestore() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const rawConfig = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(rawConfig);
        if (config.projectId && config.firestoreDatabaseId) {
          const app: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
          this.firestoreDb = getFirestore(app, config.firestoreDatabaseId);
          this.firestoreProjectId = config.projectId;
          this.firestoreDatabaseId = config.firestoreDatabaseId;
          this.isFirestoreEnabled = true;
          console.log(`[NEXUS DB] Cloud Firestore attached: project ${config.projectId}, db ${config.firestoreDatabaseId}`);
          await this.loadFromFirestore();
          await this.syncInitialSeedsToFirestore();
        }
      }
    } catch (err) {
      console.warn('[NEXUS DB] Cloud Firestore initialization deferred:', err);
    }
  }

  public async loadFromFirestore(): Promise<void> {
    if (!this.isFirestoreEnabled || !this.firestoreDb) return;
    try {
      // 1. Contracts
      const contractsSnap = await getDocs(collection(this.firestoreDb, 'contracts'));
      if (!contractsSnap.empty) {
        const firestoreContracts: Contract[] = [];
        contractsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.title) {
            firestoreContracts.push(d as Contract);
          }
        });
        if (firestoreContracts.length > 0) {
          this.data.contracts = firestoreContracts;
        }
      }

      // 2. PayPal Transactions
      const txSnap = await getDocs(collection(this.firestoreDb, 'paypalTransactions'));
      if (!txSnap.empty) {
        const firestoreTx: PayPalTransaction[] = [];
        txSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.orderId) {
            firestoreTx.push(d as PayPalTransaction);
          }
        });
        if (firestoreTx.length > 0) {
          this.data.paypalTransactions = firestoreTx;
        }
      }

      // 3. Sentinel Alerts
      const alertsSnap = await getDocs(collection(this.firestoreDb, 'sentinelAlerts'));
      if (!alertsSnap.empty) {
        const firestoreAlerts: SentinelAlert[] = [];
        alertsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.contractId) {
            firestoreAlerts.push(d as SentinelAlert);
          }
        });
        if (firestoreAlerts.length > 0) {
          this.data.sentinelAlerts = firestoreAlerts;
        }
      }

      // 4. Proof Records
      const proofSnap = await getDocs(collection(this.firestoreDb, 'proofRecords'));
      if (!proofSnap.empty) {
        const firestoreProof: ProofVerificationRecord[] = [];
        proofSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.contractId) {
            firestoreProof.push(d as ProofVerificationRecord);
          }
        });
        if (firestoreProof.length > 0) {
          this.data.proofRecords = firestoreProof;
        }
      }

      // 5. Ledger Events
      const ledgerSnap = await getDocs(collection(this.firestoreDb, 'ledgerEvents'));
      if (!ledgerSnap.empty) {
        const firestoreLedger: LedgerEvent[] = [];
        ledgerSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.blockHash) {
            firestoreLedger.push(d as LedgerEvent);
          }
        });
        if (firestoreLedger.length > 0) {
          this.data.ledgerEvents = firestoreLedger.sort((a, b) => b.blockHeight - a.blockHeight);
        }
      }

      // 6. Processed Webhook Events
      const whSnap = await getDocs(collection(this.firestoreDb, 'processedWebhookEvents'));
      if (!whSnap.empty) {
        const firestoreWh: ProcessedWebhookEvent[] = [];
        whSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.eventId) {
            firestoreWh.push(d as ProcessedWebhookEvent);
          }
        });
        if (firestoreWh.length > 0) {
          this.data.processedWebhookEvents = firestoreWh;
        }
      }

      // 7. Agents
      const agentsSnap = await getDocs(collection(this.firestoreDb, 'agents'));
      if (!agentsSnap.empty) {
        const firestoreAgents: Agent[] = [];
        agentsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.id && d.name) {
            firestoreAgents.push(d as Agent);
          }
        });
        if (firestoreAgents.length > 0) {
          this.data.agents = firestoreAgents;
        }
      }

      this.saveDatabase(this.data);
      console.log(`[NEXUS DB] Hydrated from Cloud Firestore: ${this.data.contracts.length} contracts, ${this.data.paypalTransactions.length} transactions, ${this.data.ledgerEvents.length} ledger blocks, ${this.data.processedWebhookEvents.length} webhook logs.`);
    } catch (err) {
      console.warn('[NEXUS DB] Cloud Firestore hydration notice:', err);
    }
  }

  private async syncInitialSeedsToFirestore() {
    if (!this.isFirestoreEnabled || !this.firestoreDb) return;
    try {
      const contractsSnap = await getDocs(collection(this.firestoreDb, 'contracts'));
      if (contractsSnap.empty) {
        for (const contract of this.data.contracts) {
          await this.syncToFirestore('contracts', contract.id, contract as unknown as Record<string, unknown>);
        }
      }
      const agentsSnap = await getDocs(collection(this.firestoreDb, 'agents'));
      if (agentsSnap.empty) {
        for (const agent of this.data.agents) {
          await this.syncToFirestore('agents', agent.id, agent as unknown as Record<string, unknown>);
        }
      }
      const txSnap = await getDocs(collection(this.firestoreDb, 'paypalTransactions'));
      if (txSnap.empty) {
        for (const tx of this.data.paypalTransactions) {
          await this.syncToFirestore('paypalTransactions', tx.id, tx as unknown as Record<string, unknown>);
        }
      }
      const alertsSnap = await getDocs(collection(this.firestoreDb, 'sentinelAlerts'));
      if (alertsSnap.empty) {
        for (const alert of this.data.sentinelAlerts) {
          await this.syncToFirestore('sentinelAlerts', alert.id, alert as unknown as Record<string, unknown>);
        }
      }
      const proofSnap = await getDocs(collection(this.firestoreDb, 'proofRecords'));
      if (proofSnap.empty) {
        for (const proof of this.data.proofRecords) {
          await this.syncToFirestore('proofRecords', proof.id, proof as unknown as Record<string, unknown>);
        }
      }
      const ledgerSnap = await getDocs(collection(this.firestoreDb, 'ledgerEvents'));
      if (ledgerSnap.empty) {
        for (const event of this.data.ledgerEvents) {
          await this.syncToFirestore('ledgerEvents', event.id, event as unknown as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.warn('[NEXUS DB] Initial seeds sync notice:', err);
    }
  }

  public async syncToFirestore(collectionName: string, docId: string, payload: Record<string, unknown>): Promise<boolean> {
    if (!this.isFirestoreEnabled || !this.firestoreDb) return false;
    try {
      const cleanDocId = docId.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const docRef = doc(this.firestoreDb, collectionName, cleanDocId);
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      // Inject server-side authorization token to pass Firestore security rules
      cleanPayload.serverSignature = 'nexus-server-auth-sig-v1';
      cleanPayload.persistedAt = new Date().toISOString();
      await setDoc(docRef, cleanPayload, { merge: true });
      return true;
    } catch (err) {
      console.warn(`[NEXUS DB] Firestore sync notice for ${collectionName}/${docId}:`, err);
      return false;
    }
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.schemaVersion === 'number') {
          if (!Array.isArray(parsed.processedWebhookEvents)) {
            parsed.processedWebhookEvents = [];
          }
          return parsed;
        }
      } catch (err) {
        console.error('[NEXUS DB] Error loading existing DB file, reinitializing:', err);
      }
    }

    // Initialize with verified demo seeds
    const initialData: DatabaseSchema = {
      schemaVersion: 1,
      lastUpdated: new Date().toISOString(),
      agents: INITIAL_AGENTS,
      contracts: INITIAL_CONTRACTS,
      contractVersions: INITIAL_CONTRACTS.map((c) => ({
        version: 1,
        contractId: c.id,
        timestamp: c.createdAt,
        contractSha256: c.contractSha256 || generateCanonicalSha256(c),
        scope: c.scope,
        budgetUsd: c.budgetUsd,
        acceptanceCriteriaCount: c.acceptanceCriteria.length,
        modifiedBy: c.buyerAgentId,
        changeSummary: 'Initial contract genesis specification',
      })),
      contractApprovals: [
        {
          id: 'APP-01',
          contractId: 'CTR-2026-081',
          version: 1,
          actorId: 'agent-buyer-1',
          role: 'buyer',
          timestamp: '2026-10-26T14:22:00Z',
          decision: 'approved',
          signatureHash: '0x8f2c31e7b920d588a44b1c201',
        },
      ],
      sentinelAlerts: INITIAL_SENTINEL_ALERTS,
      proofRecords: INITIAL_PROOF_RECORDS,
      crashScenarios: CRASH_SCENARIOS,
      crashTestRuns: [
        {
          id: 'CRASH-RUN-001',
          scenarioId: 'SCENARIO-2-DOUBLE-BILL',
          scenarioTitle: 'Duplicate Invoice & Double-Billing Replay Attack',
          timestamp: '2026-10-28T21:40:00Z',
          policy: 'standard',
          intercepted: true,
          interceptedBy: 'PayPal Sentinel',
          riskScore: 94,
          verdict: 'ATTACK_NEUTRALIZED',
          mitigationSteps: [
            'Deliverable SHA-256 checksum matched against historical escrow database',
            'Duplicate transaction replay signature identified',
            'Pre-auth payment authorization blocked at Sentinel Gateway',
            'Zero funds disbursed from buyer escrow',
          ],
          savedAmountUsd: 3500,
          executionTrace: [
            { step: 'Adversary Payload Ingestion', status: 'pass', message: 'Payload received under fake session ID' },
            { step: 'Sentinel Hash Matrix Scan', status: 'flag', message: 'Byte-for-byte SHA256 collision identified with TX-LEGIT-1049' },
            { step: 'PayPal Pre-Auth Risk Gate', status: 'block', message: 'Risk Score 94 exceeds Standard threshold (65). Payment blocked.' },
          ],
        },
      ],
      ledgerEvents: INITIAL_LEDGER_EVENTS,
      paypalTransactions: INITIAL_PAYPAL_TRANSACTIONS,
      processedWebhookEvents: [],
    };

    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(data: DatabaseSchema) {
    this.ensureDataDirectory();
    data.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private runMigrations() {
    // Schema migration check
    if (this.data.schemaVersion < 2) {
      // Recompute real SHA-256 hashes for any legacy mock contracts to guarantee integrity
      for (const contract of this.data.contracts) {
        if (!contract.contractSha256 || contract.contractSha256.length !== 64) {
          contract.contractSha256 = generateCanonicalSha256({
            id: contract.id,
            title: contract.title,
            scope: contract.scope,
            budgetUsd: contract.budgetUsd,
            acceptanceCriteria: contract.acceptanceCriteria,
          });
        }
      }
      this.data.schemaVersion = 2;
      this.saveDatabase(this.data);
      console.log('[NEXUS DB] Migrated database to schema version 2 (Canonical SHA-256 integrity enabled).');
    }
  }

  public getDbType(): 'firestore' | 'postgres' | 'file_persistent' {
    if (this.isFirestoreEnabled) {
      return 'firestore';
    }
    return process.env.DATABASE_URL ? 'postgres' : 'file_persistent';
  }

  public getStoragePath(): string {
    if (this.isFirestoreEnabled && this.firestoreDatabaseId) {
      return `Cloud Firestore [Project: ${this.firestoreProjectId} | DB: ${this.firestoreDatabaseId}]`;
    }
    return DB_FILE;
  }

  // AGENTS
  public getAgents(): Agent[] {
    return this.data.agents
      .filter((a) => a && a.id && a.name && (a.role === 'buyer' || a.role === 'seller' || a.role === 'verifier'))
      .map((a, idx) => ({
        ...a,
        coordinates: (a.coordinates && typeof a.coordinates.x === 'number' && typeof a.coordinates.y === 'number')
          ? a.coordinates
          : {
              x: 180 + (idx % 3) * 260,
              y: 120 + Math.floor(idx / 3) * 140,
            },
        capabilities: Array.isArray(a.capabilities) ? a.capabilities : ['Autonomous Operations', 'Verifiable Output'],
        description: a.description || a.tagline || 'Registered autonomous node on the NEXUS Trust Fabric.',
        tagline: a.tagline || 'Autonomous specialist node',
        modelBackbone: a.modelBackbone || 'Autonomous Architecture',
        trustScore: typeof a.trustScore === 'number' ? a.trustScore : 90,
        trustState: a.trustState || 'verified',
        category: a.category || 'code',
        jobsCompleted: a.jobsCompleted ?? 0,
        disputeRate: a.disputeRate ?? 0,
        hourlyRateUsd: a.hourlyRateUsd ?? 0,
        escrowDepositUsd: a.escrowDepositUsd ?? 0,
        fixedJobMinUsd: a.fixedJobMinUsd ?? 0,
        walletAddress: a.walletAddress || '0x0000000000000000000000000000000000000000',
        paypalMerchantId: a.paypalMerchantId || 'MERCHANT-PENDING',
        recentContracts: Array.isArray(a.recentContracts) ? a.recentContracts : [],
      }));
  }

  public getAgentById(id: string): Agent | undefined {
    const list = this.getAgents();
    return list.find((a) => a.id === id);
  }

  // CONTRACTS
  public getContracts(): Contract[] {
    return this.data.contracts;
  }

  public getContractById(id: string): Contract | undefined {
    return this.data.contracts.find((c) => c.id === id);
  }

  public getContractVersions(contractId: string): ContractVersion[] {
    return this.data.contractVersions.filter((v) => v.contractId === contractId);
  }

  public createContract(
    input: Omit<Contract, 'id' | 'createdAt' | 'contractSha256'>
  ): Contract {
    const nextNum = this.data.contracts.length + 82;
    const contractId = `CTR-2026-${nextNum.toString().padStart(3, '0')}`;
    const createdAt = new Date().toISOString();

    const canonicalHash = generateCanonicalSha256({
      id: contractId,
      title: input.title,
      buyerAgentId: input.buyerAgentId,
      sellerAgentId: input.sellerAgentId,
      verifierAgentId: input.verifierAgentId,
      scope: input.scope,
      deliverables: input.deliverables,
      acceptanceCriteria: input.acceptanceCriteria,
      budgetUsd: input.budgetUsd,
      deadline: input.deadline,
    });

    const newContract: Contract = {
      ...input,
      id: contractId,
      createdAt,
      contractSha256: canonicalHash,
    };

    this.data.contracts.unshift(newContract);

    // Record version 1
    const versionRecord: ContractVersion = {
      version: 1,
      contractId,
      timestamp: createdAt,
      contractSha256: canonicalHash,
      scope: input.scope,
      budgetUsd: input.budgetUsd,
      acceptanceCriteriaCount: input.acceptanceCriteria.length,
      modifiedBy: input.buyerAgentId,
      changeSummary: 'Contract synthesized and registered on Trust Fabric',
    };
    this.data.contractVersions.unshift(versionRecord);

    // Record ledger event
    this.recordLedgerEvent({
      eventType: 'CONTRACT_CREATED',
      contractId,
      actorAgentId: input.buyerAgentId,
      payloadHash: canonicalHash,
      summary: `Contract ${contractId} forged: "${input.title}" ($${input.budgetUsd.toLocaleString()} USD)`,
      metadata: {
        budgetUsd: input.budgetUsd,
        sellerAgentId: input.sellerAgentId,
        acceptanceCriteriaCount: input.acceptanceCriteria.length,
      },
    });

    this.saveDatabase(this.data);
    this.syncToFirestore('contracts', contractId, newContract as unknown as Record<string, unknown>);
    return newContract;
  }

  public updateContractStatus(contractId: string, status: Contract['status']): Contract | null {
    const contract = this.data.contracts.find((c) => c.id === contractId);
    if (!contract) return null;

    contract.status = status;
    if (status === 'completed') {
      contract.completedAt = new Date().toISOString();
    }

    this.saveDatabase(this.data);
    this.syncToFirestore('contracts', contractId, contract as unknown as Record<string, unknown>);
    return contract;
  }

  // SENTINEL ALERTS
  public getSentinelAlerts(): SentinelAlert[] {
    return this.data.sentinelAlerts;
  }

  public getSentinelAlertById(id: string): SentinelAlert | undefined {
    return this.data.sentinelAlerts.find((a) => a.id === id);
  }

  public updateSentinelDecision(
    alertId: string,
    action: 'authorized' | 'rejected' | 'escalated',
    reviewerId: string,
    notes?: string
  ): SentinelAlert | null {
    const alert = this.data.sentinelAlerts.find((a) => a.id === alertId);
    if (!alert) return null;

    alert.decisionStatus = action;
    alert.reviewedBy = reviewerId;
    alert.reviewedAt = new Date().toISOString();
    alert.reviewerNotes = notes || `Analyst decision recorded: ${action.toUpperCase()}`;

    // Update contract status accordingly
    if (action === 'rejected') {
      this.updateContractStatus(alert.contractId, 'disputed');
    } else if (action === 'authorized') {
      this.updateContractStatus(alert.contractId, 'escrow_locked');
    }

    // Ledger record
    this.recordLedgerEvent({
      eventType: 'SENTINEL_SCAN',
      contractId: alert.contractId,
      actorAgentId: reviewerId,
      payloadHash: generateCanonicalSha256({ alertId, action, notes }),
      summary: `PayPal Sentinel decision updated for ${alert.contractId}: ${action.toUpperCase()}`,
      metadata: {
        alertId,
        action,
        reviewerNotes: notes,
      },
    });

    this.saveDatabase(this.data);
    this.syncToFirestore('sentinelAlerts', alert.id, alert as unknown as Record<string, unknown>);
    return alert;
  }

  // PROOF RECORDS
  public getProofRecords(): ProofVerificationRecord[] {
    return this.data.proofRecords;
  }

  public saveProofRecord(record: ProofVerificationRecord) {
    this.data.proofRecords.unshift(record);

    // Ledger record
    this.recordLedgerEvent({
      eventType: 'PROOF_VERIFIED',
      contractId: record.contractId,
      actorAgentId: record.verifierAgentId,
      payloadHash: record.deliverableSha256,
      summary: `ProofEngine completed independent verification for ${record.contractId}: ${record.overallVerdict.toUpperCase()}`,
      metadata: {
        verdict: record.overallVerdict,
        signature: record.verifierSignature,
      },
    });

    this.saveDatabase(this.data);
    this.syncToFirestore('proofRecords', record.id, record as unknown as Record<string, unknown>);
  }

  // CRASH TEST RUNS
  public getCrashScenarios(): CrashScenario[] {
    return this.data.crashScenarios;
  }

  public getCrashTestRuns(): CrashTestRun[] {
    return this.data.crashTestRuns;
  }

  public recordCrashTestRun(run: CrashTestRun) {
    this.data.crashTestRuns.unshift(run);
    this.saveDatabase(this.data);
  }

  public resetCrashTestRuns() {
    this.data.crashTestRuns = [];
    this.saveDatabase(this.data);
  }

  // PAYPAL TRANSACTIONS
  public getPayPalTransactions(): PayPalTransaction[] {
    return this.data.paypalTransactions;
  }

  public getPayPalTransactionByOrderId(orderId: string): PayPalTransaction | undefined {
    return this.data.paypalTransactions.find((t) => t.orderId === orderId);
  }

  public savePayPalTransaction(tx: PayPalTransaction) {
    const existingIndex = this.data.paypalTransactions.findIndex((t) => t.id === tx.id || t.orderId === tx.orderId);
    if (existingIndex >= 0) {
      this.data.paypalTransactions[existingIndex] = tx;
    } else {
      this.data.paypalTransactions.unshift(tx);
    }
    this.saveDatabase(this.data);
    this.syncToFirestore('paypalTransactions', tx.id, tx as unknown as Record<string, unknown>);
  }

  // TRUST LEDGER
  public getLedgerEvents(): LedgerEvent[] {
    return this.data.ledgerEvents;
  }

  public recordLedgerEvent(eventInput: {
    eventType: LedgerEvent['eventType'];
    contractId: string;
    actorAgentId: string;
    payloadHash: string;
    summary: string;
    metadata: Record<string, unknown>;
  }): LedgerEvent {
    const prevBlock = this.data.ledgerEvents[0];
    const blockHeight = prevBlock ? prevBlock.blockHeight + 1 : 91403;
    const prevBlockHash = prevBlock ? prevBlock.blockHash : '0x0000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const blockHash = computeBlockHash(blockHeight, prevBlockHash, eventInput.payloadHash, timestamp);

    const event: LedgerEvent = {
      id: `LEDGER-${Date.now().toString().slice(-6)}`,
      blockHeight,
      timestamp,
      eventType: eventInput.eventType,
      contractId: eventInput.contractId,
      actorAgentId: eventInput.actorAgentId,
      payloadHash: eventInput.payloadHash,
      prevBlockHash,
      blockHash,
      summary: eventInput.summary,
      metadata: eventInput.metadata,
    };

    this.data.ledgerEvents.unshift(event);
    this.saveDatabase(this.data);
    this.syncToFirestore('ledgerEvents', event.id, event as unknown as Record<string, unknown>);
    return event;
  }

  // WEBHOOK IDEMPOTENCY
  public isWebhookEventProcessed(eventId: string): boolean {
    if (!this.data.processedWebhookEvents) {
      this.data.processedWebhookEvents = [];
    }
    return this.data.processedWebhookEvents.some((e) => e.eventId === eventId);
  }

  public recordProcessedWebhookEvent(event: ProcessedWebhookEvent) {
    if (!this.data.processedWebhookEvents) {
      this.data.processedWebhookEvents = [];
    }
    const exists = this.data.processedWebhookEvents.some((e) => e.eventId === event.eventId);
    if (!exists) {
      this.data.processedWebhookEvents.unshift(event);
      this.saveDatabase(this.data);
      this.syncToFirestore('processedWebhookEvents', event.eventId, event as unknown as Record<string, unknown>);
    }
  }

  public getProcessedWebhookEvents(): ProcessedWebhookEvent[] {
    return this.data.processedWebhookEvents || [];
  }
}

export const db = new NexusDatabase();
