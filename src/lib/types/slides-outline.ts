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

/**
 * Zod schema for chapter validation
 */
export const chapterSchema = z.object({
	/** Title of the chapter/section */
	chapterTitle: z.string().min(1),
	/** Array of slides in this chapter */
	slides: z.array(slideSchema).min(1),
});

/**
 * Zod schema for presentation outline metadata
 */
export const presentationOutlineSchema = z.object({
	/** Title of the entire presentation */
	pptTitle: z.string().min(1),
	/** Total number of slides in the presentation */
	slidesCount: z.number().int().positive(),
	/** Optional special requirements or notes for the presentation */
	overallRequirements: z.string().nullable(),
});

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
	chapters: z.array(chapterSchema).min(1),
});

/**
 * TypeScript types inferred from Zod schemas
 */
export type SlideType = z.infer<typeof slideTypeSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type PresentationOutline = z.infer<typeof presentationOutlineSchema>;
export type SlidesOutlineArtifact = z.infer<
	typeof slidesOutlineArtifactSchema
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
