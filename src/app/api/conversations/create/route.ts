import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import {
  ConversationSettings,
  DEFAULT_CONVERSATION_SETTINGS,
} from "@/lib/conversation-settings";

/**
 * POST /api/conversations/create
 *
 * Creates a new conversation.
 * This endpoint is called when a user starts a new chat.
 * Returns the conversation ID immediately so the UI can navigate.
 *
 * Request body (optional):
 * {
 *   "modelId": "claude-3-7-sonnet-20250219",
 *   "useWebsearch": boolean,
 *   "settings": ConversationSettings
 * }
 *
 * Response:
 * {
 *   "id": "conversation-uuid",
 *   "createdAt": "2025-11-30T..."
 * }
 */
export async function POST(req: Request) {
  try {
    // Parse request body to get optional modelId
    let modelId = DEFAULT_MODEL_ID;
    let useWebsearch = false;
    let settings: ConversationSettings = DEFAULT_CONVERSATION_SETTINGS;

    try {
      const body = await req.json();
      if (body.modelId) {
        modelId = body.modelId;
      }

      if (body.useWebsearch) {
        useWebsearch = body.useWebsearch;
      }

      if (body.settings) {
        settings = { ...DEFAULT_CONVERSATION_SETTINGS, ...body.settings };
      }
    } catch {
      // If no body or invalid JSON, use default model
    }

    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: null, // Anonymous for now
        title: "New Chat",
        modelId,
        websearch: useWebsearch,
        settings: settings as any, // Prisma Json type
      },
    });

    return NextResponse.json({
      id: conversation.id,
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error(
      "[Create Conversation API] Error creating conversation:",
      error
    );

    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
