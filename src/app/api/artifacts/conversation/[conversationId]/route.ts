import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";

/**
 * GET /api/artifacts/conversation/[conversationId]
 *
 * Fetch all artifacts for a specific conversation
 * Returns artifacts sorted by most recent first
 */
export const GET = withAuth(
	async (
		req,
		{ userId },
		context: { params: Promise<{ conversationId: string }> }
	) => {
		try {
			const { conversationId } = await context.params;

			// Verify conversation exists and user has access
			const conversation = await prisma.conversation.findUnique({
				where: { id: conversationId },
			});

			if (!conversation) {
				return new Response("Conversation not found", { status: 404 });
			}

			// Verify user has access to this conversation
			if (conversation.userId && conversation.userId !== userId) {
				return new Response("Unauthorized", { status: 403 });
			}

			// Fetch all artifacts for this conversation, sorted by most recent
			const artifacts = await prisma.artifact.findMany({
				where: {
					conversationId,
					// Also filter by userId to ensure user can only see their artifacts
					...(userId && { userId }),
				},
				orderBy: {
					createdAt: "desc", // Most recent first
				},
			});

			return Response.json(artifacts);
		} catch (error) {
			console.error(
				"[GET /api/artifacts/conversation/[conversationId]]",
				error
			);
			return new Response("Internal server error", { status: 500 });
		}
	}
);
