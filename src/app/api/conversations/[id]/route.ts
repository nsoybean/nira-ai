import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConversationSettings } from "@/lib/conversation-settings";
import { withAuth } from "@/lib/auth-server";

/**
 * GET /api/conversations/[id]
 *
 * Fetches conversation details by ID
 */
export const GET = withAuth(
	async (req, { userId }, context: { params: Promise<{ id: string }> }) => {
		try {
			const { id } = await context.params;

			const conversation = await prisma.conversation.findUnique({
				where: { id, userId },
				select: {
					id: true,
					title: true,
					modelId: true,
					settings: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!conversation) {
				return NextResponse.json(
					{ error: "Conversation not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json(conversation);
		} catch (error) {
			console.error("[Get Conversation API] Error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch conversation" },
				{ status: 500 }
			);
		}
	}
);

/**
 * PATCH /api/conversations/[id]
 *
 * Updates a conversation's details (e.g., title, settings).
 *
 * Request body:
 * {
 *   "title"?: string,
 *   "settings"?: Partial<ConversationSettings>
 * }
 *
 * Note: The legacy "webSearch" field is deprecated. Use settings.websearch instead.
 *
 * Response:
 * {
 *   "success": true,
 *   "conversation": { id, title, ... }
 * }
 */
export const PATCH = withAuth(
	async (req, { userId }, context: { params: Promise<{ id: string }> }) => {
		try {
			const { id } = await context.params;
			const body: {
				title?: string;
				webSearch?: boolean; // Deprecated, kept for backwards compatibility
				settings?: Partial<ConversationSettings>;
			} = await req.json();

			if (!id) {
				return NextResponse.json(
					{ error: "Conversation ID is required" },
					{ status: 400 }
				);
			}

			// Check if conversation exists
			const conversation = await prisma.conversation.findUnique({
				where: { id, userId },
			});

			if (!conversation) {
				return NextResponse.json(
					{ error: "Conversation not found" },
					{ status: 404 }
				);
			}

			// Merge settings if provided
			let updatedSettings = conversation.settings;
			if (body.settings !== undefined) {
				updatedSettings = {
					...(conversation.settings as any),
					...body.settings,
				};
			}

			// Handle legacy webSearch field: if provided, merge into settings
			if (body.webSearch !== undefined) {
				updatedSettings = {
					...(updatedSettings as any),
					websearch: body.webSearch,
				};
			}

			// Update the conversation
			const updatedConversation = await prisma.conversation.update({
				where: { id, userId },
				data: {
					...(body.title !== undefined && { title: body.title }),
					settings: updatedSettings as any,
				},
				select: {
					id: true,
					title: true,
					modelId: true,
					websearch: true,
					settings: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			return NextResponse.json({
				success: true,
				conversation: updatedConversation,
			});
		} catch (error) {
			console.error("[Conversation API] Error updating conversation:", error);

			return NextResponse.json(
				{ error: "Failed to update conversation" },
				{ status: 500 }
			);
		}
	}
);

/**
 * DELETE /api/conversations/[id]
 *
 * Deletes a conversation and all associated messages.
 * Uses Prisma's onDelete: Cascade to automatically delete related data.
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Conversation deleted successfully"
 * }
 */
export const DELETE = withAuth(
	async (req, { userId }, context: { params: Promise<{ id: string }> }) => {
		try {
			const { id } = await context.params;

			if (!id) {
				return NextResponse.json(
					{ error: "Conversation ID is required" },
					{ status: 400 }
				);
			}

			// Check if conversation exists
			const conversation = await prisma.conversation.findUnique({
				where: { id, userId },
			});

			if (!conversation) {
				return NextResponse.json(
					{ error: "Conversation not found" },
					{ status: 404 }
				);
			}

			// Delete the conversation (messages will be cascade deleted)
			await prisma.conversation.delete({
				where: { id, userId },
			});

			return NextResponse.json({
				success: true,
				message: "Conversation deleted successfully",
			});
		} catch (error) {
			console.error("[Conversation API] Error deleting conversation:", error);

			return NextResponse.json(
				{ error: "Failed to delete conversation" },
				{ status: 500 }
			);
		}
	}
);
