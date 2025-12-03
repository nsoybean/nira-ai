"use client";

import { ChatState, ChatStatus, UIMessage } from "ai";
import {
  Sparkles,
  Loader2,
  Loader,
  CopyIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { forwardRef } from "react";
import { Streamdown } from "streamdown";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
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

interface MessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  isLoadingMessages?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, status, isLoadingMessages = false }, ref) => {
    const isLoading = status === "submitted" || status === "streaming";

    return (
      <div className="flex flex-col overflow-hidden size-full h-screen">
        {/* scroll */}
        <div ref={ref} className="h-full overflow-y-auto">
          {/* conversation */}
          <div className="max-w-4xl mx-auto p-6">
            <>
              <Conversation className="h-full">
                <ConversationContent>
                  {/* empty messages, tmp commented out, see if ai element handle this out of box */}
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

                  {/* isloading, tmp commented out, see if ai element handle this out of box */}
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
                      {/* User message - with bubble */}
                      {message.role === "user" && (
                        <div className="flex justify-end mb-6">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 max-w-[75%]">
                            <p className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                              {message.parts
                                .filter((part) => part.type === "text")
                                .map((part: any, i) => (
                                  <span key={i}>{part.text}</span>
                                ))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* assistant message */}
                      {message.role === "assistant" && (
                        <div className="flex flex-col mb-6">
                          {/* reasoning at the top, above everything */}
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
                                        partIndex ===
                                          message.parts.length - 1 &&
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

                          {/* main message content with icon */}
                          <div className="flex gap-3">
                            {/* left - icon */}
                            <div className="shrink-0 mt-0.5">
                              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                            </div>

                            {/* right - content */}
                            <div className="flex-1 flex-col w-full">
                              {/* Show loader beside icon before streaming starts */}
                              {isLoading &&
                                msgIndex === messages.length - 1 &&
                                message.parts.every(
                                  (part) =>
                                    part.type !== "text" ||
                                    !part.text ||
                                    part.text.trim() === ""
                                ) && (
                                  <div className="flex items-center mt-1">
                                    <Loader
                                      size={24}
                                      className="animate-spin animation-duration-[1.3s]"
                                    />
                                  </div>
                                )}

                              {message.parts.map((part, partIndex) => {
                                switch (part.type) {
                                  case "reasoning":
                                    // Skip rendering here - reasoning is rendered above
                                    return null;

                                  case "text":
                                    // Skip rendering text part if it's empty and we're loading
                                    if (
                                      (!part.text || part.text.trim() === "") &&
                                      isLoading &&
                                      msgIndex === messages.length - 1
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <Message
                                        className="max-w-[90%]"
                                        key={`${message.id}-${partIndex}`}
                                        from={message.role}
                                      >
                                        <MessageContent className="text-md">
                                          <MessageResponse>
                                            {part.text}
                                          </MessageResponse>
                                        </MessageContent>

                                        {/* Show loader below text during streaming */}
                                        {isLoading &&
                                          msgIndex === messages.length - 1 &&
                                          part.text &&
                                          part.text.trim() !== "" && (
                                            <div className="flex mt-4">
                                              <Loader
                                                size={16}
                                                className="animate-spin animation-duration-[1.3s]"
                                              />
                                            </div>
                                          )}

                                        {/* show message action once streams complete */}
                                        {!isLoading && (
                                          <MessageActions>
                                            {/* tmp comment out regenerate */}
                                            {/* <MessageAction
                                          onClick={() => {}}
                                          label="Retry"
                                        >
                                          <RefreshCcwIcon className="size-3" />
                                        </MessageAction> */}
                                            <MessageAction
                                              onClick={() =>
                                                navigator.clipboard.writeText(
                                                  part.text
                                                )
                                              }
                                              label="Copy"
                                            >
                                              <CopyIcon className="size-3" />
                                            </MessageAction>
                                          </MessageActions>
                                        )}
                                      </Message>
                                    );

                                  default:
                                    return null;
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </ConversationContent>
              </Conversation>
            </>
          </div>
        </div>
      </div>
    );
  }
);
