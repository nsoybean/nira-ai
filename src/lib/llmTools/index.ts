import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { tavilySearch, tavilyExtract } from "@tavily/ai-sdk";

export const codeExecutionTool = anthropic.tools.codeExecution_20250825();

export const anthropicWebSearchTool = anthropic.tools.webSearch_20250305({
	maxUses: 5,
});

export const openaiWebSearchTool = openai.tools.webSearch({
	externalWebAccess: true,
	searchContextSize: "medium",
});

export const tavilySearchTool = tavilySearch({
	maxResults: 5,
	apiKey: process.env.TAVILY_API_KEY,
});
export const tavilyExtractTool = tavilyExtract({
	apiKey: process.env.TAVILY_API_KEY,
	extractDepth: "basic",
});

// Slides outline tool factory
export { createSlidesOutlineToolFactory } from "./slidesOutline";
