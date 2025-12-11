import { ToolUIPart } from "ai";
import { SlidesOutlineArtifact } from "@/lib/types/slides-outline";

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

export type createSlidesOutlineToolUIPart = ToolUIPart<{
	createSlidesOutline: {
		input: SlidesOutlineArtifact;
		output: {
			artifactId: string;
			type: string;
			version: string;
			content: SlidesOutlineArtifact;
		};
	};
}>;
