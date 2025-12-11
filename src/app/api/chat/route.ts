import { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { openai, OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createIdGenerator,
  stepCountIs,
  generateText,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { prisma } from "@/lib/prisma";
import { getModelById, calculateCost } from "@/lib/models";
import {
  tavilyExtractTool,
  tavilySearchTool,
  createSlidesOutlineToolFactory,
} from "@/lib/tools";
import { mergeConversationSettings } from "@/lib/conversation-settings";
import { MyUIMessage } from "@/lib/types";
import { withAuth } from "@/lib/auth-server";
import { Logger } from "@/lib/logger";
import { hydrateArtifactsInMessages } from "@/lib/artifacts";

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
export const POST = withAuth(async (req, { userId }) => {
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
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    const logger = new Logger({ prefix: 'Chat API' }).addMetadata("conversationId", conversation.id);

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

    logger.log("using model", {
      model: selectedModelId,
      provider: modelConfig.provider,
    });

    // Fetch all existing messages for conversation
    const existingMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // if no previous message, generate a short title for the new conversation
    let generatedTitle: string | null = null;
    if (existingMessages.length === 0) {
      // Extract text from the user message
      const userMessageText =
        message.parts
          ?.filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join(" ") || "";

      if (userMessageText.trim()) {
        try {
          // Generate title using a fast model
          const { text } = await generateText({
            model: `google/gemini-2.5-flash-lite`,
            messages: [
              {
                role: "user",
                content: `Generate a concise 3-5 word title for this message. Return only the title, no quotes or punctuation at the end: "${userMessageText.slice(
                  0,
                  200
                )}"`,
              },
            ],
            maxOutputTokens: 20,
          });

          generatedTitle = text.trim();

          // Update conversation title in database
          if (generatedTitle) {
            await prisma.conversation.update({
              where: { id: conversationId, userId },
              data: { title: generatedTitle },
            });

            if (process.env.NODE_ENV === "development") {
              logger.log("generated title", { title: generatedTitle });
            }
          }
        } catch (error) {
          // Continue with the chat even if title generation fails
          logger.log("error generating title", { error });
        }
      }
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

    // Save user message immediately to ensure correct ordering
    await prisma.message.create({
      data: {
        id: message.id,
        conversationId,
        role: message.role,
        parts: message.parts as any,
      },
    });

    // Hydrate artifacts with latest versions from database
    // This replaces outdated artifact content in message history with current versions
    // so the LLM always sees the most recent state when user has edited artifacts
    // const hydratedMessages = await hydrateArtifactsInMessages(allMessages, prisma);

    // Convert UIMessage[] to ModelMessage[] format for the AI model
    // useChat sends UIMessage format (with parts), but streamText expects ModelMessage format (with content)
    const modelMessages = convertToModelMessages(allMessages);

    // Track request start time for metrics
    const startTime = Date.now();

    const stream = createUIMessageStream<MyUIMessage>({
      execute: ({ writer }) => {
        writer.write({
          type: "data-title",
          id: conversationId,
          data: { value: generatedTitle || "New Chat" },
          transient: true, // This part won't be added to message history
        });

        // Generate a temporary message ID for the assistant response
        // This will be used to link artifacts to the message
        const assistantMessageId = createIdGenerator({ prefix: "msg", size: 16 })();

        // Create slides outline tool with context
        const slidesOutlineTool = createSlidesOutlineToolFactory({
          conversationId,
          messageId: assistantMessageId,
          userId,
        });

        // Stream the chat completion
        const result = streamText({
          model: `${modelConfig.provider}/${selectedModelId}`,
          stopWhen: stepCountIs(5),
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
            // web search
            ...(settings.websearch && {
              webSearch: tavilySearchTool,
              webExtract: tavilyExtractTool,
            }),

            // slides outline tool
            createSlidesOutline: slidesOutlineTool,

            // ...(modelConfig.provider === 'openai' && { image_generation: openai.tools.imageGeneration({ outputFormat: 'png' }), })
          },
          messages: modelMessages,
          system: `You are Nira, an intelligent AI assistant that provides thoughtful, accurate, and helpful responses.

When users request presentations or slide decks, use the 'createSlidesOutline' tool to generate a structured outline with chapters and slides. Keep content concise and organized.`,
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
                  userId,
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
                logger.log("Completion metrics:", {
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
              logger.error("error tracking usage:", error);
            }
          },
        });

        writer.merge(
          result.toUIMessageStream({
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
                  where: { id: conversationId, userId },
                  data: {
                    updatedAt: new Date(),
                    lastMessageAt: new Date(),
                  },
                });

                if (process.env.NODE_ENV === "development") {
                  logger.log("messages saved:", {
                    conversationId,
                    messagesSaved: allMessages.length,
                  });
                }
              } catch (error) {
                // Don't throw - we still want to return the response to the user
                logger.error("error saving messages:", error);
              }
            },
          })
        );
      },
    });

    return createUIMessageStreamResponse({ stream });
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
});
