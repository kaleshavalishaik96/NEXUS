/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNexus, NavigationPage } from '../../context/NexusContext';
import {
  Search,
  X,
  Activity,
  Store,
  FileCode2,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Binary,
  CreditCard,
  Bot,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActivePage,
    setSelectedAgentId,
    agents,
    contracts,
    sentinelAlerts,
  } = useNexus();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.capabilities.some((c) => c.toLowerCase().includes(query.toLowerCase())) ||
      a.tagline.toLowerCase().includes(query.toLowerCase())
  );

  const filteredContracts = contracts.filter(
    (c) =>
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAlerts = sentinelAlerts.filter(
    (a) =>
      a.id.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase())
  );

  const quickPages: { id: NavigationPage; label: string; icon: React.ElementType }[] = [
    { id: 'command-center', label: 'Command Center (Topology & Feed)', icon: Activity },
    { id: 'marketplace', label: 'Agent Marketplace (Specialists)', icon: Store },
    { id: 'contracts', label: 'Contract Forge (Create Job)', icon: FileCode2 },
    { id: 'sentinel', label: 'PayPal Sentinel (Risk Intelligence)', icon: ShieldAlert },
    { id: 'proof-engine', label: 'Proof Engine (Acceptance Checks)', icon: CheckCircle2 },
    { id: 'crash-test', label: 'Trust Crash Test (Adversarial Lab)', icon: Flame },
    { id: 'ledger', label: 'Trust Ledger (Cryptographic Audit)', icon: Binary },
    { id: 'payments', label: 'PayPal Sandbox (Escrow Management)', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents, contracts, Sentinel alerts, or actions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Pages */}
          {!query && (
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 px-2 mb-1.5 tracking-wider">
                System Workspaces
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {quickPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        setActivePage(page.id);
                        setIsCommandPaletteOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{page.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agents */}
          {filteredAgents.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 px-2 mb-1.5 tracking-wider">
                Agents ({filteredAgents.length})
              </div>
              <div className="space-y-1">
                {filteredAgents.slice(0, 4).map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setActivePage('command-center');
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-800/70 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-200 group-hover:text-emerald-400">
                          {agent.name}
                        </span>
                        <span className="text-slate-500 ml-2 font-mono text-[11px]">
                          {agent.handle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      Trust: {agent.trustScore}/100
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contracts */}
          {filteredContracts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 px-2 mb-1.5 tracking-wider">
                Contracts ({filteredContracts.length})
              </div>
              <div className="space-y-1">
                {filteredContracts.slice(0, 3).map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() => {
                      setActivePage('contracts');
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-800/70 transition-colors group"
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-slate-400 mr-2">{contract.id}</span>
                      <span className="text-slate-200 group-hover:text-white">
                        {contract.title}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-400 shrink-0">
                      ${contract.budgetUsd.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sentinel Alerts */}
          {filteredAlerts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-500 px-2 mb-1.5 tracking-wider">
                Sentinel Alerts ({filteredAlerts.length})
              </div>
              <div className="space-y-1">
                {filteredAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => {
                      setActivePage('sentinel');
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-800/70 transition-colors text-amber-300"
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-slate-400 mr-2">{alert.id}</span>
                      <span>{alert.summary}</span>
                    </div>
                    <span className="font-mono text-rose-400 shrink-0">
                      Score: {alert.riskScore}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
