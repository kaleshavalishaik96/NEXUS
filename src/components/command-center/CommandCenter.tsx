/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { Agent, AgentRole } from '../../types/nexus';
import {
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
  Filter,
  RefreshCw,
  ExternalLink,
  Bot,
  Zap,
  Lock,
  ChevronRight,
  X,
} from 'lucide-react';

export const CommandCenter: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    selectedAgent,
    contracts,
    sentinelAlerts,
    setActivePage,
    setPrefillContractAgentId,
    ledgerEvents,
  } = useNexus();

  const [roleFilter, setRoleFilter] = useState<'all' | AgentRole>('all');
  const [networkSpeed, setNetworkSpeed] = useState<'normal' | 'fast'>('normal');

  // Filter agents for display in network
  const filteredAgents = agents.filter((a) => {
    if (roleFilter !== 'all' && a.role !== roleFilter) return false;
    return true;
  });

  // Calculate live summary stats
  const totalVolumeUsd = contracts.reduce((acc, c) => acc + c.budgetUsd, 0) + 138500;
  const verifiedCount = contracts.filter((c) => c.status === 'proof_verified' || c.status === 'completed').length + 84;
  const criticalThreats = sentinelAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;

  // Derive network connections
  const connections = [
    { from: 'agent-buyer-1', to: 'agent-seller-1', active: true, label: 'CTR-081 Active' },
    { from: 'agent-seller-1', to: 'agent-verifier-2', active: true, label: 'Proof Sandbox' },
    { from: 'agent-buyer-1', to: 'agent-seller-2', active: true, label: 'CTR-084 Auth' },
    { from: 'agent-buyer-1', to: 'agent-seller-5', active: false, alert: true, label: 'Flagged Anomaly' },
    { from: 'agent-seller-5', to: 'agent-verifier-1', active: false, alert: true, label: 'Sentinel Block' },
    { from: 'agent-buyer-2', to: 'agent-seller-3', active: true, label: 'Escrow Lock' },
    { from: 'agent-verifier-1', to: 'agent-verifier-2', active: true, label: 'Trust Bridge' },
  ];

  // Deterministic safe coordinate lookup with automatic grid fallback
  const getAgentCoords = (agent?: Agent, fallbackIndex = 0): { x: number; y: number } => {
    if (agent?.coordinates && typeof agent.coordinates.x === 'number' && typeof agent.coordinates.y === 'number') {
      return agent.coordinates;
    }
    const col = fallbackIndex % 3;
    const row = Math.floor(fallbackIndex / 3);
    return {
      x: 180 + col * 260,
      y: 120 + row * 140,
    };
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-slate-400">24H TRANSACTION VOLUME</div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            ${totalVolumeUsd.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">USD (Sandbox)</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            100% PayPal Escrow Backed
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-slate-400">ACTIVE NETWORK AGENTS</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {agents.length}{' '}
            <span className="text-xs font-normal text-slate-500">Nodes Connected</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            2 Buyers · 5 Specialists · 2 Verifiers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-slate-400">PROOF ENGINE PASS RATE</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            99.2%{' '}
            <span className="text-xs font-normal text-slate-500">({verifiedCount} proofs)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Independent criteria enforcement
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-slate-400">PAYPAL SENTINEL INTERCEPTIONS</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
            {criticalThreats}{' '}
            <span className="text-xs font-normal text-slate-500">Threats Stopped</span>
          </div>
          <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            $14,300 Escrow Preserved
          </div>
        </div>
      </div>

      {/* Main Command Workspace Split: Network Graph + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Network Topology Canvas (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-4 rounded-xl bg-[#090D15] border border-slate-800 shadow-xl overflow-hidden relative">
            {/* Graph Header & Interactive Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Autonomous Agent Trust Topology
                </h2>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Select any agent node to inspect real telemetry, past contracts, and Sentinel risk index
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({agents.length})
                </button>
                <button
                  onClick={() => setRoleFilter('buyer')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    roleFilter === 'buyer'
                      ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800/60'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  Buyers
                </button>
                <button
                  onClick={() => setRoleFilter('seller')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    roleFilter === 'seller'
                      ? 'bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/60'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  Specialists
                </button>
                <button
                  onClick={() => setRoleFilter('verifier')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    roleFilter === 'verifier'
                      ? 'bg-indigo-950 text-indigo-300 font-medium border border-indigo-800/60'
                      : 'text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  Verifiers
                </button>
              </div>
            </div>

            {/* Interactive SVG Network Graph */}
            <div className="relative w-full h-[460px] bg-[#07090E] rounded-lg border border-slate-800/60 overflow-hidden nexus-grid-bg">
              <svg className="w-full h-full" viewBox="0 0 900 520">
                <defs>
                  {/* Gradients for connections */}
                  <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="grad-alert" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Flowing animated dash pattern */}
                  <filter id="glow-lime" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.6" />
                  </filter>
                  <filter id="glow-alert" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.7" />
                  </filter>
                </defs>

                {/* Draw connection edges between agents */}
                {connections.map((conn, idx) => {
                  const fromAgent = agents.find((a) => a.id === conn.from);
                  const toAgent = agents.find((a) => a.id === conn.to);
                  if (!fromAgent || !toAgent) return null;

                  const isVisible =
                    (roleFilter === 'all' || fromAgent.role === roleFilter || toAgent.role === roleFilter);

                  if (!isVisible) return null;

                  const fromCoords = getAgentCoords(fromAgent, idx);
                  const toCoords = getAgentCoords(toAgent, idx + 1);

                  const midX = (fromCoords.x + toCoords.x) / 2;
                  const midY = (fromCoords.y + toCoords.y) / 2 - 20;

                  return (
                    <g key={`edge-${idx}`} className="transition-opacity duration-300">
                      {/* Base curved path */}
                      <path
                        d={`M ${fromCoords.x} ${fromCoords.y} Q ${midX} ${midY} ${toCoords.x} ${toCoords.y}`}
                        fill="none"
                        stroke={conn.alert ? '#ef4444' : '#10b981'}
                        strokeWidth={conn.alert ? '2.5' : '1.5'}
                        strokeDasharray={conn.alert ? '5,5' : '6,4'}
                        strokeOpacity={conn.alert ? '0.85' : '0.45'}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="100"
                          to="0"
                          dur={conn.alert ? '3s' : '5s'}
                          repeatCount="indefinite"
                        />
                      </path>

                      {/* Moving pulse packet */}
                      <circle r={conn.alert ? '3.5' : '2.5'} fill={conn.alert ? '#ef4444' : '#38bdf8'}>
                        <animateMotion
                          path={`M ${fromCoords.x} ${fromCoords.y} Q ${midX} ${midY} ${toCoords.x} ${toCoords.y}`}
                          dur={conn.alert ? '2.5s' : '4s'}
                          repeatCount="indefinite"
                        />
                      </circle>

                      {/* Edge Label */}
                      <text
                        x={midX}
                        y={midY - 8}
                        fill={conn.alert ? '#fca5a5' : '#94a3b8'}
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="select-none pointer-events-none"
                      >
                        {conn.label}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Agent Nodes */}
                {filteredAgents.map((agent, agentIdx) => {
                  const coords = getAgentCoords(agent, agentIdx);
                  const isSelected = selectedAgentId === agent.id;
                  const isAlert = agent.trustState === 'suspicious';
                  const isAudit = agent.trustState === 'under_audit';

                  // Role colors
                  let ringColor = '#10b981'; // seller
                  let fillColor = '#052e16';
                  let roleLabel = 'SPECIALIST';

                  if (agent.role === 'buyer') {
                    ringColor = '#06b6d4';
                    fillColor = '#083344';
                    roleLabel = 'BUYER';
                  } else if (agent.role === 'verifier') {
                    ringColor = '#818cf8';
                    fillColor = '#1e1b4b';
                    roleLabel = 'VERIFIER';
                  }

                  if (isAlert) {
                    ringColor = '#ef4444';
                    fillColor = '#450a0a';
                  } else if (isAudit) {
                    ringColor = '#f59e0b';
                    fillColor = '#451a03';
                  }

                  return (
                    <g
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="cursor-pointer group"
                      transform={`translate(${coords.x}, ${coords.y})`}
                    >
                      {/* Selection halo */}
                      {isSelected && (
                        <circle
                          r="32"
                          fill="none"
                          stroke={ringColor}
                          strokeWidth="2"
                          strokeDasharray="4,3"
                          opacity="0.8"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0"
                            to="360"
                            dur="15s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Outer pulse circle */}
                      <circle
                        r="24"
                        fill={fillColor}
                        stroke={ringColor}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        className="transition-all duration-200 group-hover:scale-110"
                        filter={isAlert ? 'url(#glow-alert)' : 'url(#glow-lime)'}
                      />

                      {/* Role Icon representation inside circle */}
                      <circle r="14" fill="#090D15" opacity="0.9" />

                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={ringColor}
                        className="font-mono select-none"
                      >
                        {agent.trustScore}
                      </text>

                      {/* Agent Name Tag */}
                      <g transform="translate(0, 36)">
                        <rect
                          x="-60"
                          y="-10"
                          width="120"
                          height="20"
                          rx="4"
                          fill="#0D121D"
                          stroke={isSelected ? ringColor : '#1E293B'}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#F1F5F9"
                          fontSize="9.5"
                          fontWeight="600"
                          className="select-none"
                        >
                          {agent.name.length > 17 ? agent.name.slice(0, 16) + '…' : agent.name}
                        </text>
                      </g>

                      {/* Trust Subtext */}
                      <text
                        x="0"
                        y="56"
                        textAnchor="middle"
                        fill={isAlert ? '#ef4444' : '#64748B'}
                        fontSize="8.5"
                        fontFamily="monospace"
                        className="select-none"
                      >
                        {isAlert ? 'SENTINEL FLAG' : roleLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend overlay */}
              <div className="absolute bottom-3 left-3 bg-[#090D15]/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md text-[11px] space-y-1.5 pointer-events-none">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
                  Network Roles & States
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Buyer
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Specialist
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Verifier / Sentinel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Threat Flag
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Cryptographic Contract Activity Feed */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Recent Trust Fabric Activity
              </h3>
              <button
                onClick={() => setActivePage('ledger')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Inspect Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {ledgerEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded mt-0.5 ${
                        event.eventType === 'SENTINEL_SCAN'
                          ? 'bg-amber-950 text-amber-400'
                          : event.eventType === 'PROOF_VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-cyan-950 text-cyan-400'
                      }`}
                    >
                      {event.eventType === 'SENTINEL_SCAN' ? (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      ) : event.eventType === 'PROOF_VERIFIED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{event.summary}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Hash: {event.payloadHash.slice(0, 20)}… · Block #{event.blockHeight}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Agent Inspector Panel (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedAgent ? (
            <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 shadow-xl space-y-4">
              {/* Agent Title & Identity */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    {(selectedAgent.role || 'agent').toUpperCase()} AGENT NODE
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedAgent.name || 'Autonomous Agent'}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    {selectedAgent.handle || `@${selectedAgent.id}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400">Trust Index</div>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      (selectedAgent.trustScore ?? 0) >= 90
                        ? 'text-emerald-400'
                        : (selectedAgent.trustScore ?? 0) >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {selectedAgent.trustScore ?? 0}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Tagline & Model */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                <div className="text-xs text-slate-300 leading-relaxed">
                  {selectedAgent.description || selectedAgent.tagline || 'Autonomous agent node on NEXUS Trust Fabric.'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span>Architecture</span>
                  <span className="text-slate-300">{selectedAgent.modelBackbone || 'Autonomous Architecture'}</span>
                </div>
              </div>

              {/* Real Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                  <div className="text-[10px] font-mono text-slate-500">SETTLED JOBS</div>
                  <div className="font-mono font-semibold text-white mt-0.5">
                    {selectedAgent.jobsCompleted ?? 0}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                  <div className="text-[10px] font-mono text-slate-500">DISPUTE RATE</div>
                  <div
                    className={`font-mono font-semibold mt-0.5 ${
                      (selectedAgent.disputeRate ?? 0) > 5 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedAgent.disputeRate ?? 0}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                  <div className="text-[10px] font-mono text-slate-500">HOURLY RATE</div>
                  <div className="font-mono font-semibold text-white mt-0.5">
                    ${selectedAgent.hourlyRateUsd ?? 0} <span className="text-[10px] text-slate-500">USD</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                  <div className="text-[10px] font-mono text-slate-500">ESCROW BOND</div>
                  <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                    ${(selectedAgent.escrowDepositUsd ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Verified Capabilities */}
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5 font-semibold">
                  Verified Invariant Capabilities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedAgent.capabilities && selectedAgent.capabilities.length > 0
                    ? selectedAgent.capabilities
                    : ['Autonomous Operations', 'Verifiable Output']
                  ).map((cap, i) => (
                    <span
                      key={i}
                      className="text-[11px] text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cryptographic identity references */}
              <div className="space-y-1 text-[11px] font-mono text-slate-500 bg-slate-950 p-2.5 rounded border border-slate-800/60">
                <div className="truncate">
                  Wallet: <span className="text-slate-300">{selectedAgent.walletAddress || '0x—'}</span>
                </div>
                <div className="truncate">
                  Merchant ID: <span className="text-slate-300">{selectedAgent.paypalMerchantId || 'PENDING'}</span>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-2">
                {selectedAgent.role === 'seller' && (
                  <button
                    onClick={() => {
                      setPrefillContractAgentId(selectedAgent.id);
                      setActivePage('contracts');
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <span>Commission {selectedAgent.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setActivePage('sentinel')}
                  className="w-full py-2 px-3 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect PayPal Sentinel Telemetry</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
              Select an agent from the network graph to inspect live telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
