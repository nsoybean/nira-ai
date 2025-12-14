import { DeepPartial, UIMessage } from "ai";
import {
	SlidesOutlineArtifact,
	SlidesOutlineArtifactOutput,
} from "./llmTools/createSlidesOutline";
import {
	MarkdownArtifact,
	MarkdownArtifactOutput,
} from "./llmTools/createMarkdownFile";

// Define your custom message type with data part schemas
export type MyUIMessage = UIMessage<
	// metadata type
	never,
	// UI data type
	{
		// title streaming
		title: {
			value: string;
		};
		slidesOutline: {
			status: "starting" | "in_progress" | "completed" | "error";
			content: DeepPartial<SlidesOutlineArtifact> | undefined;
			error?: string;
			message?: string;
		};
		markdown: {
			status: "starting" | "in_progress" | "completed" | "error";
			content: DeepPartial<MarkdownArtifact> | undefined;
			error?: string;
			message?: string;
		};
	},
	// UI tools
	{
		webSearch: {
			input: { query: string };
			output: { results: { url: string; title: string }[] };
		};
		webExtract: {
			input: { query: string };
			output: { results: { url: string }[]; failedResults: { url: string }[] };
		};
		image_generation: {
			input: {};
			output: { result: string };
		};
		createSlidesOutline: {
			input: string;
			output: SlidesOutlineArtifactOutput;
		};
		createMarkdownFile: {
			input: string;
			output: MarkdownArtifactOutput;
		};
	}
>;
