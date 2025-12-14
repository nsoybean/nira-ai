import { SlidesOutlineArtifact } from "@/lib/llmTools/createSlidesOutline";
import { MarkdownArtifact } from "@/lib/llmTools/createMarkdownFile";

/**
 * Artifact metadata shared across all artifact types
 */
export interface ArtifactMetadata {
	id: string;
	conversationId: string;
	messageId: string;
	userId?: string | null;
	type: string;
	version: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Generic artifact with typed content
 */
export interface ArtifactWithContent<T = unknown> extends ArtifactMetadata {
	content: T;
}

/**
 * Type aliases for specific artifact types
 */
export type SlidesArtifact = ArtifactWithContent<SlidesOutlineArtifact>;
export type MarkdownArtifactFull = ArtifactWithContent<MarkdownArtifact>;

/**
 * Union type for all known artifact types
 */
export type KnownArtifact = SlidesArtifact | MarkdownArtifactFull;

/**
 * Type guard to check if artifact is a slides outline
 */
export function isSlidesArtifact(
	artifact: ArtifactWithContent
): artifact is SlidesArtifact {
	return artifact.type === "slidesOutline" || artifact.type === "artifact_type_slides_outline";
}

/**
 * Type guard to check if artifact is a markdown document
 */
export function isMarkdownArtifact(
	artifact: ArtifactWithContent
): artifact is MarkdownArtifactFull {
	return artifact.type === "markdown" || artifact.type === "artifact_type_document";
}
