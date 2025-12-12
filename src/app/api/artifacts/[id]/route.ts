import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";
import z from "zod";
import { slidesOutlineArtifactSchema } from "@/lib/llmTools/slidesOutline";

/**
 * GET /api/artifacts/[id]
 *
 * Fetch a specific artifact by ID
 */
export const GET = withAuth(async (req, { userId, params }: any) => {
	try {
		const { id } = params;

		const artifact = await prisma.artifact.findUnique({
			where: { id },
		});

		if (!artifact) {
			return new Response("Artifact not found", { status: 404 });
		}

		// Verify user has access to this artifact
		if (artifact.userId && artifact.userId !== userId) {
			return new Response("Unauthorized", { status: 403 });
		}

		return Response.json(artifact);
	} catch (error) {
		console.error("[GET /api/artifacts/[id]]", error);
		return new Response("Internal server error", { status: 500 });
	}
});

/**
 * PATCH /api/artifacts/[id]
 *
 * Update an artifact's content (creates new version)
 *
 * Request body:
 * - content: The updated artifact content (must match artifact type schema)
 */
export const PATCH = withAuth(async (req, { userId, params }: any) => {
	try {
		const { id } = params;
		const { content } = await req.json();

		if (!content) {
			return new Response("Missing content", { status: 400 });
		}

		// Fetch existing artifact
		const existingArtifact = await prisma.artifact.findUnique({
			where: { id },
		});

		if (!existingArtifact) {
			return new Response("Artifact not found", { status: 404 });
		}

		// Verify user has access
		if (existingArtifact.userId && existingArtifact.userId !== userId) {
			return new Response("Unauthorized", { status: 403 });
		}

		// Validate content based on artifact type
		if (existingArtifact.type === "artifact_type_slides_outline") {
			const parsed = z.safeParse(slidesOutlineArtifactSchema, content);
			const validated = parsed.success ? parsed.data : null;

			if (!validated) {
				return new Response("Invalid slides outline content", {
					status: 400,
				});
			}
		}

		// Increment version
		const currentVersion = parseInt(existingArtifact.version) || 1;
		const newVersion = (currentVersion + 1).toString();

		// Update artifact
		const updatedArtifact = await prisma.artifact.update({
			where: { id },
			data: {
				content: content as any,
				version: newVersion,
				updatedAt: new Date(),
			},
		});

		return Response.json(updatedArtifact);
	} catch (error) {
		console.error("[PATCH /api/artifacts/[id]]", error);
		return new Response("Internal server error", { status: 500 });
	}
});

/**
 * DELETE /api/artifacts/[id]
 *
 * Delete an artifact
 */
export const DELETE = withAuth(async (req, { userId, params }: any) => {
	try {
		const { id } = params;

		// Fetch existing artifact
		const existingArtifact = await prisma.artifact.findUnique({
			where: { id },
		});

		if (!existingArtifact) {
			return new Response("Artifact not found", { status: 404 });
		}

		// Verify user has access
		if (existingArtifact.userId && existingArtifact.userId !== userId) {
			return new Response("Unauthorized", { status: 403 });
		}

		// Delete artifact
		await prisma.artifact.delete({
			where: { id },
		});

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error("[DELETE /api/artifacts/[id]]", error);
		return new Response("Internal server error", { status: 500 });
	}
});
