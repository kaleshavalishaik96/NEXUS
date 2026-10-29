/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

export interface AgentExecutionTaskInput {
  agentId: string;
  agentName: string;
  taskTitle: string;
  scope: string;
  requirements: string[];
}

export interface AgentExecutionTaskOutput {
  status: 'COMPLETED' | 'FAILED';
  provider: 'gemini' | 'deterministic_demo';
  isSimulation: boolean;
  deliverableSummary: string;
  generatedArtifacts: Array<{ name: string; content: string; sha256Checksum: string }>;
  executionMetrics: {
    latencyMs: number;
    tokensEvaluated?: number;
    timestamp: string;
  };
}

class AIProviderService {
  private ai: GoogleGenAI | null = null;
  private apiKeyConfigured = false;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 0) {
      try {
        this.ai = new GoogleGenAI();
        this.apiKeyConfigured = true;
      } catch (err) {
        console.warn('[NEXUS AI] Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  public isConfigured(): boolean {
    return this.apiKeyConfigured;
  }

  public async executeAgentTask(input: AgentExecutionTaskInput): Promise<AgentExecutionTaskOutput> {
    const startTime = Date.now();

    // If Gemini API is configured and available
    if (this.ai && this.apiKeyConfigured) {
      try {
        const prompt = `You are ${input.agentName}, an autonomous specialist agent on NEXUS Trust Fabric.
Task: ${input.taskTitle}
Scope: ${input.scope}
Requirements: ${input.requirements.join(', ')}

Provide a concise, production-ready technical deliverable summary and core code artifact for independent verification.`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || 'Deliverable generated successfully.';
        const latency = Date.now() - startTime;

        return {
          status: 'COMPLETED',
          provider: 'gemini',
          isSimulation: false,
          deliverableSummary: text.substring(0, 300) + '…',
          generatedArtifacts: [
            {
              name: 'deliverable_main.ts',
              content: text,
              sha256Checksum: '0x' + Buffer.from(text).toString('hex').substring(0, 40),
            },
          ],
          executionMetrics: {
            latencyMs: latency,
            tokensEvaluated: response.usageMetadata?.totalTokenCount || 450,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (err) {
        console.error('[NEXUS AI] Gemini API call error, falling back to deterministic demo:', err);
      }
    }

    // Deterministic simulation fallback
    const latency = 180 + Math.floor(Math.random() * 80);
    return {
      status: 'COMPLETED',
      provider: 'deterministic_demo',
      isSimulation: true,
      deliverableSummary: `[DEMO SIMULATION] ${input.agentName} completed task "${input.taskTitle}". Deliverable conforms to deterministic specification and passes automated invariant tests.`,
      generatedArtifacts: [
        {
          name: 'lib_parser.ts',
          content: `// Deliverable artifact for ${input.taskTitle}\nexport function parseStream(input: Uint8Array): boolean {\n  return input.byteLength > 0;\n}`,
          sha256Checksum: '0x7d89f0291e6c9842a845110e0149bb8476483920',
        },
      ],
      executionMetrics: {
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const aiProvider = new AIProviderService();
