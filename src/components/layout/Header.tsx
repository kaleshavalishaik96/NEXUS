/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNexus, NavigationPage } from '../../context/NexusContext';
import { Search, ShieldAlert, Sparkles, Plus, Terminal, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activePage,
    setActivePage,
    setIsCommandPaletteOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    sentinelAlerts,
    sandboxMode,
    setPrefillContractAgentId,
  } = useNexus();

  const pendingAlerts = sentinelAlerts.filter((a) => a.decisionStatus === 'pending');

  const navLinks: { id: NavigationPage; label: string }[] = [
    { id: 'command-center', label: 'Command' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'sentinel', label: 'Sentinel' },
    { id: 'proof-engine', label: 'Proof Engine' },
    { id: 'crash-test', label: 'Crash Lab' },
    { id: 'payments', label: 'PayPal Escrow' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-[#080B10]/95 backdrop-blur-md">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActivePage('command-center')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            N
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            NEXUS
          </span>
        </button>

        <span className="hidden sm:inline-block text-slate-600 text-xs font-mono">/</span>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-400 whitespace-nowrap">
          Trust Fabric
        </span>

        {sandboxMode && (
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded text-center whitespace-nowrap">
            PayPal Sandbox
          </span>
        )}
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        {navLinks.map((link) => {
          const isActive = activePage === link.id;
          const isSentinel = link.id === 'sentinel';
          return (
            <button
              key={link.id}
              onClick={() => setActivePage(link.id)}
              className={`relative py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:text-white ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'hover:text-slate-200'
              }`}
            >
              {link.label}
              {isSentinel && pendingAlerts.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          title="Search anything (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px]">Search agents & contracts</span>
          <kbd className="text-[10px] font-mono bg-slate-800 border border-slate-700 px-1 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => {
            setPrefillContractAgentId(null);
            setActivePage('contracts');
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors shadow-[0_0_12px_rgba(16,185,129,0.25)] whitespace-nowrap shrink-0 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>Forge Contract</span>
        </button>
      </div>
    </header>
  );
};
