import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/conversations/create
 *
 * Creates a new conversation.
 * This endpoint is called when a user starts a new chat.
 * Returns the conversation ID immediately so the UI can navigate.
 *
 * Response:
 * {
 *   "id": "conversation-uuid",
 *   "createdAt": "2025-11-30T..."
 * }
 */
export async function POST(req: Request) {
  try {
    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: null, // Anonymous for now
        title: 'New Chat',
      },
    });

    return NextResponse.json({
      id: conversation.id,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error('[Create Conversation API] Error creating conversation:', error);

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
