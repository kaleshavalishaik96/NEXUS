/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { generateCanonicalSha256, computeBlockHash } from '../../server/services/crypto';

describe('Cryptographic Hashing Service', () => {
  it('generates real 64-character SHA-256 hexadecimal digests', () => {
    const hash = generateCanonicalSha256({ test: 'nexus-integrity' });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('guarantees deterministic canonical output regardless of object key order', () => {
    const objectA = {
      title: 'Contract A',
      budgetUsd: 2500,
      scope: 'Autonomous testing',
    };

    const objectB = {
      scope: 'Autonomous testing',
      title: 'Contract A',
      budgetUsd: 2500,
    };

    const hashA = generateCanonicalSha256(objectA);
    const hashB = generateCanonicalSha256(objectB);

    expect(hashA).toBe(hashB);
  });

  it('changes hash when any nested field changes (avalanche effect)', () => {
    const base = {
      contractId: 'CTR-2026-001',
      budgetUsd: 2000,
    };

    const modified = {
      contractId: 'CTR-2026-001',
      budgetUsd: 2001,
    };

    const hashBase = generateCanonicalSha256(base);
    const hashMod = generateCanonicalSha256(modified);

    expect(hashBase).not.toBe(hashMod);
  });

  it('computes block hashes linking previous blocks', () => {
    const block1 = computeBlockHash(1, '0000000000000000000000000000000000000000', 'hashA', '2026-10-28T12:00:00Z');
    const block2 = computeBlockHash(2, block1, 'hashB', '2026-10-28T12:01:00Z');

    expect(block1).toHaveLength(64);
    expect(block2).toHaveLength(64);
    expect(block1).not.toBe(block2);
  });
});
