import { anthropic, AnthropicProviderOptions } from "@ai-sdk/anthropic";
import {
  openai,
  OpenAIProviderSettings,
  OpenAIResponsesProviderOptions,
} from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createIdGenerator,
  LanguageModel,
  generateText,
} from "ai";
import { prisma } from "@/lib/prisma";
import { getModelById, calculateCost } from "@/lib/models";
import { anthropicWebSearchTool, openaiWebSearchTool } from "@/lib/tools";
import { mergeConversationSettings } from "@/lib/conversation-settings";

// Allow streaming responses up to X seconds
export const maxDuration = 60;

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

    // Get conversation settings with defaults
    const settings = mergeConversationSettings(conversation?.settings as any);

    // Determine which model to use: provided modelId, conversation's model, or default
    const selectedModelId =
      modelId || conversation.modelId || "claude-3-7-sonnet-20250219";
    const modelConfig = getModelById(selectedModelId);

    if (!modelConfig) {
      return new Response(`Invalid model ID: ${selectedModelId}`, {
        status: 400,
      });
    }

    // Fetch all existing messages for conversation
    const existingMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Variable to store generated title for response headers
    let generatedTitle: string | null = null;

    // if no previous message, means is a new conversation, generate short title
    if (existingMessages.length === 0) {
      // Generate a short title for the new conversation using OpenAI nano model
      try {
        // Extract text content from user message
        const userMessageText = message.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join(" ");

        if (userMessageText) {
          // Use OpenAI nano model for cheap title generation
          const titleModel = openai("gpt-5-nano");
          const titleResult = await generateText({
            model: titleModel,
            prompt: `Generate a short, descriptive title (maximum 8 words) for this chat message. Only return the title, nothing else.\n\nMessage: ${userMessageText}`,
            maxOutputTokens: 20,
          });

          generatedTitle = titleResult.text.trim();

          // Update conversation title in database
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title: generatedTitle },
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[Chat API] Generated title:", generatedTitle);
          }
        }
      } catch (error) {
        console.error("[Chat API] Error generating title:", error);
        // Continue with chat even if title generation fails
      }
    }

    // Combine existing messages with the new message
    const allMessages: UIMessage[] = [
      ...existingMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as any,
        parts: msg.parts as any, // Cast to satisfy UIMessage format
      })),
      message,
    ];

    // Save user message immediately to ensure correct ordering
    await prisma.message.create({
      data: {
        id: message.id,
        conversationId,
        role: message.role,
        parts: message.parts as any,
      },
    });

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
      return new Response(`Unsupported provider: ${modelConfig.provider}`, {
        status: 400,
      });
    }

    // Track request start time for metrics
    const startTime = Date.now();

    // Stream the chat completion
    const result = streamText({
      model: languageModel,
      headers: {
        // doesnt seem to be working
        // https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming
        // ...(modelConfig.provider === "anthropic" && {
        //   "anthropic-beta": "fine-grained-tool-streaming-2025-05-14",
        // }),
      },
      providerOptions: {
        // anthropic
        anthropic: {
          ...(settings.extendedThinking && {
            thinking: { type: "enabled", budgetTokens: 2000 },
          }),
        } satisfies AnthropicProviderOptions,
        // openai
        openai: {
          ...(settings.extendedThinking && {
            reasoningSummary: "auto",
          }),
        } satisfies OpenAIResponsesProviderOptions,
      },
      tools: {
        // anthropic
        ...(modelConfig.provider === "anthropic" && {
          // ned to evaluate, seems abit spammy
          // code_execution: codeExecutionTool,
          ...(conversation.websearch && { web_search: anthropicWebSearchTool }),
        }),
        // openai
        ...(modelConfig.provider === "openai" && {
          ...(conversation.websearch && { web_search: openaiWebSearchTool }),
        }),
      },
      messages: modelMessages,
      system: `You are Nira, an intelligent AI assistant that provides thoughtful, accurate, and helpful responses.`,
      temperature: 0.7,
      maxOutputTokens: 4000,
      onFinish: async (event) => {
        // Calculate token costs using model-specific pricing
        const inputTokens = event.usage.inputTokens || 0;
        const outputTokens = event.usage.outputTokens || 0;
        const estimatedCost = calculateCost(
          selectedModelId,
          inputTokens,
          outputTokens
        );
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
      sendSources: true,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      async onFinish({ messages }) {
        try {
          // Save only assistant messages (user message already saved above)
          await prisma.message.createMany({
            data: messages.map((msg) => ({
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

    // Add generated title to response headers if available
    if (generatedTitle) {
      response.headers.set("X-Chat-Title", generatedTitle);
    }

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
