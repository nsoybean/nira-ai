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

    function renderMessage(
      message: UIMessage,
      isLastMessage: boolean,
      isLoading: boolean
    ) {
      const textAcc = message.parts.reduce((acc, part) => {
        if (part.type === "text" && part.text) {
          acc += part.text;
        }
        return acc;
      }, "");

      if (isLoading && isLastMessage) {
        return (
          <div className="flex items-center mt-1">
            <Loader
              size={24}
              className="animate-spin animation-duration-[1.3s]"
            />
          </div>
        );
      }

      return (
        <Message
          className={cn("max-w-[90%]")}
          key={`${message.id}`}
          from={message.role}
        >
          <MessageContent className="text-md">
            <MessageResponse>{textAcc}</MessageResponse>
          </MessageContent>

          {/* Show loader below text during streaming */}
          {isLoading && isLastMessage && textAcc.trim() && (
            <div className="flex mt-4">
              <Loader
                size={16}
                className="animate-spin animation-duration-[1.3s]"
              />
            </div>
          )}

          {/* show message action once streams complete */}
          {!isLoading && (
            <MessageActions className="ml-auto">
              <MessageAction
                onClick={() => handleCopy(textAcc, message.id)}
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

          {/* reminder note - only show on last text part of last message */}
          {isLastMessage && (
            <div className="ml-auto">
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                Nira can make mistakes. Check important info.
              </p>
            </div>
          )}
        </Message>
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
                        {/* reasoning */}
                        {message.parts.some(
                          (part) => part.type === "reasoning" && part.text
                        ) && (
                          <div className="mb-3">
                            {message.parts.map((part, partIndex) => {
                              if (part.type === "reasoning" && part.text) {
                                return (
                                  <Reasoning
                                    key={`${message.id}-reasoning-${partIndex}`}
                                    className="w-full"
                                    isStreaming={
                                      status === "streaming" &&
                                      partIndex === message.parts.length - 1 &&
                                      message.id === messages.at(-1)?.id
                                    }
                                  >
                                    <ReasoningTrigger />
                                    <ReasoningContent>
                                      {part.text}
                                    </ReasoningContent>
                                  </Reasoning>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}

                        {/* sources */}
                        {message.role === "assistant" &&
                          message.parts.filter(
                            (part) => part.type === "source-url"
                          ).length > 0 && (
                            <Sources>
                              <SourcesTrigger
                                count={
                                  message.parts.filter(
                                    (part) => part.type === "source-url"
                                  ).length
                                }
                              />
                              {message.parts.map((part, i) => {
                                switch (part.type) {
                                  case "source-url":
                                    return (
                                      <SourcesContent
                                        key={`${message.id}-${i}`}
                                      >
                                        <Source
                                          key={`${message.id}-${i}`}
                                          href={part.url}
                                          title={part.url}
                                        />
                                      </SourcesContent>
                                    );
                                  default:
                                    return null;
                                }
                              })}
                            </Sources>
                          )}

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
                            {renderMessage(
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
              </ConversationContent>
            </Conversation>
          </div>
        </div>
      </div>
    );
  }
);
