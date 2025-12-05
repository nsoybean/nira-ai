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

    // Helper to group consecutive text and source-url parts together
    function groupMessageParts(parts: UIMessage["parts"]) {
      const groups: Array<{
        type: "reasoning" | "text" | "source-url" | "other";
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

      return (
        <div className="flex flex-col gap-3 w-full">
          {groups.map((group, groupIndex) => {
            const isLastGroup = groupIndex === groups.length - 1;

            if (group.type === "reasoning") {
              const part = group.parts[0] as any;
              return (
                <Reasoning
                  key={`${message.id}-reasoning-${groupIndex}`}
                  className="w-full"
                  isStreaming={
                    status === "streaming" &&
                    isLastGroup &&
                    isLastMessage
                  }
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
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
