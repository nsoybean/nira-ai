import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete the conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('[Conversation API] Error deleting conversation:', error);

    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
