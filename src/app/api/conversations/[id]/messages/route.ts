import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-server";

/**
 * GET /api/conversations/[id]/messages
 *
 * Loads all messages for a conversation from the database.
 * Returns messages in AI SDK UIMessage format for useChat hook.
 *
 * Response:
 * [
 *   {
 *     "id": "msg-uuid",
 *     "role": "user",
 *     "parts": [{ "type": "text", "text": "Hello!" }]
 *   }
 * ]
 */
export const GET = withAuth(
  async (req, { userId }, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: conversationId } = await params;

      // Verify conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Get all messages for this conversation
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      // Transform to UIMessage format (already in the correct format from DB)
      const uiMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts, // Already stored as UIMessagePart[]
      }));

      return NextResponse.json(uiMessages);
    } catch (error) {
      console.error("[Messages API] Error loading messages:", error);

      return NextResponse.json(
        { error: "Failed to load messages" },
        { status: 500 }
      );
    }
  }
);
