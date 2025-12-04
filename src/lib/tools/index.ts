import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const codeExecutionTool = anthropic.tools.codeExecution_20250825();

export const anthropicWebSearchTool = anthropic.tools.webSearch_20250305({
  maxUses: 5,
});

export const openaiWebSearchTool = openai.tools.webSearch({
  externalWebAccess: true,
  searchContextSize: "medium",
});
