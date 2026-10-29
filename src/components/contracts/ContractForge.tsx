/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNexus } from '../../context/NexusContext';
import { AcceptanceCriterion, Contract } from '../../types/nexus';
import {
  FileCode2,
  CheckCircle2,
  Shield,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Eye,
  Sliders,
  AlertTriangle,
  Send,
  FileCheck,
} from 'lucide-react';

export const ContractForge: React.FC = () => {
  const {
    agents,
    prefillContractAgentId,
    setPrefillContractAgentId,
    createContract,
    createPayPalSandboxOrder,
    setActivePage,
    contracts,
  } = useNexus();

  const buyers = agents.filter((a) => a.role === 'buyer');
  const sellers = agents.filter((a) => a.role === 'seller');
  const verifiers = agents.filter((a) => a.role === 'verifier');

  // Form states
  const [title, setTitle] = useState('Deterministic Rust Parser & Invariant Test Suite');
  const [buyerId, setBuyerId] = useState(buyers[0]?.id || 'agent-buyer-1');
  const [sellerId, setSellerId] = useState(prefillContractAgentId || sellers[0]?.id || 'agent-seller-1');
  const [verifierId, setVerifierId] = useState(verifiers[1]?.id || 'agent-verifier-2');
  const [scope, setScope] = useState(
    'Architect and implement a high-performance parser with deterministic memory guarantees, zero unsafe blocks, and a comprehensive property-based fuzz test harness.'
  );
  const [budgetUsd, setBudgetUsd] = useState(2400);
  const [deadline, setDeadline] = useState('2026-11-15T18:00:00Z');
  const [revisionPolicy, setRevisionPolicy] = useState('Max 2 automated verification iterations within 48h before escrow refund.');
  const [sentinelPolicy, setSentinelPolicy] = useState<'standard' | 'strict' | 'zero_trust'>('strict');

  // Deliverables list
  const [deliverables, setDeliverables] = useState<string[]>([
    'Modular source code repository with strict typing',
    'Automated test suite achieving >= 95% branch coverage',
    'Deterministic build artifact and sha256 checksum manifest',
  ]);
  const [newDeliverable, setNewDeliverable] = useState('');

  // Acceptance criteria
  const [criteria, setCriteria] = useState<AcceptanceCriterion[]>([
    {
      id: 'crit-forge-1',
      title: 'Automated Test Coverage SLA',
      type: 'test_coverage',
      targetValue: '>= 95% branch coverage (cargo test / vitest)',
      status: 'pending',
    },
    {
      id: 'crit-forge-2',
      title: 'Static Security Vulnerability Scan',
      type: 'security',
      targetValue: '0 Critical, 0 High vulnerabilities (Semgrep / Invariants)',
      status: 'pending',
    },
    {
      id: 'crit-forge-3',
      title: 'Deliverable Hash Cryptographic Attestation',
      type: 'deliverable_hash',
      targetValue: 'Deterministic git commit sha256 match',
      status: 'pending',
    },
  ]);

  const [newCritTitle, setNewCritTitle] = useState('');
  const [newCritTarget, setNewCritTarget] = useState('');
  const [newCritType, setNewCritType] = useState<AcceptanceCriterion['type']>('test_coverage');

  // Sync prefill
  useEffect(() => {
    if (prefillContractAgentId) {
      setSellerId(prefillContractAgentId);
    }
  }, [prefillContractAgentId]);

  const selectedSeller = agents.find((a) => a.id === sellerId);
  const selectedBuyer = agents.find((a) => a.id === buyerId);
  const selectedVerifier = agents.find((a) => a.id === verifierId);

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleAddCriterion = () => {
    if (!newCritTitle.trim() || !newCritTarget.trim()) return;
    const crit: AcceptanceCriterion = {
      id: `crit-forge-${Date.now()}`,
      title: newCritTitle.trim(),
      type: newCritType,
      targetValue: newCritTarget.trim(),
      status: 'pending',
    };
    setCriteria([...criteria, crit]);
    setNewCritTitle('');
    setNewCritTarget('');
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgeAndEscrow = async () => {
    setIsSubmitting(true);
    try {
      const forged = await createContract({
        title,
        buyerAgentId: buyerId,
        sellerAgentId: sellerId,
        verifierAgentId: verifierId,
        scope,
        deliverables,
        acceptanceCriteria: criteria,
        budgetUsd,
        currency: 'USD',
        deadline,
        revisionPolicy,
        sentinelRiskScore: 10,
        sentinelPolicy,
        status: 'escrow_locked',
        paypalPaymentStatus: 'escrow_held',
      });

      // Place escrow in PayPal Sandbox
      await createPayPalSandboxOrder(forged.id, budgetUsd);
      setActivePage('payments');
    } catch (err) {
      console.error('Contract forge error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            Contract Forge
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthesize machine-verifiable smart contracts with deterministic criteria, Sentinel risk policies, and automated PayPal Sandbox escrow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">
            {contracts.length} active registered contracts
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout: Form (Left 7) vs Live Preview & Escrow Authorization (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Contract Builder Form */}
        <div className="lg:col-span-7 space-y-5 bg-[#0A0E17] border border-slate-800 rounded-xl p-5 shadow-xl">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800/80">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Contract Parameters & Parties
          </h2>

          {/* Job Title */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Contract Title / Project Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Party Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Buyer Agent
              </label>
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Specialist Seller Agent
              </label>
              <select
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.hourlyRateUsd}/hr)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Independent Verifier Node
              </label>
              <select
                value={verifierId}
                onChange={(e) => setVerifierId(e.target.value)}
                className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {verifiers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Contract Scope & Technical Requirements
            </label>
            <textarea
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-[#080B10] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Deliverables List */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Target Deliverables ({deliverables.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {deliverables.map((del, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
                >
                  <span className="truncate pr-2">
                    {i + 1}. {del}
                  </span>
                  <button
                    onClick={() => handleRemoveDeliverable(i)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add deliverable..."
                className="flex-1 bg-[#080B10] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDeliverable()}
              />
              <button
                onClick={handleAddDeliverable}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Machine-Verifiable Acceptance Criteria */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Machine-Verifiable Acceptance Criteria (Evaluated by Proof Engine)
            </label>

            <div className="space-y-1.5 mb-2">
              {criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{crit.title}</div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                      Target: {crit.targetValue}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCriterion(crit.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Criterion Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded bg-slate-950 border border-slate-800/80">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Criterion Title (e.g. Latency SLA)"
                  value={newCritTitle}
                  onChange={(e) => setNewCritTitle(e.target.value)}
                  className="w-full bg-[#080B10] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Target (e.g. <= 8ms p99)"
                  value={newCritTarget}
                  onChange={(e) => setNewCritTarget(e.target.value)}
                  className="w-full bg-[#080B10] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3 flex gap-1">
                <select
                  value={newCritType}
                  onChange={(e) => setNewCritType(e.target.value as AcceptanceCriterion['type'])}
                  className="flex-1 bg-[#080B10] border border-slate-800 text-[11px] text-slate-300 rounded px-1.5 py-1.5 focus:outline-none"
                >
                  <option value="test_coverage">Test Cov</option>
                  <option value="latency">Latency</option>
                  <option value="security">Security</option>
                  <option value="deliverable_hash">Hash</option>
                  <option value="schema">Schema</option>
                </select>
                <button
                  onClick={handleAddCriterion}
                  className="p-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded border border-emerald-500/40"
                  title="Add criterion"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Budget, Sentinel Policy & Escrow Hold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Contract Budget (USD)
              </label>
              <input
                type="number"
                value={budgetUsd}
                onChange={(e) => setBudgetUsd(Number(e.target.value))}
                min={200}
                step={100}
                className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                PayPal Sentinel Risk Policy
              </label>
              <select
                value={sentinelPolicy}
                onChange={(e) => setSentinelPolicy(e.target.value as 'standard' | 'strict' | 'zero_trust')}
                className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="standard">Standard (Flag score &gt; 65)</option>
                <option value="strict">Strict (Flag score &gt; 40, zero hash diff)</option>
                <option value="zero_trust">Zero-Trust (Manual multi-sig for every release)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Contract Preview & Escrow Authorization */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#090D15] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Deterministic Contract Preview
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                VALID SPEC
              </span>
            </div>

            {/* Formal Contract Summary Sheet */}
            <div className="space-y-3 text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                <span>CONTRACT_REF:</span>
                <span className="text-white font-bold">CTR-2026-PREVIEW</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                <span>BUYER:</span>
                <span className="text-cyan-300">{selectedBuyer?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                <span>SELLER_AGENT:</span>
                <span className="text-emerald-300">{selectedSeller?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                <span>VERIFIER_NODE:</span>
                <span className="text-indigo-300">{selectedVerifier?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                <span>ESCROW_DEPOSIT:</span>
                <span className="text-emerald-400 font-bold">${budgetUsd.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SENTINEL_POLICY:</span>
                <span className="text-amber-400 uppercase">{sentinelPolicy}</span>
              </div>
            </div>

            {/* Legal / AI Governance Disclaimer */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Autonomous Contract Governance Notice:
              </div>
              <p className="leading-relaxed">
                NEXUS contracts execute machine-verifiable acceptance criteria in isolated verification sandboxes. This specification governs technical execution and automated PayPal Sandbox escrow disbursement. It does not replace formal corporate counsel review.
              </p>
            </div>

            {/* Authorize & Lock Escrow Button */}
            <button
              onClick={handleForgeAndEscrow}
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-98"
            >
              {isSubmitting ? (
                <span>Generating Cryptographic Attestation...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Sign & Escrow via PayPal Sandbox (${budgetUsd.toLocaleString()} USD)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
