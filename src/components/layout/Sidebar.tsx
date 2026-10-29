/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus, NavigationPage } from '../../context/NexusContext';
import {
  Activity,
  Store,
  FileCode2,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Binary,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Lock,
  X,
} from 'lucide-react';

interface SidebarItem {
  id: NavigationPage;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    sentinelAlerts,
    sandboxMode,
    setSandboxMode,
    contracts,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useNexus();

  const [collapsed, setCollapsed] = useState(false);

  const pendingRiskAlerts = sentinelAlerts.filter(
    (a) => a.decisionStatus === 'pending' && (a.severity === 'critical' || a.severity === 'high')
  ).length;

  const activeContractsCount = contracts.filter(
    (c) => c.status === 'in_progress' || c.status === 'proof_verified' || c.status === 'sentinel_flagged'
  ).length;

  const items: SidebarItem[] = [
    {
      id: 'command-center',
      label: 'Command Center',
      sublabel: 'Agent Topology & Feed',
      icon: Activity,
    },
    {
      id: 'marketplace',
      label: 'Agent Market',
      sublabel: 'Verified Specialists',
      icon: Store,
    },
    {
      id: 'contracts',
      label: 'Contract Forge',
      sublabel: 'SLA & Escrow Specs',
      icon: FileCode2,
      badge: activeContractsCount > 0 ? `${activeContractsCount} active` : undefined,
      badgeColor: 'text-slate-400 bg-slate-800/80',
    },
    {
      id: 'sentinel',
      label: 'PayPal Sentinel',
      sublabel: 'Risk Intelligence',
      icon: ShieldAlert,
      badge: pendingRiskAlerts > 0 ? `${pendingRiskAlerts} alerts` : undefined,
      badgeColor: 'text-amber-400 bg-amber-950/80 border border-amber-800/50',
    },
    {
      id: 'proof-engine',
      label: 'Proof Engine',
      sublabel: 'Independent Verifier',
      icon: CheckCircle2,
    },
    {
      id: 'crash-test',
      label: 'Trust Crash Test',
      sublabel: 'Adversarial Attack Lab',
      icon: Flame,
      badge: 'Interactive',
      badgeColor: 'text-rose-400 bg-rose-950/80 border border-rose-800/50',
    },
    {
      id: 'ledger',
      label: 'Trust Ledger',
      sublabel: 'Event Audit Trail',
      icon: Binary,
    },
    {
      id: 'payments',
      label: 'PayPal Sandbox',
      sublabel: 'Escrow & Capture',
      icon: CreditCard,
    },
  ];

  const handleNavClick = (id: NavigationPage) => {
    setActivePage(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-[#090D14] transition-all duration-300 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Workspace identity */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          {(!collapsed || isMobileMenuOpen) && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  Nexus Mainnet Node
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  ID: 0x48a...90e1
                </div>
              </div>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-auto focus-visible:outline-none"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title={collapsed && !isMobileMenuOpen ? item.label : undefined}
              >
                <div
                  className={`p-1.5 rounded-md shrink-0 transition-colors ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {(!collapsed || isMobileMenuOpen) && (
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                    <div className="truncate">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {item.sublabel}
                      </div>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                          item.badgeColor || 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Mode Switch & Security State */}
        <div className="p-3 border-t border-slate-800/60 bg-[#070A0F]">
          {!collapsed || isMobileMenuOpen ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  PayPal Sentinel
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Active</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Sandbox Environment</span>
                <button
                  onClick={() => setSandboxMode(!sandboxMode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    sandboxMode
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {sandboxMode ? 'MOCK ON' : 'OFF'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="PayPal Sentinel Guard Active">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
