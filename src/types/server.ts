/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    type: 'firestore' | 'postgres' | 'file_persistent';
    connected: boolean;
    storagePath?: string;
  };
  paypalSandbox: {
    configured: boolean;
    baseUrl: string;
    clientIdConfigured: boolean;
    webhookIdConfigured?: boolean;
    mode: 'live_sandbox' | 'simulated_fallback';
  };
  aiProvider: {
    configured: boolean;
    provider: 'gemini' | 'deterministic_demo';
  };
}
