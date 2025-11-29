/**
 * Mastra Configuration
 *
 * This file configures the Mastra framework instance for Lume, including:
 * - Agent definitions
 * - Storage adapter (future: PostgreSQL via Prisma)
 * - Memory layers
 * - Model configuration
 *
 * NOTE: Currently using basic configuration without persistent storage.
 * PostgreSQL storage integration will be added once we implement a custom
 * storage adapter that works with our Prisma schema.
 */

import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';

/**
 * Main Mastra instance
 *
 * This instance manages all AI agents and will eventually handle:
 * - Conversation persistence to PostgreSQL
 * - Memory management across conversations
 * - Multi-agent orchestration
 */
export const mastra = new Mastra({
  // Agents configuration
  agents: {
    /**
     * Lume Assistant - Primary chat agent
     *
     * This agent powers the main chat interface with Claude 3.5 Sonnet.
     * It provides intelligent, context-aware responses with access to
     * conversation history through Mastra's memory system.
     */
    lumeAssistant: new Agent({
      name: 'lume-assistant',
      instructions: `You are Lume, an intelligent AI assistant that illuminates complex topics with clarity and insight.

Your role:
- Provide clear, accurate, and helpful responses
- Break down complex topics into understandable parts
- Ask clarifying questions when needed
- Be concise but thorough
- Maintain context across the conversation

Tone:
- Professional yet friendly
- Patient and encouraging
- Honest about limitations
- Thoughtful and insightful`,
      model: anthropic('claude-3-5-sonnet-20241022'),
    }),
  },

  // Logger configuration
  logger: false, // Disable Mastra's internal logging (we'll use Next.js logs)

  // Storage will be added in Phase 2
  // storage: new PrismaStorage({
  //   prismaClient: prisma,
  //   tables: {
  //     threads: 'mastra_threads',
  //     messages: 'mastra_messages',
  //     resources: 'mastra_resources',
  //   },
  // }),
});

/**
 * Get the Lume Assistant agent
 *
 * Convenience function to access the main chat agent.
 * This agent can be used for:
 * - Direct text generation
 * - Streaming responses
 * - Conversation with memory
 *
 * @example
 * ```typescript
 * const agent = getLumeAssistant();
 * const response = await agent.generate('Hello, Lume!');
 * ```
 */
export function getLumeAssistant() {
  return mastra.getAgent('lumeAssistant');
}

/**
 * Helper to generate a new thread ID
 *
 * Uses Mastra's ID generator to create unique thread identifiers.
 * These IDs are used to link conversations across messages.
 */
export function generateThreadId() {
  return mastra.generateId();
}

/**
 * Helper to generate a new resource ID
 *
 * Used for tracking agent resources and working memory.
 */
export function generateResourceId() {
  return mastra.generateId();
}
