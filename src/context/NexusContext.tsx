/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Agent,
  Contract,
  SentinelAlert,
  ProofVerificationRecord,
  CrashScenario,
  CrashTestRun,
  LedgerEvent,
  PayPalTransaction,
} from '../types/nexus';
import {
  INITIAL_AGENTS,
  INITIAL_CONTRACTS,
  INITIAL_SENTINEL_ALERTS,
  INITIAL_PROOF_RECORDS,
  CRASH_SCENARIOS,
  INITIAL_LEDGER_EVENTS,
  INITIAL_PAYPAL_TRANSACTIONS,
} from '../data/mockNexusData';

export type NavigationPage =
  | 'command-center'
  | 'marketplace'
  | 'contracts'
  | 'sentinel'
  | 'proof-engine'
  | 'crash-test'
  | 'ledger'
  | 'payments';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export interface CrashTestMetrics {
  totalRuns: number;
  sampleSize: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  detectionRatePercent: number;
  precisionPercent: number;
  totalLossPreventedUsd: number;
}

export interface PayPalConfigStatus {
  configured: boolean;
  baseUrl: string;
  clientIdConfigured: boolean;
  mode: 'live_sandbox' | 'simulated_fallback';
  notice: string;
}

interface NexusContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  isLoading: boolean;
  agents: Agent[];
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  selectedAgent: Agent | null;
  contracts: Contract[];
  createContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'contractSha256'>) => Promise<Contract>;
  updateContractStatus: (contractId: string, status: Contract['status']) => Promise<void>;
  sentinelAlerts: SentinelAlert[];
  handleSentinelDecision: (
    alertId: string,
    action: 'authorized' | 'rejected' | 'escalated',
    notes?: string
  ) => Promise<void>;
  proofRecords: ProofVerificationRecord[];
  runProofVerification: (contractId: string, deliverablePayload?: Record<string, unknown>) => Promise<ProofVerificationRecord>;
  crashScenarios: CrashScenario[];
  crashTestRuns: CrashTestRun[];
  crashMetrics: CrashTestMetrics | null;
  runCrashScenario: (
    scenarioId: string,
    policy: 'permissive' | 'standard' | 'zero_trust'
  ) => Promise<CrashTestRun>;
  resetCrashTestRuns: () => Promise<void>;
  ledgerEvents: LedgerEvent[];
  paypalTransactions: PayPalTransaction[];
  paypalStatus: PayPalConfigStatus | null;
  capturePayPalPayment: (orderId: string) => Promise<void>;
  refundPayPalPayment: (orderId: string) => Promise<void>;
  createPayPalSandboxOrder: (contractId: string, amount: number) => Promise<PayPalTransaction>;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  sandboxMode: boolean;
  setSandboxMode: (enabled: boolean) => void;
  prefillContractAgentId: string | null;
  setPrefillContractAgentId: (id: string | null) => void;
  refreshData: () => Promise<void>;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('command-center');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent-seller-1');
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [sentinelAlerts, setSentinelAlerts] = useState<SentinelAlert[]>(INITIAL_SENTINEL_ALERTS);
  const [proofRecords, setProofRecords] = useState<ProofVerificationRecord[]>(INITIAL_PROOF_RECORDS);
  const [crashScenarios, setCrashScenarios] = useState<CrashScenario[]>(CRASH_SCENARIOS);
  const [crashTestRuns, setCrashTestRuns] = useState<CrashTestRun[]>([]);
  const [crashMetrics, setCrashMetrics] = useState<CrashTestMetrics | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>(INITIAL_LEDGER_EVENTS);
  const [paypalTransactions, setPaypalTransactions] = useState<PayPalTransaction[]>(
    INITIAL_PAYPAL_TRANSACTIONS
  );
  const [paypalStatus, setPaypalStatus] = useState<PayPalConfigStatus | null>({
    configured: false,
    baseUrl: 'https://api-m.sandbox.paypal.com',
    clientIdConfigured: false,
    mode: 'simulated_fallback',
    notice: 'Loading PayPal Sandbox integration status...',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sandboxMode, setSandboxMode] = useState(true);
  const [prefillContractAgentId, setPrefillContractAgentId] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync data from backend
  const refreshData = useCallback(async () => {
    try {
      const [
        agentsRes,
        contractsRes,
        alertsRes,
        proofsRes,
        crashRes,
        ledgerRes,
        paypalTxRes,
        paypalStatusRes,
      ] = await Promise.allSettled([
        fetch('/api/agents').then((r) => r.json()),
        fetch('/api/contracts').then((r) => r.json()),
        fetch('/api/sentinel/alerts').then((r) => r.json()),
        fetch('/api/proof-engine/records').then((r) => r.json()),
        fetch('/api/crash-test/runs').then((r) => r.json()),
        fetch('/api/ledger').then((r) => r.json()),
        fetch('/api/paypal/transactions').then((r) => r.json()),
        fetch('/api/paypal/status').then((r) => r.json()),
      ]);

      if (agentsRes.status === 'fulfilled' && agentsRes.value.agents) {
        setAgents(agentsRes.value.agents);
      }
      if (contractsRes.status === 'fulfilled' && contractsRes.value.contracts) {
        setContracts(contractsRes.value.contracts);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.alerts) {
        setSentinelAlerts(alertsRes.value.alerts);
      }
      if (proofsRes.status === 'fulfilled' && proofsRes.value.records) {
        setProofRecords(proofsRes.value.records);
      }
      if (crashRes.status === 'fulfilled') {
        if (crashRes.value.runs) setCrashTestRuns(crashRes.value.runs);
        if (crashRes.value.metrics) setCrashMetrics(crashRes.value.metrics);
      }
      if (ledgerRes.status === 'fulfilled' && ledgerRes.value.events) {
        setLedgerEvents(ledgerRes.value.events);
      }
      if (paypalTxRes.status === 'fulfilled' && paypalTxRes.value.transactions) {
        setPaypalTransactions(paypalTxRes.value.transactions);
      }
      if (paypalStatusRes.status === 'fulfilled') {
        setPaypalStatus(paypalStatusRes.value);
      }
    } catch (err) {
      console.warn('Backend connection warning; using persistent state:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const createContract = async (
    data: Omit<Contract, 'id' | 'createdAt' | 'contractSha256'>
  ): Promise<Contract> => {
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Contract creation failed');
      }

      const newContract: Contract = await res.json();
      setContracts((prev) => [newContract, ...prev]);

      addToast(
        'success',
        'Contract Forged & Registered',
        `${newContract.id} synthesized with canonical SHA-256 fingerprint: ${newContract.contractSha256.substring(0, 16)}…`
      );

      refreshData();
      return newContract;
    } catch (err: unknown) {
      console.error('Contract create API error, falling back locally:', err);
      // Fallback
      const nextNum = contracts.length + 82;
      const contractId = `CTR-2026-${nextNum.toString().padStart(3, '0')}`;
      const fallback: Contract = {
        ...data,
        id: contractId,
        createdAt: new Date().toISOString(),
        contractSha256: '0x' + Array.from({ length: 64 }, () => 'a').join(''),
      };
      setContracts((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const updateContractStatus = async (contractId: string, status: Contract['status']) => {
    try {
      await fetch(`/api/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, status } : c))
      );
    } catch (err) {
      console.error('Update contract status error:', err);
    }
  };

  const handleSentinelDecision = async (
    alertId: string,
    action: 'authorized' | 'rejected' | 'escalated',
    notes?: string
  ) => {
    try {
      const res = await fetch('/api/sentinel/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action,
          reviewerId: 'Compliance-Officer-0x92',
          notes,
        }),
      });

      if (res.ok) {
        const updatedAlert: SentinelAlert = await res.json();
        setSentinelAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? updatedAlert : a))
        );

        if (action === 'rejected') {
          addToast(
            'error',
            'Sentinel Escrow Frozen',
            'Transaction rejected & flagged. Escrow hold maintained pending dispute resolution.'
          );
        } else if (action === 'authorized') {
          addToast(
            'success',
            'Sentinel Risk Overridden',
            'Transaction cleared by compliance analyst.'
          );
        } else {
          addToast(
            'warning',
            'Escalated to Multi-Sig',
            'Transaction escalated to risk council for secondary review.'
          );
        }

        refreshData();
      }
    } catch (err) {
      console.error('Sentinel decision error:', err);
    }
  };

  const runProofVerification = async (
    contractId: string,
    deliverablePayload?: Record<string, unknown>
  ): Promise<ProofVerificationRecord> => {
    try {
      const res = await fetch('/api/proof-engine/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          verifierAgentId: 'agent-verifier-2',
          deliverablePayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Verification failed');
      }

      const record: ProofVerificationRecord = await res.json();
      setProofRecords((prev) => [record, ...prev]);

      if (record.overallVerdict === 'passed') {
        addToast(
          'success',
          'Proof Engine: Invariants Verified',
          `Deliverables for ${contractId} satisfy acceptance criteria. Verifier signature: ${record.verifierSignature.substring(0, 24)}…`
        );
      } else {
        addToast(
          'error',
          'Proof Engine: Verification Failed',
          `Deliverables failed acceptance criteria evaluation.`
        );
      }

      refreshData();
      return record;
    } catch (err: unknown) {
      console.error('Proof verification API error:', err);
      throw err;
    }
  };

  const runCrashScenario = async (
    scenarioId: string,
    policy: 'permissive' | 'standard' | 'zero_trust'
  ): Promise<CrashTestRun> => {
    try {
      const res = await fetch('/api/crash-test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, policy }),
      });

      if (!res.ok) {
        throw new Error('Simulation failed');
      }

      const { run, metrics } = await res.json();
      setCrashTestRuns((prev) => [run, ...prev]);
      setCrashMetrics(metrics);

      if (run.intercepted) {
        addToast(
          'success',
          'Adversarial Attack Neutralized',
          `${run.interceptedBy} intercepted ${run.scenarioTitle} ($${run.savedAmountUsd.toLocaleString()} saved).`
        );
      } else {
        addToast(
          'error',
          'Security Policy Breached',
          `Permissive policy failed to stop ${run.scenarioTitle}!`
        );
      }

      return run;
    } catch (err: unknown) {
      console.error('Crash test execution API error:', err);
      throw err;
    }
  };

  const resetCrashTestRuns = async () => {
    try {
      await fetch('/api/crash-test/reset', { method: 'POST' });
      setCrashTestRuns([]);
      refreshData();
      addToast('info', 'Crash Test Reset', 'Test history and metrics reset.');
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const createPayPalSandboxOrder = async (
    contractId: string,
    amount: number
  ): Promise<PayPalTransaction> => {
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, amountUsd: amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create PayPal Sandbox order');
      }

      const data = await res.json();
      const tx: PayPalTransaction = data.transaction;
      setPaypalTransactions((prev) => [tx, ...prev]);

      addToast(
        'success',
        'PayPal Sandbox Order Created',
        `Order ${tx.orderId} placed into escrow hold ($${amount.toLocaleString()} USD).`
      );

      refreshData();
      return tx;
    } catch (err: unknown) {
      console.error('PayPal create order error:', err);
      throw err;
    }
  };

  const capturePayPalPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment capture failed');
      }

      const data = await res.json();
      setPaypalTransactions((prev) =>
        prev.map((t) => (t.orderId === orderId ? data.transaction : t))
      );

      addToast(
        'success',
        'PayPal Sandbox Payment Captured',
        `$${data.transaction.amountUsd.toLocaleString()} USD captured and disbursed to seller merchant.`
      );

      refreshData();
    } catch (err: unknown) {
      console.error('PayPal capture error:', err);
      addToast(
        'error',
        'Capture Blocked',
        err instanceof Error ? err.message : 'Capture failed'
      );
    }
  };

  const refundPayPalPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/paypal/refund-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Refund failed');
      }

      const data = await res.json();
      setPaypalTransactions((prev) =>
        prev.map((t) => (t.orderId === orderId ? data.transaction : t))
      );

      addToast(
        'warning',
        'Escrow Refunded to Buyer',
        `Payment refunded via PayPal Sandbox.`
      );

      refreshData();
    } catch (err: unknown) {
      console.error('PayPal refund error:', err);
    }
  };

  return (
    <NexusContext.Provider
      value={{
        activePage,
        setActivePage,
        isLoading,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        selectedAgent,
        contracts,
        createContract,
        updateContractStatus,
        sentinelAlerts,
        handleSentinelDecision,
        proofRecords,
        runProofVerification,
        crashScenarios,
        crashTestRuns,
        crashMetrics,
        runCrashScenario,
        resetCrashTestRuns,
        ledgerEvents,
        paypalTransactions,
        paypalStatus,
        capturePayPalPayment,
        refundPayPalPayment,
        createPayPalSandboxOrder,
        toasts,
        addToast,
        removeToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        globalSearch,
        setGlobalSearch,
        sandboxMode,
        setSandboxMode,
        prefillContractAgentId,
        setPrefillContractAgentId,
        refreshData,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};
