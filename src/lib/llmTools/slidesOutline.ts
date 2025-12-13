import {
	createIdGenerator,
	DeepPartial,
	generateId,
	stepCountIs,
	tool,
	UIMessageStreamWriter,
} from "ai";
import { prisma } from "@/lib/prisma";
import { jsonrepair } from "jsonrepair";

/**
 * Slides Outline Artifact Types
 *
 * Defines the structure for AI-generated presentation outlines that will be
 * rendered in the chat UI before actual PowerPoint generation.
 */

import { z } from "zod";
import { MyUIMessage } from "../UIMessage";

/**
 * Zod schema for slide type validation
 */
export const slideTypeSchema = z.enum([
	"text",
	"title",
	"bullets",
	"image",
	"chart",
]);
export type SlideType = z.infer<typeof slideTypeSchema>;

/**
 * Zod schema for individual slide validation
 */
export const slideSchema = z.object({
	/** Sequential slide number within the presentation */
	slideNumber: z.number().int().positive(),
	/** Title/heading of the slide */
	slideTitle: z.string().min(1),
	/** Main content/body of the slide */
	slideContent: z.string().min(1),
	/** Type of slide determining layout and rendering */
	slideType: slideTypeSchema,
});
export type Slide = z.infer<typeof slideSchema>;

/**
 * Zod schema for chapter validation
 */
export const chapterSchema = z.object({
	/** Title of the chapter/section */
	chapterTitle: z.string().min(1),
	/** Array of slides in this chapter */
	slides: z.array(slideSchema).min(1),
});
export type Chapter = z.infer<typeof chapterSchema>;

/**
 * Zod schema for presentation outline metadata
 */
export const presentationOutlineSchema = z.object({
	/** Title of the entire presentation */
	pptTitle: z.string().min(1),
	/** Total number of slides in the presentation */
	slidesCount: z
		.number()
		.int()
		.positive()
		.max(10, { error: "Exceeded max slide count" }),
	/** Optional special requirements or notes for the presentation */
	overallRequirements: z.string().nullable(),
});
export type PresentationOutline = z.infer<typeof presentationOutlineSchema>;

/**
 * Complete slides outline artifact schema
 *
 * This is the root schema that the AI will generate when creating a
 * presentation outline. It will be stored as JSON in the message parts.
 */
export const slidesOutlineArtifactSchema = z.object({
	/** High-level presentation metadata */
	outline: presentationOutlineSchema,
	/** Array of chapters, each containing slides */
	chapters: z
		.array(chapterSchema)
		.min(1)
		.max(10, { error: "Exceeded max chapter count" }),
});
export type SlidesOutlineArtifact = z.infer<typeof slidesOutlineArtifactSchema>;

export const slidesOutlineArtifactOutputSchema = z.object({
	artifactId: z.string(),
	type: z.literal("slidesOutline"),
	version: z.string(),
	error: z.string(),
	systemMessage: z.string(),
	content: slidesOutlineArtifactSchema.optional(),
});
export type SlidesOutlineArtifactOutput = z.infer<
	typeof slidesOutlineArtifactOutputSchema
>;

/**
 * Validates and parses a slides outline artifact from unknown data
 * Uses Zod for validation and returns the parsed result or null
 */
export function parseSlidesOutlineArtifact(
	data: unknown
): SlidesOutlineArtifact | null {
	const result = slidesOutlineArtifactSchema.safeParse(data);
	return result.success ? result.data : null;
}

/**
 * Safely parses incremental/partial slides outline data
 * Validates nested structures individually to extract as much valid data as possible
 * Returns partial data even if full validation fails
 */
export function safeParsePartialOutline(
	data: unknown
): DeepPartial<SlidesOutlineArtifact> {
	if (!data || typeof data !== "object") {
		return {};
	}

	const obj = data as any;
	const result: DeepPartial<SlidesOutlineArtifact> = {};

	// Try to parse outline metadata
	if (obj.outline && typeof obj.outline === "object") {
		const outlineResult = presentationOutlineSchema.safeParse(obj.outline);
		result.outline = outlineResult.success
			? outlineResult.data
			: (obj.outline as any);
	}

	// Try to parse chapters array
	if (Array.isArray(obj.chapters)) {
		result.chapters = obj.chapters
			.map((chapter: any) => {
				// Try to validate each chapter individually
				const chapterResult = chapterSchema.safeParse(chapter);
				if (chapterResult.success) {
					return chapterResult.data;
				}

				// If chapter validation fails, still try to extract what we can
				if (chapter && typeof chapter === "object") {
					const partialChapter: DeepPartial<Chapter> = {};

					if (typeof chapter.chapterTitle === "string") {
						partialChapter.chapterTitle = chapter.chapterTitle;
					}

					// Try to parse slides within the chapter
					if (Array.isArray(chapter.slides)) {
						partialChapter.slides = chapter.slides
							.map((slide: any) => {
								const slideResult = slideSchema.safeParse(slide);
								return slideResult.success ? slideResult.data : slide;
							})
							.filter((slide: any) => slide && typeof slide === "object");
					}

					return partialChapter;
				}

				return chapter;
			})
			.filter((chapter: any) => chapter && typeof chapter === "object");
	}

	return result;
}

/**
 * Creates a presentation outline with streaming input validation.
 *
 * Architecture:
 * - Main agent generates the outline using this tool with inputSchema: slidesOutlineArtifactSchema
 * - Tool execution validates and persists the input from the agent
 * - Uses onInputDelta() to stream the input delta back to client
 * - Streams UI updates (starting → in_progress → completed)
 * - Persists artifact to database
 * - Returns artifact reference for message parts
 */
export const createSlidesOutlineTool = (options: {
	conversationId: string;
	messageId: string;
	userId?: string;
	writer: UIMessageStreamWriter<MyUIMessage>;
}) => {
	const { conversationId, messageId, userId, writer } = options;
	const outlineId = createIdGenerator({
		prefix: "artifact",
		size: 16,
	})();

	// Accumulator for concatenating input deltas
	let accumulatedInput = "";

	return tool({
		description: `Create a presentation outline. Use this when the user requests a PowerPoint/slide deck/create slides.

TERMINOLOGY:
- When users say "pages", "screens", or "slides", they all mean the same thing: presentation slides
- Always interpret slide count requests accordingly (e.g., "5 pages" = 5 slides)

CONSTRAINTS:
- Default to maximum 10 slides for concise presentations
- If user explicitly requests more slides, honor their request (e.g., "make me a 15-page presentation")
- Maximum 10 chapters
- slideNumber must be sequential across ALL chapters (1, 2, 3, 4...)
- slidesCount must match actual number of slides generated

SLIDE TYPES - Choose appropriately:
- "title": Opening slide or chapter dividers (minimal text, just title + subtitle)
- "text": Explanatory content with 2-4 sentences of paragraph text
- "bullets": Lists of items, steps, or key points (3-5 bullet points)
- "image": When visual examples, diagrams, or photos would enhance understanding
- "chart": For data, statistics, comparisons, or trends that need visualization

CHAPTER ORGANIZATION:
- Group related slides into logical sections (3-5 slides per chapter typically)
- Create new chapter when topic/theme shifts
- Chapter titles should be broad themes; slide titles should be specific

CONTENT GUIDELINES:
- Slide titles: Clear, specific, action-oriented (5-8 words)
- Slide content: Concise and scannable
  * "text" slides: 2-4 complete sentences explaining a concept
  * "bullets" slides: 3-5 short bullet points (5-10 words each)
  * "title" slides: Just a subtitle or tagline (1 sentence)
  * "image"/"chart" slides: Brief description of what visual should show

Editable outline will be shown to the user via a UI, hence do not repeat the entire outline back to the user in text form.`,
		inputSchema: slidesOutlineArtifactSchema,
		outputSchema: slidesOutlineArtifactOutputSchema,
		execute: async (input) => {
			try {
				// Validate the input
				const validatedInput = slidesOutlineArtifactSchema.parse(input);

				// Save artifact to database
				const artifact = await prisma.artifact.create({
					data: {
						id: outlineId,
						conversationId,
						messageId,
						userId: userId || null,
						type: "slidesOutline",
						content: validatedInput as any,
						version: "1",
					},
				});

				// Send completed status
				writer.write({
					type: "data-slidesOutline",
					id: outlineId,
					data: {
						status: "completed",
						content: validatedInput,
					},
				});

				console.log(
					`[slidesOutlineTool] Created artifact ${artifact.id} for message ${messageId}`
				);

				// Return artifact with ID as tool output
				return {
					artifactId: artifact.id,
					type: "slidesOutline" as const,
					version: "1",
					error: "",
					systemMessage: `Created slides outline. Simply acknowledge the creation of outline.`,
				};
			} catch (error) {
				console.error("[slidesOutlineTool] Error:", error);

				// Send error status
				writer.write({
					type: "data-slidesOutline",
					id: outlineId,
					data: {
						status: "error",
						content: undefined,
						error: error instanceof Error ? error.message : "Unknown error",
					},
				});

				// Return error in output schema format
				return {
					artifactId: outlineId,
					type: "slidesOutline" as const,
					version: "1",
					error: error instanceof Error ? error.message : "Unknown error",
					systemMessage: `Failed to create slides outline: ${error instanceof Error ? error.message : "Unknown error"}`,
				};
			}
		},
		onInputStart: async () => {
			writer.write({
				type: "data-slidesOutline",
				id: outlineId,
				data: {
					status: "starting",
					content: undefined,
				},
			});
		},
		onInputDelta: async (delta) => {
			// Accumulate the delta
			accumulatedInput += delta.inputTextDelta;

			// Parse the accumulated input using jsonrepair
			try {
				const repairedJson = jsonrepair(accumulatedInput);
				const parsed = JSON.parse(repairedJson);

				// Use safeParsePartialOutline to extract as much valid data as possible
				const partialContent = safeParsePartialOutline(parsed);

				console.log("🚀 onInputDelta partial content", {
					accumulatedLength: accumulatedInput.length,
					hasOutline: !!partialContent.outline,
					chaptersCount: partialContent.chapters?.length || 0,
				});

				// Stream the partial input back to client
				writer.write({
					type: "data-slidesOutline",
					id: outlineId,
					data: {
						status: "in_progress",
						content: partialContent,
					},
				});
			} catch (error) {
				// Ignore parse errors during streaming - partial JSON may be incomplete
				console.debug(
					"[slidesOutlineTool] Failed to parse accumulated input:",
					error
				);
			}
		},
	});
};
