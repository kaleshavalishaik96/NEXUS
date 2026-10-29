/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { LedgerEvent } from '../../types/nexus';
import {
  Binary,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Lock,
  ArrowRight,
  Hash,
  Terminal,
  ExternalLink,
  Info,
  Layers,
} from 'lucide-react';

export const TrustLedger: React.FC = () => {
  const { ledgerEvents } = useNexus();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<LedgerEvent | null>(
    ledgerEvents[0] || null
  );

  const eventTypes = [
    { id: 'all', label: 'All Records' },
    { id: 'CONTRACT_CREATED', label: 'Contracts' },
    { id: 'SENTINEL_SCAN', label: 'Sentinel Scans' },
    { id: 'PROOF_VERIFIED', label: 'Proof Audits' },
    { id: 'PAYPAL_AUTH', label: 'PayPal Escrow' },
    { id: 'PAYPAL_CAPTURE', label: 'Disbursements' },
  ];

  const filteredEvents = ledgerEvents.filter((ev) => {
    if (filterType !== 'all' && ev.eventType !== filterType) return false;
    if (
      search &&
      !ev.id.toLowerCase().includes(search.toLowerCase()) &&
      !ev.contractId.toLowerCase().includes(search.toLowerCase()) &&
      !ev.summary.toLowerCase().includes(search.toLowerCase()) &&
      !ev.blockHash.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Tamper-Proof Clarification Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Binary className="w-5 h-5 text-emerald-400" />
            Trust Ledger — Cryptographic Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log recording contract milestones, Sentinel risk scans, Proof Engine attestations, and PayPal Sandbox payment captures.
          </p>
        </div>

        {/* Ledger Integrity Disclosure */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 max-w-md">
          <Info className="w-4 h-4 shrink-0 text-slate-500" />
          <span>
            Cryptographic event log with hash-chaining verification. Note: Distributed ledger immutability is simulated in this environment.
          </span>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by block hash, contract ID, event type..."
              className="w-full bg-[#080B10] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {eventTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterType === t.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Event Timeline (Left 7) vs Block Detail Inspector (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Timeline Table */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>SHOWING {filteredEvents.length} RECORDED BLOCKS</span>
            <span>CHRONOLOGICAL DESC</span>
          </div>

          <div className="space-y-2">
            {filteredEvents.map((ev) => {
              const isSelected = selectedEvent?.id === ev.id;
              const isSentinel = ev.eventType === 'SENTINEL_SCAN';
              const isProof = ev.eventType === 'PROOF_VERIFIED';
              const isPaypal = ev.eventType === 'PAYPAL_AUTH' || ev.eventType === 'PAYPAL_CAPTURE';

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0E1524] border-emerald-500/60 shadow-lg'
                      : 'bg-[#090D15] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        #{ev.blockHeight}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          isSentinel
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : isProof
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            : isPaypal
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ev.eventType}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white mb-2">
                    {ev.summary}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                    <div className="truncate">
                      Contract: <span className="text-slate-300">{ev.contractId}</span>
                    </div>
                    <div className="truncate text-right">
                      Hash: <span className="text-slate-400">{ev.blockHash.slice(0, 14)}…</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Block Cryptographic Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedEvent ? (
            <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  Block Header #{selectedEvent.blockHeight}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedEvent.id}
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">BLOCK HASH (SHA-256)</div>
                  <div className="text-emerald-400 break-all text-[11px] bg-black p-2 rounded border border-slate-800 mt-1">
                    {selectedEvent.blockHash}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">PREVIOUS BLOCK HASH</div>
                  <div className="text-slate-400 break-all text-[11px] bg-black p-2 rounded border border-slate-800 mt-1">
                    {selectedEvent.prevBlockHash}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">PAYLOAD MERKLE HASH</div>
                  <div className="text-cyan-400 break-all text-[11px] bg-black p-2 rounded border border-slate-800 mt-1">
                    {selectedEvent.payloadHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">SIGNING ACTOR</div>
                    <div className="text-white text-[11px] mt-0.5 truncate">
                      {selectedEvent.actorAgentId}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500">TIMESTAMP</div>
                    <div className="text-slate-300 text-[11px] mt-0.5 truncate">
                      {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">
                    RAW METADATA INVARIANTS
                  </div>
                  <pre className="p-3 rounded bg-black border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
              Select a block from the ledger to inspect cryptographic hashes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
