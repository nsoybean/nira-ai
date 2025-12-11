import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";

/**
 * GET /api/conversations
 *
 * Lists all conversations, ordered by most recent activity first.
 * Includes message count and last activity timestamp.
 *
 * Response:
 * [
 *   {
 *     "id": "conversation-uuid",
 *     "title": "Chat about AI",
 *     "messageCount": 10,
 *     "createdAt": "2025-11-30T...",
 *     "updatedAt": "2025-11-30T..."
 *   }
 * ]
 */
export const GET = withAuth(async (req, { userId }) => {
	try {
		const conversations = await prisma.conversation.findMany({
			where: { userId },
			orderBy: { lastMessageAt: "desc" },
			include: {
				_count: {
					select: { messages: true },
				},
			},
		});

		// Transform to include message count
		const conversationsWithMetadata = conversations.map((conv) => ({
			id: conv.id,
			title: conv.title || "Untitled Chat",
			messageCount: conv._count.messages,
			createdAt: conv.createdAt,
			updatedAt: conv.updatedAt,
		}));

		return NextResponse.json(conversationsWithMetadata);
	} catch (error) {
		console.error("[Conversations API] Error fetching conversations:", error);

		return NextResponse.json(
			{ error: "Failed to fetch conversations" },
			{ status: 500 }
		);
	}
});

/**
 * DELETE /api/conversations
 *
 * Deletes all conversations and their associated messages.
 * This action cannot be undone.
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "All conversations deleted successfully",
 *   "deletedCount": 5
 * }
 */
export const DELETE = withAuth(async (req, { userId }) => {
	try {
		// Count conversations before deletion
		const count = await prisma.conversation.count({
			where: { userId },
		});

		// Delete all conversations (messages will be cascade deleted)
		await prisma.conversation.deleteMany({
			where: { userId },
		});

		return NextResponse.json({
			success: true,
			message: "All conversations deleted successfully",
			deletedCount: count,
		});
	} catch (error) {
		console.error(
			"[Conversations API] Error deleting all conversations:",
			error
		);

		return NextResponse.json(
			{ error: "Failed to delete conversations" },
			{ status: 500 }
		);
	}
});
