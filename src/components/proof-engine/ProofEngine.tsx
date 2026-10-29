/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { ProofVerificationRecord, Contract } from '../../types/nexus';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Terminal,
  ShieldCheck,
  FileCheck2,
  Cpu,
  Info,
  Lock,
} from 'lucide-react';

export const ProofEngine: React.FC = () => {
  const {
    contracts,
    proofRecords,
    runProofVerification,
    agents,
  } = useNexus();

  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[0]?.id || ''
  );
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const selectedContract =
    contracts.find((c) => c.id === selectedContractId) || contracts[0];

  const contractProof = proofRecords.find(
    (p) => p.contractId === selectedContract?.id
  );

  const sellerAgent = agents.find((a) => a.id === selectedContract?.sellerAgentId);
  const buyerAgent = agents.find((a) => a.id === selectedContract?.buyerAgentId);
  const verifierAgent = agents.find((a) => a.id === selectedContract?.verifierAgentId);

  const handleRunAudit = async () => {
    if (!selectedContract) return;
    setIsRunningAudit(true);
    await new Promise((r) => setTimeout(r, 1200));
    await runProofVerification(selectedContract.id);
    setIsRunningAudit(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Architecture Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Independent Proof Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Isolated acceptance criteria verification layer. Checks deliverables against specifications in clean WebAssembly micro-containers independently from the worker agent.
          </p>
        </div>

        {/* Verifier Isolation Disclaimer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
          <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Independent Auditor Node: Verifier-Alpha (Wasm Sandbox)</span>
        </div>
      </div>

      {/* Contract Selector Strip */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Select Contract to Audit:</span>
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="bg-[#080B10] border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.title.slice(0, 38)}… (${c.budgetUsd} USD)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isRunningAudit}
          className="px-4 py-1.5 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        >
          {isRunningAudit ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Sandbox Audit...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Run Verification Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Main Verification Workspace */}
      {selectedContract ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Acceptance Criteria Checklist & Evidence (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    AUDIT TARGET SPECIFICATION
                  </span>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    {selectedContract.title}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Overall Verdict
                  </div>
                  <div className="mt-0.5">
                    {contractProof ? (
                      contractProof.overallVerdict === 'passed' ? (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                          PASSED & ATTESTED
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded">
                          FAILED VERIFICATION
                        </span>
                      )
                    ) : (
                      <span className="text-xs font-mono text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                        AWAITING AUDIT RUN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Criteria Evaluation Rows */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono">
                  Machine-Verifiable Criteria Matrix
                </h3>

                {(contractProof?.criteriaResults || selectedContract.acceptanceCriteria).map(
                  (criterion, idx) => {
                    const isPassed = criterion.status === 'passed';
                    const isFailed = criterion.status === 'failed';

                    return (
                      <div
                        key={criterion.id || idx}
                        className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                          isPassed
                            ? 'bg-slate-950/80 border-emerald-900/40'
                            : isFailed
                            ? 'bg-rose-950/20 border-rose-900/60'
                            : 'bg-slate-950/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {isPassed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : isFailed ? (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-200">
                              {criterion.title}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                              isPassed
                                ? 'bg-emerald-950 text-emerald-400'
                                : isFailed
                                ? 'bg-rose-950 text-rose-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {criterion.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/60">
                          <div>
                            <span className="text-slate-500">Target Spec:</span>{' '}
                            <span className="text-slate-300">{criterion.targetValue}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Sandbox Result:</span>{' '}
                            <span
                              className={isFailed ? 'text-rose-400 font-bold' : 'text-emerald-400'}
                            >
                              {criterion.actualValue || 'Pending verification execution'}
                            </span>
                          </div>
                        </div>

                        {criterion.evidenceLog && (
                          <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-slate-400">
                            {criterion.evidenceLog}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Sandbox Logs & Attestation (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Terminal logs container */}
            <div className="p-5 rounded-xl bg-[#090D15] border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Isolation Sandbox Logs
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Container #wasm-node-9921
                </span>
              </div>

              <div className="p-3 bg-black rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-1.5 text-slate-400 max-h-64 overflow-y-auto">
                {(contractProof?.executionLogs || [
                  '[00:00.01] Idle. Container ready for test bundle.',
                  '[00:00.02] Connects to GitHub / S3 deliverable repo.',
                  '[00:00.05] Ready to execute test matrices.',
                ]).map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes('PASSED') || log.includes('passed')
                        ? 'text-emerald-400'
                        : log.includes('FAIL') || log.includes('failed')
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>

              {/* Cryptographic Attestation Block */}
              {contractProof && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2">
                  <div className="text-slate-400 font-semibold flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Cryptographic Attestation
                  </div>
                  <div>
                    <span className="text-slate-500">Deliverable SHA-256:</span>
                    <div className="text-slate-300 break-all text-[10px]">
                      {contractProof.deliverableSha256}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Verifier Digital Signature:</span>
                    <div className="text-emerald-400 break-all text-[10px]">
                      {contractProof.verifierSignature}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contract Party Metadata */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-300 font-mono text-[11px] uppercase">
                Separation of Responsibilities
              </div>
              <div className="text-slate-400 text-[11px] leading-relaxed">
                <p>
                  <strong>Seller ({sellerAgent?.name})</strong> supplies the deliverable artifact.
                </p>
                <p className="mt-1">
                  <strong>Proof Engine ({verifierAgent?.name})</strong> executes tests in isolated container.
                </p>
                <p className="mt-1">
                  <strong>PayPal Sentinel</strong> authorizes funds release only once Proof Engine returns an attested pass.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs">
          No contracts found. Forge a contract first.
        </div>
      )}
    </div>
  );
};
