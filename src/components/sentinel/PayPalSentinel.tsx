/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { SentinelAlert, SentinelSeverity } from '../../types/nexus';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Hash,
  Terminal,
  Activity,
  ArrowRight,
  Lock,
  Layers,
  Info,
} from 'lucide-react';

export const PayPalSentinel: React.FC = () => {
  const {
    sentinelAlerts,
    handleSentinelDecision,
    contracts,
    agents,
  } = useNexus();

  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    sentinelAlerts[0]?.id || ''
  );
  const [filterSeverity, setFilterSeverity] = useState<'all' | SentinelSeverity>('all');
  const [reviewerNoteInput, setReviewerNoteInput] = useState('');

  const selectedAlert =
    sentinelAlerts.find((a) => a.id === selectedAlertId) || sentinelAlerts[0];

  const filteredAlerts = sentinelAlerts.filter((a) => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  const relatedContract = contracts.find((c) => c.id === selectedAlert?.contractId);
  const relatedAgent = agents.find((a) => a.id === selectedAlert?.agentId);

  const getSeverityBadge = (severity: SentinelSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
            CRITICAL RISK
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-950/80 border border-orange-800 text-orange-300">
            HIGH RISK
          </span>
        );
      case 'moderate':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
            MODERATE
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
            NOMINAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sentinel Title & Heuristic Disclosure */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            PayPal Sentinel — Transaction Risk Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Built-in security intelligence layer evaluating agent transaction velocity, duplicate invoice hashes, abnormal spending, and prompt injection vectors.
          </p>
        </div>

        {/* Explicit Disclosure Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 max-w-md">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Demonstration Mode: Emulates PayPal Fraud Protection Advanced telemetry. Simulated scores reflect heuristic behavior, not live PayPal production scores.
          </span>
        </div>
      </div>

      {/* Two-Column Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transaction Risk Alert Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Sentinel Investigation Queue ({filteredAlerts.length})
            </h2>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'critical'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterSeverity('moderate')}
                className={`px-2 py-0.5 rounded ${
                  filterSeverity === 'moderate'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Moderate
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              const isCritical = alert.severity === 'critical';

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#0E1422] border-emerald-500/60 shadow-lg'
                      : 'bg-[#090D15] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {alert.transactionId}
                      </span>
                      {getSeverityBadge(alert.severity)}
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono text-base font-bold tabular-nums ${
                          alert.riskScore >= 80
                            ? 'text-rose-400'
                            : alert.riskScore >= 50
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {alert.riskScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">/100</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-white line-clamp-1 mb-1">
                    {alert.summary}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                    <span>Contract: {alert.contractId}</span>
                    <span
                      className={`uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        alert.decisionStatus === 'authorized'
                          ? 'bg-emerald-950 text-emerald-400'
                          : alert.decisionStatus === 'rejected'
                          ? 'bg-rose-950 text-rose-400'
                          : 'bg-slate-800 text-amber-300'
                      }`}
                    >
                      {alert.decisionStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Risk Inspector & Action Gate (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedAlert ? (
            <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-5">
              {/* Alert Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      ID: {selectedAlert.id}
                    </span>
                    {getSeverityBadge(selectedAlert.severity)}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">
                    {selectedAlert.summary}
                  </h2>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center shrink-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    Calculated Risk
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      selectedAlert.riskScore >= 80
                        ? 'text-rose-400'
                        : selectedAlert.riskScore >= 50
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedAlert.riskScore}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Explainable Risk Factors Breakdown */}
              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-2">
                  Explainable Risk Factors & Scoring Weights
                </h3>
                <div className="space-y-2">
                  {selectedAlert.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {factor.status === 'critical' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : factor.status === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{factor.factor}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          {factor.details}
                        </div>
                      </div>

                      <span
                        className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                          factor.scoreImpact > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {factor.scoreImpact > 0 ? `+${factor.scoreImpact}` : factor.scoreImpact} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Reasoning Statement */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="text-[11px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                  Sentinel Behavioral Synthesis
                </div>
                <p className="leading-relaxed text-slate-300">
                  {selectedAlert.explanation}
                </p>
              </div>

              {/* Raw Intercepted Payload Snippet */}
              <div>
                <div className="text-[11px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Intercepted Transaction Payload (JSON)
                </div>
                <pre className="p-3 rounded-lg bg-black border border-slate-800 text-[11px] font-mono text-emerald-400/90 overflow-x-auto">
                  {selectedAlert.rawPayloadSnippet}
                </pre>
              </div>

              {/* Reviewer Action Gate */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Reviewer Authorization Gate
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Recommended: <strong className="text-amber-400 uppercase">{selectedAlert.recommendedAction}</strong>
                  </span>
                </div>

                {selectedAlert.decisionStatus !== 'pending' ? (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Decision Recorded: {selectedAlert.decisionStatus.toUpperCase()}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      By {selectedAlert.reviewedBy} at{' '}
                      {selectedAlert.reviewedAt && new Date(selectedAlert.reviewedAt).toLocaleString()}
                    </div>
                    {selectedAlert.reviewerNotes && (
                      <div className="text-slate-400 italic text-[11px] mt-1">
                        "{selectedAlert.reviewerNotes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Add compliance notes or rationale..."
                      value={reviewerNoteInput}
                      onChange={(e) => setReviewerNoteInput(e.target.value)}
                      className="w-full bg-[#080B10] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() =>
                          handleSentinelDecision(
                            selectedAlert.id,
                            'rejected',
                            reviewerNoteInput || 'Rejected due to duplicate invoice collision & budget violation.'
                          )
                        }
                        className="py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject & Freeze</span>
                      </button>

                      <button
                        onClick={() =>
                          handleSentinelDecision(
                            selectedAlert.id,
                            'escalated',
                            reviewerNoteInput || 'Escalated to human compliance review council.'
                          )
                        }
                        className="py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Escalate</span>
                      </button>

                      <button
                        onClick={() =>
                          handleSentinelDecision(
                            selectedAlert.id,
                            'authorized',
                            reviewerNoteInput || 'Authorized under reviewer discretion.'
                          )
                        }
                        className="py-2 px-3 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        <span>Authorize</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
              Select an alert to inspect factors and authorize/reject disbursement.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
