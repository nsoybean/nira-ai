import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/conversations
 *
 * Creates a new conversation with a linked Mastra thread.
 * Returns the conversation ID for client navigation.
 *
 * Response:
 * {
 *   "id": "conversation-uuid",
 *   "threadId": "thread-uuid",
 *   "createdAt": "2025-11-30T..."
 * }
 */
export async function POST(req: Request) {
  try {
    // Create a new Mastra thread first
    const thread = await prisma.mastraThread.create({
      data: {
        resourceId: 'anonymous', // Will be replaced with real userId later
        title: 'New Chat',
      },
    });

    // Create conversation linked to the thread
    const conversation = await prisma.conversation.create({
      data: {
        threadId: thread.id,
        userId: null, // Anonymous for now
        title: 'New Chat',
      },
    });

    return NextResponse.json({
      id: conversation.id,
      threadId: thread.id,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error('[Conversations API] Error creating conversation:', error);

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

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
 *     "threadId": "thread-uuid",
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
          select: { modelUsage: true },
        },
      },
    });

    // Get message count for each conversation
    const conversationsWithMetadata = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await prisma.mastraMessage.count({
          where: { threadId: conv.threadId },
        });

        return {
          id: conv.id,
          title: conv.title || 'Untitled Chat',
          threadId: conv.threadId,
          messageCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json(conversationsWithMetadata);
  } catch (error) {
    console.error('[Conversations API] Error fetching conversations:', error);

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
