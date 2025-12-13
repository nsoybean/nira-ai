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
 * Create Slides Outline Tool
 *
 * This tool allows the AI to generate a structured presentation outline that will be
 * displayed to the user in the chat UI before the actual PowerPoint is created.
 *
 * Architecture:
 * - Shares Zod schemas with @/lib/types/slides-outline for DRY principles
 * - Validates slide count and sequential numbering
 * - Auto-corrects mismatches and logs warnings
 * - Persists artifact to database with unique ID
 * - Returns artifact reference for UI rendering
 *
 * Usage:
 * - AI analyzes user's request for a presentation
 * - AI calls this tool with the complete outline structure
 * - Tool validates and saves artifact to database
 * - Returns artifact ID + content for message part
 * - Frontend renders the outline with chapter/slide navigation
 * - User can edit, and edits are saved with new version
 */
export const createSlidesOutlineTool = (options: {
	conversationId: string;
	messageId: string;
	userId?: string;
	writer: UIMessageStreamWriter<MyUIMessage>;
}) =>
	tool({
		description: `Create a structured presentation outline with chapters and slides. Use this when the user requests a PowerPoint presentation or slide deck.`,
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
				messages: [
					{
						role: "system",
						content: `Create a structured presentation outline. Structure the outline into logical chapters/sections, with each slide having clear titles and content. The outline will be displayed to the user for review.
Slide types:
- "title": Title/intro slides with minimal text (for opening or section dividers)
- "text": Standard content slides with paragraph text
- "bullets": Bullet point list slides
- "image": Slides that should include images/graphics/visuals
- "chart": Slides with data visualizations or graphs

Requirements:
- slideNumber must be sequential across all chapters (1, 2, 3...)
- slidesCount must match the total number of slides
- Each slide should have concise, focused content (1-3 key points)
- Organize slides into logical chapters/sections`,
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
