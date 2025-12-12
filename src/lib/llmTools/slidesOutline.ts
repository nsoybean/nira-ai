import { tool } from "ai";
import { prisma } from "@/lib/prisma";

/**
 * Slides Outline Artifact Types
 *
 * Defines the structure for AI-generated presentation outlines that will be
 * rendered in the chat UI before actual PowerPoint generation.
 */

import { z } from "zod";

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
	type: z.string(),
	version: z.string(),
	content: slidesOutlineArtifactSchema,
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
export const createSlidesOutlineToolFactory = (options: {
	conversationId: string;
	messageId: string;
	userId?: string;
}) =>
	tool({
		description: `Create a structured presentation outline with chapters and slides. Use this when the user requests a PowerPoint presentation or slide deck.

The outline will be displayed to the user for review before generating the actual PowerPoint file. Structure the content into logical chapters/sections, with each slide having clear titles and content.

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

		inputSchema: slidesOutlineArtifactSchema,
		outputSchema: slidesOutlineArtifactOutputSchema,

		execute: async (input) => {
			const { conversationId, messageId, userId } = options;

			// Validate that slidesCount matches actual slide count
			const totalSlides = input.chapters.reduce(
				(sum: number, chapter: Chapter) => sum + chapter.slides.length,
				0
			);

			if (totalSlides !== input.outline.slidesCount) {
				console.warn(
					`[slidesOutlineTool] Slide count mismatch: declared ${input.outline.slidesCount}, actual ${totalSlides}. Auto-correcting...`
				);
				input.outline.slidesCount = totalSlides;
			}

			// Validate slide numbering is sequential
			const allSlides = input.chapters.flatMap(
				(chapter: Chapter) => chapter.slides
			);
			const expectedNumbers = Array.from(
				{ length: totalSlides },
				(_, i) => i + 1
			);
			const actualNumbers = allSlides
				.map((slide: Slide) => slide.slideNumber)
				.sort((a: number, b: number) => a - b);

			const isSequential = expectedNumbers.every(
				(num, idx) => num === actualNumbers[idx]
			);

			if (!isSequential) {
				console.warn(
					"[slidesOutlineTool] Slide numbers are not sequential. Re-numbering slides..."
				);
				let counter = 1;
				for (const chapter of input.chapters) {
					for (const slide of chapter.slides) {
						slide.slideNumber = counter++;
					}
				}
			}

			// Build the validated artifact
			const artifactContent: SlidesOutlineArtifact = {
				outline: {
					pptTitle: input.outline.pptTitle,
					slidesCount: input.outline.slidesCount,
					overallRequirements: input.outline.overallRequirements,
				},
				chapters: input.chapters,
			};

			const test = await prisma.conversation.findUnique({
				where: { id: conversationId },
			});

			// Save artifact to database
			const artifact = await prisma.artifact.create({
				data: {
					conversationId,
					messageId,
					userId: userId || null,
					type: "artifact_type_slides_outline",
					content: artifactContent as any,
					version: "1",
				},
			});
			// const test2 = await prisma.artifact.findFirst({ where: { id: '123' } })

			console.log(
				`[slidesOutlineTool] Created artifact ${artifact.id} for message ${messageId}`
			);

			// Return artifact with ID for frontend reference
			return {
				artifactId: artifact.id,
				type: "artifact_type_slides_outline",
				version: artifact.version,
				content: artifactContent,
			};
		},
	});
