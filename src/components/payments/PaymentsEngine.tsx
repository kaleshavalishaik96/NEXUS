/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { PayPalTransaction } from '../../types/nexus';
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Terminal,
  Zap,
  Info,
  DollarSign,
  ArrowRight,
  X,
  Code2,
  Settings,
} from 'lucide-react';

export const PaymentsEngine: React.FC = () => {
  const {
    paypalTransactions,
    paypalStatus,
    capturePayPalPayment,
    refundPayPalPayment,
    createPayPalSandboxOrder,
    contracts,
    sandboxMode,
    addToast,
  } = useNexus();

  const [selectedTxId, setSelectedTxId] = useState<string>(
    paypalTransactions[0]?.id || ''
  );
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [selectedContractForCheckout, setSelectedContractForCheckout] = useState(
    contracts[0]?.id || ''
  );
  const [isSimulatingCapture, setIsSimulatingCapture] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'webhook' | 'architecture'>('orders');

  const selectedTx =
    paypalTransactions.find((t) => t.id === selectedTxId) || paypalTransactions[0];

  const totalInEscrow = paypalTransactions
    .filter((t) => t.status === 'ESCROW_HOLD')
    .reduce((sum, t) => sum + t.amountUsd, 0);

  const totalCaptured = paypalTransactions
    .filter((t) => t.status === 'CAPTURED')
    .reduce((sum, t) => sum + t.amountUsd, 0);

  const handleCapture = async (orderId: string) => {
    setIsSimulatingCapture(true);
    await capturePayPalPayment(orderId);
    setIsSimulatingCapture(false);
  };

  const handleRefund = async (orderId: string) => {
    setIsRefunding(true);
    await refundPayPalPayment(orderId);
    setIsRefunding(false);
  };

  const handleOpenCheckoutModal = () => {
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmSandboxCheckout = async () => {
    const contract = contracts.find((c) => c.id === selectedContractForCheckout);
    if (!contract) return;

    try {
      await createPayPalSandboxOrder(contract.id, contract.budgetUsd);
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            PayPal Sandbox Payment & Escrow Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforces policy authorization, pre-auth risk screening, independent proof verification, and verified PayPal Sandbox capture.
          </p>
        </div>

        {/* Integration Status Badge */}
        <div className="flex items-center gap-2">
          {paypalStatus?.configured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Connected to PayPal Sandbox API (Live Test Mode)</span>
            </div>
          ) : (
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 hover:bg-amber-900/40 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Sandbox Not Configured · Developer Test Mode</span>
              <Settings className="w-3 h-3 text-amber-400 ml-1" />
            </button>
          )}
        </div>
      </div>

      {/* Configuration Status Notice when unconfigured */}
      {!paypalStatus?.configured && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Sandbox Credentials Missing:</strong> Configure <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> in <code>.env</code> for live calls to <code>api-m.sandbox.paypal.com</code>.
            </span>
          </div>
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="px-3 py-1 rounded bg-amber-900/50 hover:bg-amber-900 text-[11px] font-semibold text-amber-100 border border-amber-700/60 whitespace-nowrap"
          >
            Setup Guide
          </button>
        </div>
      )}

      {/* Escrow KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            ACTIVE ESCROW BALANCE
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            ${totalInEscrow.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Held conditionally on server
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            SETTLED & DISBURSED
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            ${totalCaptured.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Captured to seller merchant
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            ORDERS RECORDED
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {paypalTransactions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sandbox orders registered
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">
              NEW SANDBOX ORDER
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Authorize Escrow
            </div>
          </div>
          <button
            onClick={handleOpenCheckoutModal}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <span>Authorize</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-cyan-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Orders & Transactions ({paypalTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'webhook'
              ? 'border-cyan-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sandbox Webhook Inspector
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'architecture'
              ? 'border-cyan-400 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Escrow Governance & Limitations
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Transaction List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                PayPal Orders Ledger
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Server-side Idempotency & Reconciliation
              </span>
            </div>

            <div className="space-y-2">
              {paypalTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                const isHeld = tx.status === 'ESCROW_HOLD';
                const isCaptured = tx.status === 'CAPTURED';
                const isFlagged = tx.status === 'HELD_FOR_REVIEW';
                const isRefunded = tx.status === 'REFUNDED';

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#0E1524] border-cyan-500/60 shadow-lg'
                        : 'bg-[#090D15] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          {tx.orderId}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                            tx.isSimulated || tx.orderId.startsWith('PAYPAL-ORD-SIM-')
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {tx.isSimulated || tx.orderId.startsWith('PAYPAL-ORD-SIM-') ? 'SIMULATED' : 'SANDBOX'}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                            isCaptured
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isHeld
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : isFlagged
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        ${tx.amountUsd.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500">USD</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mb-2">
                      Contract: <span className="text-slate-200 font-mono">{tx.contractId}</span> · Payer: {tx.buyerEmail}
                    </div>

                    {/* Micro state gates */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Sentinel Risk:</span>
                        {tx.sentinelRiskPassed ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Cleared
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-slate-500">Proof Verification:</span>
                        {tx.proofVerified ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attested
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Transaction Inspector & Capture Controls */}
          <div className="lg:col-span-5 space-y-4">
            {selectedTx ? (
              <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    {selectedTx.isSimulated || selectedTx.orderId.startsWith('PAYPAL-ORD-SIM-') ? (
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                          SIMULATED OFFLINE TEST
                        </span>
                        <div className="text-sm font-bold text-slate-300 mt-1">
                          {selectedTx.orderId}
                        </div>
                        <div className="text-[10px] text-amber-500/80 mt-0.5">
                          Isolated test record · Not a live PayPal Sandbox order
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          LIVE PAYPAL SANDBOX ORDER
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          {selectedTx.orderId}
                        </div>
                        <div className="text-[10px] text-emerald-400/80 mt-0.5">
                          Registered via PayPal Sandbox REST API v2
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">Amount</div>
                    <div className="text-base font-bold text-emerald-400 tabular-nums">
                      ${selectedTx.amountUsd.toLocaleString()} USD
                    </div>
                  </div>
                </div>

                {/* 5-Step Lifecycle Tracker */}
                <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    5-Step Authorization & Capture Flow:
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>1. Buyer Sandbox Order Created</span>
                      <span>DONE</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>2. Escrow Funds Locked</span>
                      <span>DONE</span>
                    </div>
                    <div
                      className={`flex items-center justify-between ${
                        selectedTx.sentinelRiskPassed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span>3. PayPal Sentinel Pre-Auth Scan</span>
                      <span>{selectedTx.sentinelRiskPassed ? 'PASSED' : 'FLAGGED'}</span>
                    </div>
                    <div
                      className={`flex items-center justify-between ${
                        selectedTx.proofVerified ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      <span>4. Independent Proof Attestation</span>
                      <span>{selectedTx.proofVerified ? 'VERIFIED' : 'PENDING'}</span>
                    </div>
                    <div
                      className={`flex items-center justify-between ${
                        selectedTx.status === 'CAPTURED' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span>5. PayPal Capture Disbursed</span>
                      <span>{selectedTx.status === 'CAPTURED' ? 'SETTLED' : 'LOCKED'}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata sheet */}
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>Execution Mode:</span>
                    <span className={selectedTx.isSimulated || selectedTx.orderId.startsWith('PAYPAL-ORD-SIM-') ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                      {selectedTx.isSimulated || selectedTx.orderId.startsWith('PAYPAL-ORD-SIM-') ? 'Simulated Offline Test' : 'PayPal Sandbox REST API v2'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>Verified Webhook:</span>
                    <span className={selectedTx.webhookReceived ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-semibold'}>
                      {selectedTx.webhookReceived ? 'CONFIRMED RECEIVED' : 'AWAITING VERIFIED WEBHOOK'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>Contract Ref:</span>
                    <span className="text-slate-200">{selectedTx.contractId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>Merchant Recipient:</span>
                    <span className="text-slate-200">{selectedTx.sellerMerchantId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span>Auth Code:</span>
                    <span className="text-cyan-300">{selectedTx.authorizationCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Endpoint Target:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">
                      {paypalStatus?.baseUrl || 'https://api-m.sandbox.paypal.com'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Escrow Management */}
                {selectedTx.status === 'ESCROW_HOLD' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[10px] text-slate-400">
                      {selectedTx.sentinelRiskPassed && selectedTx.proofVerified ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All security & proof conditions satisfied. Ready for capture.
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Proof Engine verification required before capture release.
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleRefund(selectedTx.orderId)}
                        disabled={isRefunding}
                        className="py-2.5 px-3 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isRefunding ? 'Refunding...' : 'Refund Buyer'}</span>
                      </button>

                      <button
                        onClick={() => handleCapture(selectedTx.orderId)}
                        disabled={!selectedTx.sentinelRiskPassed || !selectedTx.proofVerified || isSimulatingCapture}
                        className="py-2.5 px-3 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        <span>{isSimulatingCapture ? 'Capturing...' : 'Capture Payout'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedTx.status === 'CAPTURED' && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Settlement Confirmed. Funds released to seller merchant account via PayPal Sandbox.
                    </span>
                  </div>
                )}

                {selectedTx.status === 'REFUNDED' && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Payment Refunded. Escrow principal has been returned to buyer account.
                    </span>
                  </div>
                )}

                {selectedTx.status === 'HELD_FOR_REVIEW' && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Escrow Frozen by PayPal Sentinel. Review reasons in Sentinel workspace before release.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
                Select an order to inspect escrow authorization details.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'webhook' && (
        <div className="space-y-4">
          {/* Post-Deployment Webhook Status & Setup Card */}
          <div className="p-5 rounded-xl bg-[#0A0E17] border border-cyan-900/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  SERVER-SIDE PAYPAL WEBHOOK DISPATCHER
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  PayPal Webhook Architecture & Idempotent Handler
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300">
                  PAYPAL_WEBHOOK_ID: STANDBY (Post-Deployment Step)
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  IDEMPOTENCY: ACTIVE
                </span>
              </div>
            </div>

            {/* Target Webhook Endpoint URL */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Backend Ingestion Endpoint (POST):</span>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  /api/paypal/webhook
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 bg-black/60 p-2 rounded border border-slate-800 select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/paypal/webhook` : 'https://<your-deployed-domain>/api/paypal/webhook'}
              </div>
              <p className="text-[11px] text-slate-400">
                Incoming notifications are cryptographically verified using PayPal Sandbox's <code className="text-slate-300 font-mono">/v1/notifications/verify-webhook-signature</code> API. During initial local development before deployment, the endpoint acknowledges payloads safely (<code className="text-slate-300 font-mono">200 OK</code>) while honestly reporting <code className="text-amber-400 font-mono">UNVERIFIED</code> to prevent accidental false settlements.
              </p>
            </div>

            {/* Post-Deployment Registration Guide */}
            <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Post-Deployment Registration Walkthrough (5 Steps)
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300">
                <li>
                  <strong className="text-white">Deploy the Backend:</strong> Deploy NEXUS to Google Cloud Run or your hosting platform to obtain your permanent public HTTPS URL.
                </li>
                <li>
                  <strong className="text-white">Open Developer Dashboard:</strong> Log in to <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">developer.paypal.com</a> and open <strong>Dashboard &gt; Apps &amp; Credentials</strong>.
                </li>
                <li>
                  <strong className="text-white">Add Webhook:</strong> Under your Sandbox REST App, click <strong>Add Webhook</strong> and paste your public URL: <code className="font-mono text-cyan-300">&lt;PUBLIC_HTTPS_URL&gt;/api/paypal/webhook</code>.
                </li>
                <li>
                  <strong className="text-white">Subscribe to Core Events:</strong> Select <code className="font-mono text-emerald-300">CHECKOUT.ORDER.APPROVED</code>, <code className="font-mono text-emerald-300">PAYMENT.CAPTURE.COMPLETED</code>, <code className="font-mono text-emerald-300">PAYMENT.CAPTURE.DENIED</code>, and <code className="font-mono text-emerald-300">PAYMENT.CAPTURE.REFUNDED</code>.
                </li>
                <li>
                  <strong className="text-white">Save Webhook ID:</strong> Copy the generated Webhook ID and configure <code className="font-mono text-cyan-300">PAYPAL_WEBHOOK_ID</code> in your Google AI Studio Secrets panel.
                </li>
              </ol>
            </div>
          </div>

          {/* Sample Verified Webhook Event Payload */}
          <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Sample PayPal Sandbox Webhook Event Payload (Idempotent Schema)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                CHECKOUT.ORDER.APPROVED
              </span>
            </div>

            <pre className="p-4 rounded-lg bg-black border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{JSON.stringify(
  {
    id: "WH-9081293810293",
    event_version: "1.0",
    create_time: new Date().toISOString(),
    resource_type: "checkout-order",
    event_type: "CHECKOUT.ORDER.APPROVED",
    summary: "An order has been approved by the buyer in Sandbox",
    resource: {
      id: selectedTx?.orderId || "PAYPAL-ORD-89419201",
      status: "APPROVED",
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: selectedTx?.contractId || "CTR-2026-081",
          amount: {
            currency_code: "USD",
            value: (selectedTx?.amountUsd || 2850).toFixed(2),
          },
        },
      ],
      payer: {
        email_address: selectedTx?.buyerEmail || "procure@alphaprocure.corp",
        payer_id: "SANDBOX-BUYER-PAYER-01",
      },
    },
  },
  null,
  2
)}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="p-6 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-4 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            NEXUS Trust & Escrow Architecture
          </h3>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-200">
              How PayPal Sandbox and NEXUS Escrow Actually Work:
            </div>
            <p>
              Standard PayPal REST APIs provide checkout authorizations, order creation, capture, and refunds. They do not natively offer autonomous multi-agent conditional escrow smart contracts.
            </p>
            <p>
              To solve this, <strong>NEXUS implements an application-level escrow hold:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1 font-mono text-[11px] text-slate-400">
              <li>Buyer creates and authorizes an order in PayPal Sandbox.</li>
              <li>NEXUS records the authorized order and maintains an escrow hold on the backend.</li>
              <li>PayPal Sentinel performs risk intelligence checks (duplicate invoice hashes, budget overruns, collusion).</li>
              <li>The independent Proof Engine verifies deliverables against contract acceptance criteria.</li>
              <li>Only when both checks pass does the backend call the PayPal capture endpoint to disburse funds.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Simulated PayPal Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0C101A] border border-cyan-800/60 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  PAYPAL SANDBOX AUTHORIZATION GATEWAY
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Authorize Escrow Hold
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Select Contract for Escrow</label>
                <select
                  value={selectedContractForCheckout}
                  onChange={(e) => setSelectedContractForCheckout(e.target.value)}
                  className="w-full bg-[#080B10] border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — ${c.budgetUsd.toLocaleString()} USD ({c.title.slice(0, 30)}…)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Payer Account:</span>
                  <span className="text-slate-200">procure@alphaprocure.corp</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Escrow Destination:</span>
                  <span className="text-slate-200">NEXUS PayPal Escrow Vault</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Pre-Auth Scan:</span>
                  <span className="text-emerald-400">PayPal Sentinel Guard Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSandboxCheckout}
                className="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Authorize in Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0C101A] border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  PAYPAL DEVELOPER ONBOARDING
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Configure PayPal Sandbox Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              To connect NEXUS to your real PayPal Sandbox environment:
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-slate-300 font-mono text-[11px]">
              <li>Log in to <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">developer.paypal.com</a>.</li>
              <li>Navigate to <strong>Dashboard &gt; Apps &amp; Credentials</strong>.</li>
              <li>Ensure the toggle is set to <strong>Sandbox</strong>.</li>
              <li>Create or select an App and copy the <strong>Client ID</strong> and <strong>Secret</strong>.</li>
              <li>Open <code>.env</code> in the project root and populate:
                <pre className="mt-1 p-2 bg-black rounded border border-slate-800 text-emerald-400">
PAYPAL_CLIENT_ID="your_client_id"
PAYPAL_CLIENT_SECRET="your_client_secret"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
                </pre>
              </li>
              <li>Restart the dev server: <code>npm run dev</code>.</li>
            </ol>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
              <strong>Note:</strong> When credentials are not configured, NEXUS safely operates in isolated developer test mode, logging simulated state transitions and preventing accidental real transaction attempts.
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
