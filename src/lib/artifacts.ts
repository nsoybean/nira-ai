import { UIMessage } from "ai";
import { PrismaClient } from "@prisma/client";
import { SlidesOutlineArtifact } from "@/lib/types/slides-outline";
import { createSlidesOutlineToolUIPart } from "@/types/tools";

/**
 * Artifact result type for type safety
 */
interface ArtifactResult {
	artifactId: string;
	type: string;
	version: string;
	content: SlidesOutlineArtifact;
}

/**
 * Type guard to check if a part is a slides outline tool part
 */
export function isSlidesOutlineToolPart(
	part: any
): part is Extract<createSlidesOutlineToolUIPart, { type: "tool-createSlidesOutline" }> {
	return (
		part.type === "tool-createSlidesOutline" &&
		part.state === "output-available" &&
		typeof part.output === "object" &&
		part.output !== null &&
		"artifactId" in part.output
	);
}

/**
 * Extract artifact data from a tool part
 */
export function extractArtifactFromPart(
	part: Extract<createSlidesOutlineToolUIPart, { type: "tool-createSlidesOutline" }>
): ArtifactResult | null {
	if (part.state === "output-available" && part.output) {
		return part.output;
	}
	return null;
}

/**
 * Hydrate Artifacts in Messages
 *
 * Replaces outdated artifact content in message parts with latest versions from the database.
 * This ensures the LLM always sees the most recent artifact state when processing context.
 *
 * @param messages - Array of UIMessage with potentially outdated artifact content
 * @param prisma - Prisma client instance
 * @returns Messages with updated artifact content
 */
export async function hydrateArtifactsInMessages(
	messages: UIMessage[],
	prisma: PrismaClient
): Promise<UIMessage[]> {
	// Collect all artifact IDs from tool results
	const artifactIds = new Set<string>();

	for (const message of messages) {
		for (const part of message.parts) {
			if (isSlidesOutlineToolPart(part)) {
				const artifact = extractArtifactFromPart(part);
				if (artifact) {
					artifactIds.add(artifact.artifactId);
				}
			}
		}
	}

	// If no artifacts, return messages as-is
	if (artifactIds.size === 0) {
		return messages;
	}

	// Fetch latest versions of all artifacts
	const latestArtifacts = await prisma.artifact.findMany({
		where: {
			id: {
				in: Array.from(artifactIds),
			},
		},
		select: {
			id: true,
			content: true,
			version: true,
			type: true,
		},
	});

	// Create a lookup map
	const artifactMap = new Map(
		latestArtifacts.map((artifact: any) => [artifact.id, artifact])
	);

	// Replace outdated content in messages
	const hydratedMessages = messages.map((message) => ({
		...message,
		parts: message.parts.map((part) => {
			if (isSlidesOutlineToolPart(part)) {
				const artifact = extractArtifactFromPart(part);
				if (artifact) {
					const latestArtifact = artifactMap.get(artifact.artifactId);

					if (latestArtifact) {
						// Replace with latest content
						return {
							...part,
							output: {
								artifactId: latestArtifact.id,
								type: latestArtifact.type,
								version: latestArtifact.version,
								content: latestArtifact.content as SlidesOutlineArtifact,
							},
						} as typeof part;
					}
				}
			}

			// Return part unchanged if not an artifact or artifact not found
			return part;
		}),
	}));

	return hydratedMessages;
}
