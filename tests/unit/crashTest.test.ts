/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { crashTestService } from '../../server/services/crashTestService';

describe('Trust Crash Test Adversarial Simulation', () => {
  beforeEach(() => {
    crashTestService.resetAllRuns();
  });

  it('neutralizes double-billing attack under standard policy via PayPal Sentinel', async () => {
    const run = await crashTestService.executeScenario(
      'SCENARIO-2-DOUBLE-BILL',
      'standard'
    );

    expect(run.intercepted).toBe(true);
    expect(run.interceptedBy).toBe('PayPal Sentinel');
    expect(run.verdict).toBe('ATTACK_NEUTRALIZED');
    expect(run.savedAmountUsd).toBe(3500);
  });

  it('neutralizes empty stub deliverable attack via Proof Engine', async () => {
    const run = await crashTestService.executeScenario(
      'SCENARIO-1-EMPTY-STUB',
      'standard'
    );

    expect(run.intercepted).toBe(true);
    expect(run.interceptedBy).toBe('Proof Engine');
    expect(run.verdict).toBe('ATTACK_NEUTRALIZED');
  });

  it('allows breach under permissive policy on budget overrun exploit', async () => {
    const run = await crashTestService.executeScenario(
      'SCENARIO-4-BUDGET-OVERRUN',
      'permissive'
    );

    expect(run.intercepted).toBe(false);
    expect(run.verdict).toBe('EXPLOIT_SUCCEEDED');
  });

  it('computes accurate non-hardcoded benchmark metrics from run history', async () => {
    // Execute 1 blocked, 1 breached
    await crashTestService.executeScenario('SCENARIO-2-DOUBLE-BILL', 'standard');
    await crashTestService.executeScenario('SCENARIO-4-BUDGET-OVERRUN', 'permissive');

    const metrics = crashTestService.calculateMetrics();

    expect(metrics.totalRuns).toBe(2);
    expect(metrics.truePositives).toBe(1);
    expect(metrics.falseNegatives).toBe(1);
    expect(metrics.detectionRatePercent).toBe(50.0);
    expect(metrics.precisionPercent).toBe(100.0);
  });
});
