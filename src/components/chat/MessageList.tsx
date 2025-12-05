"use client";

import { ChatState, ChatStatus, UIMessage } from "ai";
import {
  Sparkles,
  Loader2,
  Loader,
  CopyIcon,
  RefreshCcwIcon,
  Check,
} from "lucide-react";
import { forwardRef, Fragment, useState } from "react";
import { Streamdown } from "streamdown";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
  MessageAttachment,
} from "../ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "../ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "../ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "../ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "../ai-elements/tool";
import { cn, isDevelopment } from "@/lib/utils";

interface MessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  isLoadingMessages?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, status, isLoadingMessages = false }, ref) => {
    const isLoading = status === "submitted" || status === "streaming";
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const handleCopy = (text: string, messageId: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    };

    // Helper to parse reasoning text into steps
    function parseReasoningIntoSteps(text: string): Array<{ label: string; content?: string }> {
      // Try to detect different formatting patterns
      const steps: Array<{ label: string; content?: string }> = [];

      // Pattern 1: Numbered steps (1. , 2. , 3. , etc.)
      const numberedPattern = /^\d+\.\s+(.+?)(?=\n\d+\.\s+|\n*$)/gm;
      const numberedMatches = Array.from(text.matchAll(numberedPattern));

      if (numberedMatches.length > 0) {
        numberedMatches.forEach((match) => {
          const content = match[1].trim();
          const [firstLine, ...rest] = content.split('\n');
          steps.push({
            label: firstLine,
            content: rest.length > 0 ? rest.join('\n').trim() : undefined,
          });
        });
        return steps;
      }

      // Pattern 2: Bullet points (- or * or •)
      const bulletPattern = /^[\-\*•]\s+(.+?)(?=\n[\-\*•]\s+|\n*$)/gm;
      const bulletMatches = Array.from(text.matchAll(bulletPattern));

      if (bulletMatches.length > 0) {
        bulletMatches.forEach((match) => {
          const content = match[1].trim();
          const [firstLine, ...rest] = content.split('\n');
          steps.push({
            label: firstLine,
            content: rest.length > 0 ? rest.join('\n').trim() : undefined,
          });
        });
        return steps;
      }

      // Pattern 3: Paragraphs (separated by double newlines)
      const paragraphs = text.split(/\n\n+/).filter((p: string) => p.trim().length > 0);

      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph: string) => {
          const trimmed = paragraph.trim();
          const [firstLine, ...rest] = trimmed.split('\n');
          steps.push({
            label: firstLine.length > 100 ? firstLine.slice(0, 100) + '...' : firstLine,
            content: rest.length > 0 ? rest.join('\n').trim() : (firstLine.length > 100 ? firstLine : undefined),
          });
        });
        return steps;
      }

      // Fallback: Single step with the entire text
      const preview = text.length > 100 ? text.slice(0, 100) + '...' : text;
      return [{ label: preview, content: text.length > 100 ? text : undefined }];
    }

    // Helper to group consecutive text and source-url parts together
    function groupMessageParts(parts: UIMessage["parts"]) {
      const groups: Array<{
        type: "reasoning" | "text" | "source-url" | "tool" | "other";
        parts: typeof parts;
      }> = [];

      let currentTextGroup: typeof parts = [];
      let currentSourceGroup: typeof parts = [];

      parts.forEach((part) => {
        if (part.type === "text" && part.text) {
          // Flush accumulated source parts
          if (currentSourceGroup.length > 0) {
            groups.push({ type: "source-url", parts: currentSourceGroup });
            currentSourceGroup = [];
          }
          currentTextGroup.push(part);
        } else if (part.type === "source-url") {
          // Flush accumulated text parts
          if (currentTextGroup.length > 0) {
            groups.push({ type: "text", parts: currentTextGroup });
            currentTextGroup = [];
          }
          currentSourceGroup.push(part);
        } else {
          // Flush accumulated text parts
          if (currentTextGroup.length > 0) {
            groups.push({ type: "text", parts: currentTextGroup });
            currentTextGroup = [];
          }
          // Flush accumulated source parts
          if (currentSourceGroup.length > 0) {
            groups.push({ type: "source-url", parts: currentSourceGroup });
            currentSourceGroup = [];
          }

          // Add non-text/non-source part as its own group
          if (part.type === "reasoning" && part.text) {
            groups.push({ type: "reasoning", parts: [part] });
          } else if (part.type.startsWith("tool-")) {
            // Tool calls (tool-{toolName})
            groups.push({ type: "tool", parts: [part] });
          } else {
            groups.push({ type: "other", parts: [part] });
          }
        }
      });

      // Flush any remaining text parts
      if (currentTextGroup.length > 0) {
        groups.push({ type: "text", parts: currentTextGroup });
      }
      // Flush any remaining source parts
      if (currentSourceGroup.length > 0) {
        groups.push({ type: "source-url", parts: currentSourceGroup });
      }

      return groups;
    }

    function renderMessageContent(
      message: UIMessage,
      isLastMessage: boolean,
      isLoading: boolean
    ) {
      const groups = groupMessageParts(message.parts);
      const allText = message.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p: any) => p.text)
        .join("");

      // Check if we have reasoning or tool calls to show in a timeline
      const hasReasoningOrTools = groups.some(
        (g) => g.type === "reasoning" || g.type === "tool"
      );

      // Collect all reasoning and tool items for a unified timeline
      const timelineItems: Array<{
        type: "reasoning-step" | "tool";
        key: string;
        data: any;
      }> = [];

      groups.forEach((group, groupIndex) => {
        if (group.type === "reasoning") {
          const part = group.parts[0] as any;
          const reasoningText = part.text || "";
          const steps = parseReasoningIntoSteps(reasoningText);
          steps.forEach((step, stepIndex) => {
            timelineItems.push({
              type: "reasoning-step",
              key: `reasoning-${groupIndex}-${stepIndex}`,
              data: step,
            });
          });
        } else if (group.type === "tool") {
          const part = group.parts[0] as any;
          timelineItems.push({
            type: "tool",
            key: `tool-${groupIndex}`,
            data: part,
          });
        }
      });

      return (
        <div className="flex flex-col gap-3 w-full">
          {/* Unified timeline for reasoning and tools */}
          {hasReasoningOrTools && timelineItems.length > 0 && (
            <ChainOfThought className="w-full" defaultOpen={true}>
              <ChainOfThoughtHeader>
                {isLoading && isLastMessage
                  ? "Thinking..."
                  : `Agent Timeline (${timelineItems.length} step${timelineItems.length !== 1 ? 's' : ''})`}
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {timelineItems.map((item, index) => {
                  const isLastItem = index === timelineItems.length - 1;
                  const isStreaming = isLoading && isLastMessage && isLastItem;

                  if (item.type === "reasoning-step") {
                    return (
                      <ChainOfThoughtStep
                        key={`${message.id}-${item.key}`}
                        label={`💭 ${item.data.label}`}
                        status={isStreaming ? "active" : "complete"}
                      >
                        {item.data.content && (
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.data.content}
                          </div>
                        )}
                      </ChainOfThoughtStep>
                    );
                  }

                  if (item.type === "tool") {
                    const toolPart = item.data;
                    const toolName = toolPart.type.replace("tool-", "");
                    const hasOutput =
                      toolPart.state === "output-available" ||
                      toolPart.state === "output-error";
                    const statusIcon =
                      toolPart.state === "output-available"
                        ? "✅"
                        : toolPart.state === "output-error"
                        ? "❌"
                        : "⚙️";

                    return (
                      <ChainOfThoughtStep
                        key={`${message.id}-${item.key}`}
                        label={`${statusIcon} Tool: ${toolName}`}
                        description={
                          toolPart.state === "input-streaming"
                            ? "Preparing..."
                            : toolPart.state === "input-available"
                            ? "Executing..."
                            : toolPart.state === "output-error"
                            ? "Failed"
                            : "Completed"
                        }
                        status={
                          hasOutput
                            ? "complete"
                            : isStreaming
                            ? "active"
                            : "pending"
                        }
                      >
                        {toolPart.input && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                              Input
                            </div>
                            <div className="rounded-md bg-muted/50 p-2 text-xs overflow-x-auto">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(toolPart.input, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {hasOutput && (toolPart.output || toolPart.errorText) && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                              {toolPart.errorText ? "Error" : "Output"}
                            </div>
                            <div
                              className={`rounded-md p-2 text-xs overflow-x-auto ${
                                toolPart.errorText
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted/50"
                              }`}
                            >
                              <pre className="whitespace-pre-wrap break-words">
                                {toolPart.errorText ||
                                  (typeof toolPart.output === "string"
                                    ? toolPart.output
                                    : JSON.stringify(toolPart.output, null, 2))}
                              </pre>
                            </div>
                          </div>
                        )}
                      </ChainOfThoughtStep>
                    );
                  }

                  return null;
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          )}

          {/* Render non-reasoning, non-tool groups */}
          {groups.map((group, groupIndex) => {
            const isLastGroup = groupIndex === groups.length - 1;

            // Skip reasoning and tool - already rendered in timeline
            if (group.type === "reasoning" || group.type === "tool") {
              return null;
            }

            if (group.type === "text") {
              const textContent = group.parts
                .map((p: any) => p.text)
                .join("");

              return (
                <div key={`${message.id}-text-${groupIndex}`}>
                  <Message
                    className={cn("max-w-[90%]")}
                    from={message.role}
                  >
                    <MessageContent className="text-md">
                      <MessageResponse>{textContent}</MessageResponse>
                    </MessageContent>

                    {/* Show loader below text during streaming */}
                    {isLoading &&
                      isLastMessage &&
                      isLastGroup &&
                      textContent.trim() && (
                        <div className="flex mt-4">
                          <Loader
                            size={16}
                            className="animate-spin animation-duration-[1.3s]"
                          />
                        </div>
                      )}
                  </Message>
                </div>
              );
            }

            if (group.type === "source-url") {
              return (
                <Sources key={`${message.id}-sources-${groupIndex}`}>
                  <SourcesTrigger count={group.parts.length} />
                  <SourcesContent>
                    {group.parts.map((part: any, partIndex) => (
                      <Source
                        key={`${message.id}-source-${groupIndex}-${partIndex}`}
                        href={part.url}
                        title={part.title}
                      />
                    ))}
                  </SourcesContent>
                </Sources>
              );
            }

            return null;
          })}

          {/* Show initial loader if no content yet */}
          {isLoading && isLastMessage && groups.length === 0 && (
            <div className="flex items-center mt-1">
              <Loader
                size={24}
                className="animate-spin animation-duration-[1.3s]"
              />
            </div>
          )}

          {/* Show copy action once complete - only after last text group */}
          {!isLoading && allText && (
            <MessageActions className="ml-auto">
              <MessageAction
                onClick={() => handleCopy(allText, message.id)}
                label={copiedMessageId === message.id ? "Copied" : "Copy"}
              >
                {copiedMessageId === message.id ? (
                  <Check className="size-3" />
                ) : (
                  <CopyIcon className="size-3" />
                )}
              </MessageAction>
            </MessageActions>
          )}

          {/* Reminder note - only show on last message */}
          {isLastMessage && (
            <div className="ml-auto">
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                Nira can make mistakes. Check important info.
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col overflow-hidden size-full h-screen">
        {/* scroll */}
        <div ref={ref} className="h-full overflow-y-auto">
          {/* conversation */}
          <div className="max-w-4xl mx-auto p-6 h-full">
            <Conversation className="">
              <ConversationContent>
                {/* empty */}
                {messages.length === 0 && !isLoadingMessages && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                    <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    <div>
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Start a new conversation
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ask me anything...
                      </p>
                    </div>
                  </div>
                )}

                {/* isloading */}
                {isLoadingMessages && !messages.length && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                    <Loader2 className="h-12 w-12 text-gray-300 dark:text-gray-700 animate-spin" />
                    <div>
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Loading messages...
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please wait
                      </p>
                    </div>
                  </div>
                )}

                {/* messages */}
                {messages.map((message, msgIndex) => (
                  <div key={message.id}>
                    {/* User message - with attachments above */}
                    {message.role === "user" && (
                      <div className="flex flex-col items-end mb-6">
                        {/* Render file attachments above */}
                        {message.parts.some((part) => part.type === "file") && (
                          <div className="flex flex-wrap gap-2 mb-2 max-w-[75%]">
                            {message.parts
                              .filter((part) => part.type === "file")
                              .map((part: any, i) => (
                                <MessageAttachment
                                  key={`${message.id}-file-${i}`}
                                  data={part}
                                />
                              ))}
                          </div>
                        )}

                        {/* Render text content below */}
                        {message.parts.some(
                          (part) => part.type === "text" && part.text
                        ) && (
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 max-w-[75%]">
                            <p className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                              {message.parts
                                .filter((part) => part.type === "text")
                                .map((part: any, i) => (
                                  <span key={i}>{part.text}</span>
                                ))}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* assistant message */}
                    {message.role === "assistant" && (
                      <div className="flex flex-col mb-6">
                        {/* message */}
                        <div className="flex gap-3">
                          {/* left - icon */}
                          <div className="shrink-0 mt-0.5">
                            <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* right - text content */}
                          <div className="flex-1 flex-col w-full">
                            {renderMessageContent(
                              message,
                              msgIndex == messages.length - 1,
                              isLoading
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show loading placeholder if waiting for assistant response */}
                {isLoading &&
                  (messages.length === 0 ||
                   messages[messages.length - 1]?.role === "user") && (
                  <div className="flex flex-col mb-6">
                    <div className="flex gap-3">
                      {/* left - icon */}
                      <div className="shrink-0 mt-0.5">
                        <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* right - loading indicator */}
                      <div className="flex-1 flex-col w-full">
                        <div className="flex items-center mt-1">
                          <Loader
                            size={24}
                            className="animate-spin animation-duration-[1.3s]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ConversationContent>
            </Conversation>
          </div>
        </div>
      </div>
    );
  }
);
