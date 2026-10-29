/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNexus } from '../../context/NexusContext';
import { CrashScenario, CrashTestRun } from '../../types/nexus';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Play,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Activity,
  ArrowRight,
  RefreshCw,
  Download,
  Info,
} from 'lucide-react';

export const TrustCrashTest: React.FC = () => {
  const {
    crashScenarios,
    crashTestRuns,
    crashMetrics,
    runCrashScenario,
    resetCrashTestRuns,
    addToast,
  } = useNexus();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    crashScenarios[0]?.id || ''
  );
  const [selectedPolicy, setSelectedPolicy] = useState<'permissive' | 'standard' | 'zero_trust'>('standard');
  const [isRunning, setIsRunning] = useState(false);
  const [activeRun, setActiveRun] = useState<CrashTestRun | null>(
    crashTestRuns[0] || null
  );

  const currentScenario =
    crashScenarios.find((s) => s.id === selectedScenarioId) || crashScenarios[0];

  // Dynamic calculated metrics from actual test history
  const totalRuns = crashMetrics?.totalRuns || crashTestRuns.length;
  const interceptedRuns = crashMetrics?.truePositives || crashTestRuns.filter((r) => r.intercepted).length;
  const breaches = crashMetrics?.falseNegatives || totalRuns - interceptedRuns;
  const totalSavedUsd = crashMetrics?.totalLossPreventedUsd || crashTestRuns.reduce((sum, r) => sum + r.savedAmountUsd, 0);
  const detectionRate = crashMetrics?.detectionRatePercent !== undefined ? crashMetrics.detectionRatePercent.toFixed(1) : totalRuns > 0 ? ((interceptedRuns / totalRuns) * 100).toFixed(1) : '100.0';
  const precision = crashMetrics?.precisionPercent !== undefined ? crashMetrics.precisionPercent.toFixed(1) : '100.0';

  const handleExecuteSimulation = async () => {
    setIsRunning(true);
    try {
      const result = await runCrashScenario(selectedScenarioId, selectedPolicy);
      setActiveRun(result);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      title: 'NEXUS Trust Crash Test — Adversarial Benchmark Report',
      exportedAt: new Date().toISOString(),
      activePolicy: selectedPolicy,
      benchmarkMetrics: {
        totalEvaluatedRuns: totalRuns,
        truePositivesIntercepted: interceptedRuns,
        falseNegativesBreached: breaches,
        detectionRatePercent: `${detectionRate}%`,
        precisionPercent: `${precision}%`,
        totalCapitalProtectedUsd: totalSavedUsd,
      },
      metricDefinitions: {
        detectionRate: 'Recall (TP / (TP + FN)) across known synthetic attack scenarios.',
        precision: 'Accuracy of threat categorization (TP / (TP + FP)).',
        testIsolation: 'All scenarios executed in isolated simulation test chamber with zero live payment impact.',
      },
      recentRuns: crashTestRuns.map((r) => ({
        id: r.id,
        scenario: r.scenarioTitle,
        timestamp: r.timestamp,
        policy: r.policy,
        verdict: r.verdict,
        interceptedBy: r.interceptedBy,
        riskScore: r.riskScore,
        savedAmountUsd: r.savedAmountUsd,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-crash-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('success', 'Report Exported', 'Crash Test benchmark telemetry exported to JSON.');
  };

  return (
    <div className="space-y-6">
      {/* Title & Lab Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            Trust Crash Test — Adversarial Attack Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate malicious agent attacks against NEXUS defenses. Evaluate how PayPal Sentinel and the Proof Engine intercept exploits under varying security policies.
          </p>
        </div>

        {/* Real Dynamic Calculated Benchmark Badge & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetCrashTestRuns}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset test history"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Detection:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {detectionRate}%
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Runs:</span>
            <span className="text-white font-bold tabular-nums">{totalRuns}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            ATTACKS NEUTRALIZED (TP)
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {interceptedRuns} / {totalRuns}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Precision: {precision}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            BREACHES ALLOWED (FN)
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1 tabular-nums ${
              breaches > 0 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {breaches}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Permissive policy gaps
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            CAPITAL PRESERVED FROM FRAUD
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            ${totalSavedUsd.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            PayPal Sandbox protected
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">
            ACTIVE DEFENSE POLICY
          </div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-1 uppercase">
            {selectedPolicy}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Multi-layer Sentinel & Proof Gates
          </div>
        </div>
      </div>

      {/* Main Interactive Testing Chamber: Scenario Selection (Left 5) vs Live Attack Telemetry (Right 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attack Vector Scenarios & Policy Config */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-[#0A0E17] border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              1. Select Adversarial Scenario
            </h2>

            <div className="space-y-2">
              {crashScenarios.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#121827] border-rose-500/70 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-white">
                        {scenario.title}
                      </span>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold shrink-0">
                        ${scenario.expectedLossUsd.toLocaleString()} risk
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {scenario.description}
                    </p>

                    <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                      <span>Adversary: {scenario.adversaryAgentName}</span>
                      <span className="text-slate-400">{scenario.attackVector}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Defense Policy Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-200 uppercase font-mono block">
                2. Configure Defense Policy Under Test
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedPolicy('permissive')}
                  className={`p-2.5 rounded-lg text-left border text-xs transition-colors ${
                    selectedPolicy === 'permissive'
                      ? 'bg-rose-950/40 border-rose-700 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold">Permissive</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">High risk tolerance</div>
                </button>

                <button
                  onClick={() => setSelectedPolicy('standard')}
                  className={`p-2.5 rounded-lg text-left border text-xs transition-colors ${
                    selectedPolicy === 'standard'
                      ? 'bg-cyan-950/40 border-cyan-700 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold">Standard</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Balanced Sentinel</div>
                </button>

                <button
                  onClick={() => setSelectedPolicy('zero_trust')}
                  className={`p-2.5 rounded-lg text-left border text-xs transition-colors ${
                    selectedPolicy === 'zero_trust'
                      ? 'bg-emerald-950/40 border-emerald-700 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold">Zero-Trust</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Maximum scrutiny</div>
                </button>
              </div>
            </div>

            {/* Launch Test Button */}
            <button
              onClick={handleExecuteSimulation}
              disabled={isRunning}
              className="w-full py-3 px-4 text-xs font-semibold text-black bg-rose-400 hover:bg-rose-300 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-98"
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-black" />
                  <span>Simulating Adversarial Attack Ingestion...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>Execute Crash Test Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Telemetry, Execution Trace & Outcome */}
        <div className="lg:col-span-7 space-y-4">
          {activeRun ? (
            <div className="p-5 rounded-xl bg-[#090D15] border border-slate-800 shadow-xl space-y-5">
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    TEST SIMULATION RESULT #{activeRun.id}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {activeRun.scenarioTitle}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    Test Outcome
                  </div>
                  <div className="mt-1">
                    {activeRun.verdict === 'ATTACK_NEUTRALIZED' ? (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ATTACK NEUTRALIZED
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2.5 py-1 rounded flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        SECURITY EXPLOITED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Intercepting Layer & Saved Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">INTERCEPTED BY</div>
                  <div className="font-semibold text-white mt-1">
                    {activeRun.interceptedBy}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">SENTINEL RISK SCORE</div>
                  <div className="font-mono font-bold text-amber-400 mt-1 tabular-nums">
                    {activeRun.riskScore} / 100
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">CAPITAL PROTECTED</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                    ${activeRun.savedAmountUsd.toLocaleString()} USD
                  </div>
                </div>
              </div>

              {/* Execution Trace Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase font-mono mb-2.5">
                  Execution Pipeline Trace
                </h4>
                <div className="space-y-2">
                  {activeRun.executionTrace.map((traceStep, idx) => {
                    const isBlock = traceStep.status === 'block';
                    const isFlag = traceStep.status === 'flag';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                          isBlock
                            ? 'bg-rose-950/20 border-rose-900/60 text-slate-200'
                            : isFlag
                            ? 'bg-amber-950/20 border-amber-900/50 text-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isBlock ? (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          ) : isFlag ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="font-semibold text-white">{traceStep.step}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {traceStep.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mitigation Insights */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-300 font-mono text-[11px] uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Mitigation Log & Recommendations
                </div>
                {activeRun.mitigationSteps.map((step, idx) => (
                  <div key={idx} className="text-slate-400 text-[11px] font-mono">
                    • {step}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-slate-500 text-xs">
              Select an adversarial scenario and click "Execute Crash Test Simulation" to watch defenses respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
