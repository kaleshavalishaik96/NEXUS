/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';

/**
 * Recursively sort object keys for deterministic canonical JSON representation.
 */
function canonicalize(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize((obj as Record<string, unknown>)[key]);
  }
  return result;
}

/**
 * Computes a real, deterministic SHA-256 digest from any object or string.
 * This is an integrity fingerprint of the contract content, not an assertion
 * of legal truth or proof of ledger immutability.
 */
export function generateCanonicalSha256(data: unknown): string {
  const canonicalJson = JSON.stringify(canonicalize(data));
  return crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

/**
 * Generates an event / block hash chained from previous block hash.
 */
export function computeBlockHash(
  blockHeight: number,
  prevBlockHash: string,
  payloadHash: string,
  timestamp: string
): string {
  const preimage = `${blockHeight}:${prevBlockHash}:${payloadHash}:${timestamp}`;
  return crypto.createHash('sha256').update(preimage, 'utf8').digest('hex');
}
