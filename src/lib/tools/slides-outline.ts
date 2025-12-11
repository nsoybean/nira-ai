import { tool } from "ai";
import {
	slidesOutlineArtifactSchema,
	type SlidesOutlineArtifact,
	type Chapter,
	type Slide,
} from "@/lib/types/slides-outline";
import { prisma } from "@/lib/prisma";

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
			})

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
			})
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
