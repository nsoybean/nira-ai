import {
	createIdGenerator,
	DeepPartial,
	generateId,
	stepCountIs,
	streamObject,
	tool,
	UIMessageStreamWriter,
} from "ai";
import { prisma } from "@/lib/prisma";

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
});
export type SlidesOutlineArtifactOutput = z.infer<
	typeof slidesOutlineArtifactOutputSchema
>;

/**
 * Type guard to check if an object is a valid SlidesOutlineArtifact
 * Uses Zod for validation
 */
export function isSlidesOutlineArtifact(
	obj: unknown
): obj is SlidesOutlineArtifact {
	return slidesOutlineArtifactSchema.safeParse(obj).success;
}

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
 * Creates a presentation outline by delegating to a specialized AI agent.
 *
 * Architecture:
 * - Takes no direct parameters (uses conversation messages as context)
 * - Invokes Sonnet 4.5 with specialized presentation planning prompt
 * - Streams outline generation with UI updates (starting → in_progress → completed)
 * - Persists artifact to database
 * - Returns artifact reference for message parts
 *
 * The nested agent generates structured outlines with chapters and slides,
 * validates slide counts/numbering, and returns JSON matching slidesOutlineArtifactSchema.
 */
export const createSlidesOutlineTool = (options: {
	conversationId: string;
	messageId: string;
	userId?: string;
	writer: UIMessageStreamWriter<MyUIMessage>;
}) =>
	tool({
		description: `Create a presentation outline by invoking a specialized planning agent. Analyzes conversation context to generate a structured slide deck outline with chapters and slides (title, text, bullets, image, chart types). Streams results for user review. Use when user requests PowerPoint/slides.`,
		// 		description: `Invoke a specialized AI agent to create a structured presentation outline with chapters and slides.

		// This tool delegates to a presentation planning agent that analyzes the conversation context to generate:
		// - Logical chapters/sections
		// - Individual slides with appropriate types (title, text, bullets, image, chart)
		// - Sequential slide numbering and metadata

		// The outline is streamed to the UI for user review before final PowerPoint generation. Use this when the user requests a PowerPoint presentation, slide deck, or asks to create slides.

		// Note: This tool uses conversation context (no explicit parameters needed).`,
		inputSchema: z.object({}),
		outputSchema: slidesOutlineArtifactOutputSchema,
		execute: async (_, { messages }) => {
			const { conversationId, messageId, userId, writer } = options;
			const outlineId = createIdGenerator({
				prefix: "artifact",
				size: 16,
			})();

			writer.write({
				type: "data-slidesOutline",
				id: outlineId,
				data: {
					status: "starting",
					content: undefined,
				},
			});

			// stream object
			const { partialObjectStream } = streamObject({
				schema: slidesOutlineArtifactSchema,
				// model: `anthropic/claude-haiku-4-5`,
				model: `anthropic/claude-sonnet-4-5`,
				// https://ai-sdk.dev/providers/ai-sdk-providers/anthropic#structured-outputs-and-tool-input-streaming
				headers: {
					"anthropic-beta": "fine-grained-tool-streaming-2025-05-14",
				},
				messages: [
					{
						role: "system",
						content: `You are a presentation planning expert. Analyze the user's request and create a structured presentation outline following this JSON schema:

{
  outline: { pptTitle, slidesCount, overallRequirements },
  chapters: [{ chapterTitle, slides: [{ slideNumber, slideTitle, slideContent, slideType }] }]
}

CONSTRAINTS:
- Maximum 10 slides total (keep presentations concise and focused)
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

EXAMPLE STRUCTURE:
Chapter 1: "Introduction"
  - Slide 1 (title): "Project Alpha: Q4 Results" 
  - Slide 2 (bullets): "Key Achievements" with 4 bullet points

Chapter 2: "Performance Analysis"  
  - Slide 3 (chart): "Revenue Growth Trends"
  - Slide 4 (text): "Market Factors" explaining context
  - Slide 5 (image): "Customer Testimonials" describing visual layout

Analyze the user's request carefully and create an outline that best serves their presentation goals.`,
					},
					...messages,
				],
			});

			try {
				let finalObject: DeepPartial<SlidesOutlineArtifact> | undefined;

				for await (const partialObject of partialObjectStream) {
					writer.write({
						type: "data-slidesOutline",
						id: outlineId,
						data: {
							status: "in_progress",
							content: partialObject,
						},
					});

					finalObject = partialObject; // Capture the last/complete object
				}

				if (!finalObject) {
					throw new Error("No outline object was generated");
				}

				// Save artifact to database
				const artifact = await prisma.artifact.create({
					data: {
						id: outlineId,
						conversationId,
						messageId,
						userId: userId || null,
						type: "slidesOutline",
						content: finalObject as any,
						version: "1",
					},
				});

				writer.write({
					type: "data-slidesOutline",
					id: outlineId,
					data: {
						status: "completed",
						content: finalObject,
					},
				});

				console.log(
					`[slidesOutlineTool] Created artifact ${artifact.id} for message ${messageId}`
				);

				// Return artifact with ID as tool output
				// is string better?
				// return `<created_slides_outline id="${artifact.id}" version="1"/>`;
				return {
					artifactId: artifact.id,
					type: "slidesOutline",
					version: "1",
				};
			} catch (error) {
				console.error("[slidesOutlineTool] Error:", error);

				writer.write({
					type: "data-slidesOutline",
					id: outlineId,
					data: {
						status: "error",
						content: undefined, // or include error details if needed
					},
				});

				// Return error message or throw
				throw new Error(`Failed to create slides outline: ${error}`);
			}
		},
	});
