import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages } from "ai";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * Handles streaming chat completions with Claude 3.5 Sonnet.
 *
 * Request body:
 * - message: UIMessage - The latest user message
 * - id: string - Conversation ID for persistence
 *
 * Response:
 * - Server-Sent Events stream with chat completion
 */
export async function POST(req: Request) {
  try {
    const { message, id: conversationId } = await req.json();

    // Validate message
    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    // Get or create conversation
    let conversation;

    if (!conversationId) {
      // First message - create new conversation with linked thread
      const thread = await prisma.mastraThread.create({
        data: {
          resourceId: 'anonymous',
          title: 'New Chat',
        },
      });

      conversation = await prisma.conversation.create({
        data: {
          threadId: thread.id,
          userId: null,
          title: 'New Chat',
        },
      });
    } else {
      // Existing conversation - verify it exists
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
      }
    }

    // Load existing messages from database
    const existingMessages = await prisma.mastraMessage.findMany({
      where: { threadId: conversation.threadId },
      orderBy: { createdAt: 'asc' },
    });

    // Build full message history: existing + new user message
    const allUIMessages = [
      ...existingMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.content as any,
      })),
      message, // The new user message
    ];

    // Convert UIMessage[] to ModelMessage[] format
    // useChat sends UIMessage format (with parts), but streamText expects ModelMessage format (with content)
    const modelMessages = convertToModelMessages(allUIMessages);

    // Model configuration
    const languageModel = anthropic("claude-3-7-sonnet-20250219");
    // Track request start time for metrics
    const startTime = Date.now();

    // Stream the chat completion
    const result = streamText({
      model: languageModel,
      messages: modelMessages,
      system: `You are Lume, an intelligent AI assistant that illuminates complex topics with clarity and insight. You provide thoughtful, accurate, and helpful responses.`,
      temperature: 0.7,
      maxOutputTokens: 4000,
      onFinish: async (event) => {
        // Calculate response time
        const responseTimeMs = Date.now() - startTime;

        // Calculate token costs (Claude 3.7 Sonnet pricing - update as needed)
        const inputTokens = event.usage.inputTokens || 0;
        const outputTokens = event.usage.outputTokens || 0;
        const inputCost = (inputTokens / 1000) * 0.003;
        const outputCost = (outputTokens / 1000) * 0.015;
        const estimatedCost = inputCost + outputCost;

        try {
          // Save both user message and assistant response to database
          const userMessage = await prisma.mastraMessage.create({
            data: {
              threadId: conversation.threadId,
              role: 'user',
              content: message.parts, // Store parts array
              type: 'text',
            },
          });

          // Get assistant response text from event
          const assistantMessage = await prisma.mastraMessage.create({
            data: {
              threadId: conversation.threadId,
              role: 'assistant',
              content: [{ type: 'text', text: event.text }], // Convert to parts format
              type: 'text',
            },
          });

          // Update conversation's updatedAt timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          // Track model usage for analytics
          await prisma.modelUsage.create({
            data: {
              conversationId,
              modelId: languageModel.modelId,
              modelProvider: 'anthropic',
              inputTokens,
              outputTokens,
              totalTokens: event.usage.totalTokens || inputTokens + outputTokens,
              estimatedCost,
              responseTimeMs,
              success: true,
            },
          });

          // Log metrics (development only)
          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Completion metrics:", {
              conversationId,
              model: languageModel.modelId,
              inputTokens,
              outputTokens,
              totalTokens: event.usage.totalTokens,
              cost: `$${estimatedCost.toFixed(4)}`,
              responseTime: `${responseTimeMs}ms`,
              messagesSaved: [userMessage.id, assistantMessage.id],
            });
          }
        } catch (error) {
          console.error("[Chat API] Error saving messages:", error);
          // Don't throw - we still want to return the response to the user
        }
      },
    });

    // Return stream with conversation ID in headers for client to update URL
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true,
    });

    // Add conversation ID to response headers
    response.headers.set('X-Conversation-Id', conversation.id);

    return response;
  } catch (error) {
    console.error("[Chat API] Error:", error);

    // Return appropriate error response
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
