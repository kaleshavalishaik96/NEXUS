/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agent } from '../../types/nexus';
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Zap,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const AgentMarketplace: React.FC = () => {
  const {
    agents,
    setActivePage,
    setSelectedAgentId,
    setPrefillContractAgentId,
    addToast,
  } = useNexus();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minTrustScore, setMinTrustScore] = useState<number>(0);
  const [commissioningAgent, setCommissioningAgent] = useState<Agent | null>(null);

  // Commission modal form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBudget, setTaskBudget] = useState(2500);
  const [taskDescription, setTaskDescription] = useState('');

  const categories = [
    { id: 'all', label: 'All Specialties' },
    { id: 'code', label: 'Code & Architecture' },
    { id: 'security', label: 'Security & Audits' },
    { id: 'finance', label: 'Quantitative Finance' },
    { id: 'data', label: 'Data & ETL' },
    { id: 'verification', label: 'Independent Verifiers' },
  ];

  const sellerAndVerifierAgents = agents.filter((a) => a.role === 'seller' || a.role === 'verifier');

  const filteredAgents = sellerAndVerifierAgents.filter((agent) => {
    if (selectedCategory !== 'all' && agent.category !== selectedCategory) return false;
    if ((agent.trustScore ?? 0) < minTrustScore) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = (agent.name || '').toLowerCase().includes(q);
      const descMatch = (agent.description || '').toLowerCase().includes(q);
      const capMatch = (agent.capabilities || []).some((c) => c.toLowerCase().includes(q));
      if (!nameMatch && !descMatch && !capMatch) return false;
    }
    return true;
  });

  const handleStartCommission = (agent: Agent) => {
    setCommissioningAgent(agent);
    setTaskTitle(`Custom Specification for ${agent.name}`);
    setTaskBudget(agent.fixedJobMinUsd || 1500);
    setTaskDescription(`Implement verified deliverables under ${agent.modelBackbone} supervision.`);
  };

  const handleProceedToForge = () => {
    if (!commissioningAgent) return;
    setPrefillContractAgentId(commissioningAgent.id);
    setActivePage('contracts');
    addToast(
      'info',
      'Contract Specification Initialized',
      `Forwarding task parameters to Contract Forge with ${commissioningAgent.name}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Marketplace Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Specialist Agent Marketplace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover verified autonomous agents with cryptographically backed escrow and PayPal Sentinel risk profiling.
          </p>
        </div>

        {/* Demo Data Disclaimer Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Verified Demonstration Registry · PayPal Sandbox Enabled</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agent name, capability, model backbone..."
              className="w-full bg-[#080B10] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Min Trust:</span>
            <select
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value))}
              className="bg-[#080B10] border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value={0}>All Scores (0+)</option>
              <option value={80}>High Trust (80+)</option>
              <option value={95}>Tier-1 Sovereign (95+)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const isFlagged = agent.trustState === 'suspicious';
          const isAudit = agent.trustState === 'under_audit';

          return (
            <div
              key={agent.id}
              className={`p-5 rounded-xl bg-[#0A0E17] border transition-all duration-200 flex flex-col justify-between ${
                isFlagged
                  ? 'border-rose-900/70 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                  : isAudit
                  ? 'border-amber-900/60'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top: Identity & Score */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        agent.role === 'verifier'
                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400">
                        {agent.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500">
                        {agent.handle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-lg font-bold font-mono tabular-nums ${
                        agent.trustScore >= 90
                          ? 'text-emerald-400'
                          : agent.trustScore >= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {agent.trustScore}
                      <span className="text-[10px] text-slate-500 font-normal">/100</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase">
                      Trust Score
                    </div>
                  </div>
                </div>

                {/* Status notice if flagged */}
                {isFlagged && (
                  <div className="mb-3 p-2 rounded bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>PayPal Sentinel alert active (Duplicate invoice flagged)</span>
                  </div>
                )}

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-3">
                  {agent.description || agent.tagline || 'Autonomous agent node on NEXUS Trust Fabric.'}
                </p>

                {/* Model architecture */}
                <div className="mb-3 text-[11px] font-mono text-slate-400 flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-500">Core Engine</span>
                  <span className="text-slate-200">{agent.modelBackbone || 'Autonomous Architecture'}</span>
                </div>

                {/* Capabilities Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {(agent.capabilities || []).slice(0, 3).map((cap, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-slate-300 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                  {(agent.capabilities || []).length > 3 && (
                    <span className="text-[10px] text-slate-500 px-1 py-0.5 font-mono">
                      +{(agent.capabilities || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Metrics & Commission CTA */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Fixed Min
                  </div>
                  <div className="text-xs font-mono font-bold text-white">
                    ${(agent.fixedJobMinUsd ?? 0).toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">USD</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setActivePage('command-center');
                    }}
                    className="p-1.5 text-xs text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 hover:bg-slate-800"
                    title="Inspect in Command Topology"
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartCommission(agent)}
                    className="px-3 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span>Commission</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Agent Workflow Modal */}
      {commissioningAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0C101A] border border-slate-700 rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  COMMISSION AGENT WORKFLOW
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Engage {commissioningAgent.name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Backbone: {commissioningAgent.modelBackbone} · Trust Index: {commissioningAgent.trustScore}/100
                </div>
              </div>
              <button
                onClick={() => setCommissioningAgent(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Contract / Job Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Budget (USD — PayPal Sandbox Escrow)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={taskBudget}
                    onChange={(e) => setTaskBudget(Number(e.target.value))}
                    min={commissioningAgent.fixedJobMinUsd}
                    step={100}
                    className="w-full bg-[#080B10] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Minimum fixed rate: ${commissioningAgent.fixedJobMinUsd} USD
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Task Scope & Verification Requirements
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-[#080B10] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Automatic Trust Fabric Protections:
                </div>
                <div>1. PayPal Sentinel will perform pre-authorization duplicate invoice & identity scan.</div>
                <div>2. Escrow will remain locked until Proof Engine independently executes verification tests.</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCommissioningAgent(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToForge}
                className="px-4 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Proceed to Contract Forge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
