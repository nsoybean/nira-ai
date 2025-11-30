import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
 *     "parts": [{ "type": "text", "text": "Hello!" }],
 *     "createdAt": "2025-11-30T..."
 *   }
 * ]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Get conversation to find threadId
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get all messages for this thread
    const messages = await prisma.mastraMessage.findMany({
      where: { threadId: conversation.threadId },
      orderBy: { createdAt: 'asc' },
    });

    // Transform to UIMessage format
    const uiMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.content as any, // Content is already in V2 format with parts
      createdAt: msg.createdAt,
    }));

    return NextResponse.json(uiMessages);
  } catch (error) {
    console.error('[Messages API] Error loading messages:', error);

    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    );
  }
}
