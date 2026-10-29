/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { proofEngine } from '../../server/services/proofEngine';

describe('Independent Proof Engine Verification', () => {
  it('passes contracts meeting all test coverage, latency, and invariant thresholds', async () => {
    const record = await proofEngine.verifyContract({
      contractId: 'CTR-2026-081',
      deliverablePayload: {
        testCoveragePercentage: 98.4,
        latencyP99Ms: 3.12,
        staticVulnerabilitiesCount: 0,
        sha256Checksum: '0x7d89f0291e6c9842a845110e0149bb8476483920',
        schemaValid: true,
      },
    });

    expect(record.overallVerdict).toBe('passed');
    expect(record.criteriaResults.every((c) => c.status === 'passed')).toBe(true);
    expect(record.verifierSignature).toMatch(/^SIG_PROOF_/);
    expect(record.deliverableSha256).toHaveLength(64);
  });

  it('fails contracts that breach test coverage thresholds', async () => {
    const record = await proofEngine.verifyContract({
      contractId: 'CTR-2026-081',
      deliverablePayload: {
        testCoveragePercentage: 82.0, // target is >= 95%
        latencyP99Ms: 3.12,
        staticVulnerabilitiesCount: 0,
      },
    });

    expect(record.overallVerdict).toBe('failed');
    const coverageCrit = record.criteriaResults.find((c) => c.type === 'test_coverage');
    expect(coverageCrit?.status).toBe('failed');
  });

  it('detects empty stub attack and marks verification as failed', async () => {
    const record = await proofEngine.verifyContract({
      contractId: 'CTR-2026-081',
      deliverablePayload: {
        hasEmptyStubsOnly: true,
        testCoveragePercentage: 0,
      },
    });

    expect(record.overallVerdict).toBe('failed');
    expect(record.executionLogs.some((l) => l.includes('ANOMALY DETECTED'))).toBe(true);
  });
});
