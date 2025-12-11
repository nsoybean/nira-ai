import { ToolUIPart } from "ai";

export type webSearchToolUIPart = ToolUIPart<{
	webSearch: {
		input: { query: string };
		output: { results: { url: string; title: string }[] };
	};
}>;

export type webExtractToolUIPart = ToolUIPart<{
	webExtract: {
		input: { query: string };
		output: { results: { url: string }[]; failedResults: { url: string }[] };
	};
}>;

export type imageGenerationToolUIPart = ToolUIPart<{
	image_generation: {
		input: {};
		output: { result: string };
	};
}>;
