import { PrismaClient } from "@prisma/client";
import { SlidesOutlineArtifact } from "./llmTools/createSlidesOutline";
import { MyUIMessage } from "./UIMessage";

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
	messages: MyUIMessage[],
	prisma: PrismaClient
): Promise<MyUIMessage[]> {
	// Collect all artifact IDs from tool results
	const artifactIds = new Set<string>();

	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type === "tool-createSlidesOutline") {
				const artifact = part.output;
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
			if (part.type === "tool-createSlidesOutline") {
				const artifact = part.output;
				if (artifact) {
					const latestArtifact = artifactMap.get(artifact.artifactId);

					if (latestArtifact) {
						// Replace with latest content
						return {
							...part,
							output: {
								...part.output,
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
