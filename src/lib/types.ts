import { UIMessage } from "ai";

// Define your custom message type with data part schemas
export type MyUIMessage = UIMessage<
	never, // metadata type
	{
		title: {
			value: string;
		};
	}
>;

// Export slides outline types
export type {
	SlidesOutlineArtifact,
	PresentationOutline,
	Chapter,
	Slide,
	SlideType,
} from "./types/slides-outline";
export {
	isSlidesOutlineArtifact,
	parseSlidesOutlineArtifact,
} from "./types/slides-outline";
