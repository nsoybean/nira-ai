import { DeepPartial, UIMessage } from "ai";
import {
	SlidesOutlineArtifact,
	SlidesOutlineArtifactOutput,
} from "./llmTools/slidesOutline";

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
			status: "started" | "in_progress" | "completed" | "error";
			content: DeepPartial<SlidesOutlineArtifact> | undefined;
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
			input: SlidesOutlineArtifact;
			output: SlidesOutlineArtifactOutput;
		};
	}
>;
