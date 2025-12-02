import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createIdGenerator,
  LanguageModel,
} from "ai";
import { prisma } from "@/lib/prisma";
import { getModelById, calculateCost } from "@/lib/models";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * Handles streaming chat completions with multiple AI providers.
 * Implements message persistence using Vercel AI SDK UIMessage format.
 *
 * Request body:
 * - message: UIMessage - The latest user message
 * - conversationId: string - Conversation ID for persistence
 * - modelId: string (optional) - Model ID to use for this request
 *
 * Response:
 * - Server-Sent Events stream with chat completion
 */
export async function POST(req: Request) {
  try {
    const {
      conversationId,
      message,
      modelId,
    }: { message: UIMessage; conversationId: string; modelId?: string } =
      await req.json();

    // Validate messages
    if (!message || !message?.parts.length) {
      return new Response("Missing messages", { status: 400 });
    }

    // Validate conversation ID
    if (!conversationId) {
      return new Response("Conversation ID is required", { status: 400 });
    }

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Determine which model to use: provided modelId, conversation's model, or default
    const selectedModelId = modelId || conversation.modelId || "claude-3-7-sonnet-20250219";
    const modelConfig = getModelById(selectedModelId);

    if (!modelConfig) {
      return new Response(`Invalid model ID: ${selectedModelId}`, { status: 400 });
    }

    // Fetch all existing messages for conversation
    const existingMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // if no previous message, means is a new conversation, generate short title
    if (existingMessages.length === 0) {
      // Generate a short title for the new conversation
      // (Implementation for title generation can be added here)
    }

    // Combine existing messages with the new message
    const allMessages: UIMessage[] = [
      ...existingMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as any,
        parts: msg.parts as any, // Cast to satisfy UIMessage format
      })),
      message,
    ];

    // Convert UIMessage[] to ModelMessage[] format for the AI model
    // useChat sends UIMessage format (with parts), but streamText expects ModelMessage format (with content)
    const modelMessages = convertToModelMessages(allMessages);

    // Get the language model instance based on provider
    let languageModel: LanguageModel;
    if (modelConfig.provider === "anthropic") {
      languageModel = anthropic(selectedModelId);
    } else if (modelConfig.provider === "openai") {
      languageModel = openai(selectedModelId);
    } else {
      return new Response(`Unsupported provider: ${modelConfig.provider}`, { status: 400 });
    }

    // Track request start time for metrics
    const startTime = Date.now();

    // Stream the chat completion
    const result = streamText({
      model: languageModel,
      messages: modelMessages,
      system: `You are Nira, an intelligent AI assistant that provides thoughtful, accurate, and helpful responses.`,
      temperature: 0.7,
      maxOutputTokens: 4000,
      onFinish: async (event) => {
        // Calculate token costs using model-specific pricing
        const inputTokens = event.usage.inputTokens || 0;
        const outputTokens = event.usage.outputTokens || 0;
        const estimatedCost = calculateCost(selectedModelId, inputTokens, outputTokens);
        const responseTimeMs = Date.now() - startTime;

        try {
          // Track model usage for analytics
          await prisma.modelUsage.create({
            data: {
              conversationId,
              modelId: selectedModelId,
              modelProvider: modelConfig.provider,
              inputTokens,
              outputTokens,
              totalTokens:
                event.usage.totalTokens || inputTokens + outputTokens,
              estimatedCost,
              responseTimeMs,
              success: true,
            },
          });

          // Log metrics (development only)
          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Completion metrics:", {
              conversationId,
              model: selectedModelId,
              provider: modelConfig.provider,
              inputTokens,
              outputTokens,
              totalTokens: event.usage.totalTokens,
              cost: `$${estimatedCost.toFixed(4)}`,
              responseTime: `${responseTimeMs}ms`,
            });
          }
        } catch (error) {
          console.error("[Chat API] Error tracking usage:", error);
        }
      },
    });

    // Return stream with message persistence
    const response = result.toUIMessageStreamResponse({
      sendReasoning: true,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      async onFinish({ messages }) {
        try {
          // Save all messages to database in UIMessage format
          // allMessages includes both user messages and assistant response
          await prisma.message.createMany({
            data: [message, ...messages].map((msg) => ({
              id: msg.id,
              conversationId,
              role: msg.role,
              parts: msg.parts as any,
            })),
            skipDuplicates: true,
          });

          // Update conversation's updatedAt and lastMessageAt timestamps
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              updatedAt: new Date(),
              lastMessageAt: new Date(),
            },
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Messages saved:", {
              conversationId,
              messagesSaved: allMessages.length,
            });
          }
        } catch (error) {
          console.error("[Chat API] Error saving messages:", error);
          // Don't throw - we still want to return the response to the user
        }
      },
    });

    // Add conversation ID to response headers
    response.headers.set("X-Conversation-Id", conversation.id);

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
