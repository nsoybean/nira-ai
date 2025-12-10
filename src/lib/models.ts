/**
 * Model Configuration
 * Defines available AI models and their providers
 */

export type ModelProvider = "openai" | "anthropic" | 'google';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  inputCostPerM: number; // USD per million tokens
  outputCostPerM: number; // USD per million tokens
  context: number // context length in tokens
}

export const AVAILABLE_MODELS = [
  // Anthropic Models
  {
    id: "claude-haiku-4-5",
    name: "Claude 4.5 Haiku",
    provider: "anthropic",
    description: "Fastest model, great for simple tasks",
    inputCostPerM: 1,
    outputCostPerM: 5,
    context: 200000,
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude 4.5 Sonnet",
    provider: "anthropic",
    description: "Latest and most intelligent model",
    inputCostPerM: 3,
    outputCostPerM: 15,
    context: 200000,
  },
  {
    id: "claude-opus-4.5",
    name: "Claude 4.5 Opus",
    provider: "anthropic",
    description: "",
    inputCostPerM: 5,
    outputCostPerM: 25,
    context: 200000,
  },

  // OpenAI Models
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    description:
      "The fastest, cheapest version of GPT-5—great for summarization and classification tasks",
    inputCostPerM: 0.05,
    outputCostPerM: 0.4,
    context: 400000,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    description: "A faster, cheaper version of GPT-5 for well-defined tasks",
    inputCostPerM: 0.25,
    outputCostPerM: 2,
    context: 400000,
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    description: "Best model for coding and agentic tasks across industries",
    inputCostPerM: 1.25,
    outputCostPerM: 10,
    context: 400000,
  },
  // google
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "",
    inputCostPerM: 0.10,
    outputCostPerM: 0.40,
    context: 1049000,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "",
    inputCostPerM: 0.30,
    outputCostPerM: 2.5,
    context: 1000000,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "",
    inputCostPerM: 1.25,
    outputCostPerM: 10,
    context: 1049000,
  },
] satisfies ModelConfig[];

export const DEFAULT_MODEL_ID: (typeof AVAILABLE_MODELS)[0]["id"] =
  "claude-haiku-4-5";

/**
 * Get model configuration by ID
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelById(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000000) * model.inputCostPerM;
  const outputCost = (outputTokens / 1000000) * model.outputCostPerM;
  return inputCost + outputCost;
}
