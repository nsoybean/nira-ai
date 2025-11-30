import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/conversations
 *
 * Lists all conversations, ordered by most recent first.
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
export async function GET(req: Request) {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Transform to include message count
    const conversationsWithMetadata = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || 'Untitled Chat',
      messageCount: conv._count.messages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json(conversationsWithMetadata);
  } catch (error) {
    console.error('[Conversations API] Error fetching conversations:', error);

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
