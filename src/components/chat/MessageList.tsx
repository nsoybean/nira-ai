"use client";

import { ChatState, ChatStatus, UIMessage } from "ai";
import {
  Sparkles,
  Loader2,
  Loader,
  CopyIcon,
  RefreshCcwIcon,
  Check,
  GlobeIcon,
  BookIcon,
  CrossIcon,
  ChevronDownIcon,
  XIcon,
  BrainIcon,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

    function renderMessageContent(
      message: UIMessage,
      isLastMessage: boolean,
      isLoading: boolean
    ) {
      const allText = message.parts
        .filter((p) => p.type === "text" && p.text)
        .map((p: any) => p.text)
        .join("");

      // Check if message has any reasoning or tool parts that need timeline
      const hasTimelineParts = message.parts.some(
        (p) =>
          p.type === "reasoning" ||
          p.type === "tool-webSearch" ||
          p.type === "tool-webExtract" ||
          p.type === "step-start"
      );

      const textParts = message.parts.filter(
        (p) => p.type === "text" && p.text
      );

      return (
        <div className="flex flex-col w-full gap-4">
          {/* Timeline - wrap all reasoning and tools in single ChainOfThought */}
          {hasTimelineParts && (
            <div className="w-full space-y-2">
              {message.parts.map((part: any, partIndex) => {
                const isLastPart = partIndex === message.parts.length - 1;
                const isStreaming =
                  status === "streaming" && isLastPart && isLastMessage;

                // Reasoning step
                if (part.type === "reasoning" && part.text) {
                  return (
                    <Collapsible
                      key={`${message.id}-reasoning-${partIndex}`}
                      defaultOpen={true}
                      open={isStreaming ? isStreaming && isLastPart : undefined}
                    >
                      <div className="flex gap-2 text-sm">
                        <div className="relative mt-0.5">
                          <div className="size-4 flex items-center justify-center">
                            {/* <div
                              className={cn(
                                "size-2 rounded-full",
                                isStreaming
                                  ? "bg-blue-500 animate-pulse"
                                  : "bg-gray-400"
                              )}
                            /> */}
                            <BrainIcon className="size-4" />
                          </div>
                          {!isLastPart && (
                            <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2 pb-2">
                          <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
                            <span className="font-medium text-sm">
                              Reasoning
                            </span>
                            <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="relative max-h-[400px] overflow-y-auto">
                              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pr-2">
                                {part.text}
                              </div>
                              {/* Fade gradient at bottom */}
                              <div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  );
                }

                // Web search tool step
                if (part.type === "tool-webSearch") {
                  const output = part?.output;
                  const input = part?.input;
                  const resultsCount = output?.results?.length || 0;
                  const query = input?.query;
                  const isToolLoading = !output?.results;

                  return (
                    <Collapsible
                      key={`${message.id}-websearch-${partIndex}`}
                      defaultOpen={false}
                    >
                      <div className="flex gap-2 text-sm">
                        <div className="relative mt-0.5">
                          <GlobeIcon className="size-4" />
                          {!isLastPart && (
                            <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2 pb-2">
                          <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
                            <span className="font-medium text-sm flex-1 text-left">
                              {query || "Web search"}
                            </span>
                            {resultsCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {resultsCount} result
                                {resultsCount > 1 ? "s" : ""}
                              </span>
                            )}
                            <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {output?.results && (
                              <div className="relative max-h-[220px] overflow-y-auto">
                                <div className="pr-2">
                                  {output.results.map(
                                    (result: any, i: number) => {
                                      let domain = "";
                                      try {
                                        const url = new URL(result.url);
                                        domain = url.hostname.replace(
                                          "www.",
                                          ""
                                        );
                                      } catch (e) {
                                        domain = result.url;
                                      }

                                      return (
                                        <a
                                          key={`${message.id}-websearch-result-${i}`}
                                          href={result.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-4 py-2 rounded transition-colors"
                                        >
                                          <div className="flex flex-row items-center gap-1 flex-1 min-w-0">
                                            <img
                                              src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
                                              alt={`${domain} logo`}
                                              className="size-4 rounded-sm shrink-0 bg-white"
                                            />
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                              {result.title || result.url}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              {domain}
                                            </div>

                                            {/* remove verbose content */}
                                            {/* {result.content && (
                                              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {result.content}
                                              </div>
                                            )} */}
                                          </div>
                                        </a>
                                      );
                                    }
                                  )}
                                </div>
                                {/* Fade gradient at bottom */}
                                <div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  );
                }

                // Web extract tool step
                if (part.type === "tool-webExtract") {
                  const input = part?.input;
                  const numUrls = input?.urls?.length || 0;
                  const output = part?.output;
                  const successCount = output?.results?.length || 0;
                  const failCount = output?.failedResults?.length || 0;
                  const isToolLoading = output?.responseTime === undefined;

                  return (
                    <Collapsible
                      key={`${message.id}-webextract-${partIndex}`}
                      defaultOpen={false}
                    >
                      <div className="flex gap-2 text-sm">
                        <div className="relative mt-0.5">
                          <BookIcon className="size-4" />
                          {!isLastPart && (
                            <div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2 pb-2">
                          <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
                            <span className="font-medium text-sm flex-1 text-left">
                              Reading {numUrls} page{numUrls > 1 ? "s" : ""}
                            </span>
                            {(successCount > 0 || failCount > 0) && (
                              <span className="text-xs text-muted-foreground">
                                {`${successCount} success ${
                                  failCount ? `, ${failCount} failed` : ""
                                }`.trim()}
                              </span>
                            )}
                            <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="relative max-h-[220px] overflow-y-auto">
                              <div className="pr-2">
                                {/* Success Results */}
                                {output?.results?.map(
                                  (result: any, i: number) => {
                                    let domain = "";
                                    try {
                                      const url = new URL(result.url);
                                      domain = url.hostname.replace("www.", "");
                                    } catch (e) {
                                      domain = result.url;
                                    }

                                    return (
                                      <a
                                        key={`${message.id}-extract-success-${i}`}
                                        href={result.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex flex-row items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-4 py-2 rounded transition-colors"
                                      >
                                        <img
                                          src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
                                          alt={`${domain} logo`}
                                          className="size-4 rounded-sm shrink-0 bg-white"
                                        />
                                        {/* dont need show check when succeed */}
                                        {/* <Check
                                          size={16}
                                          className="text-green-600 mt-0.5 shrink-0"
                                        /> */}
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[90%]">
                                            {result.url}
                                          </div>
                                        </div>
                                      </a>
                                    );
                                  }
                                )}

                                {/* Failed Results */}
                                {output?.failedResults?.map(
                                  (failed: any, i: number) => (
                                    <div
                                      key={`${message.id}-extract-fail-${i}`}
                                      className="flex items-start gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-2 rounded"
                                    >
                                      <XIcon
                                        size={16}
                                        className="text-red-400 mt-0.5 shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <a
                                          href={failed.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-sm text-gray-900 dark:text-gray-100 truncate block"
                                        >
                                          {failed.url}
                                        </a>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {failed.error}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                              {/* Fade gradient at bottom */}
                              <div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* Text content - render all text parts as messages */}
          {textParts.map((part: any, textIndex) => (
            <div key={`${message.id}-text-${textIndex}`}>
              <Message className={cn("max-w-[90%]")} from={message.role}>
                <MessageContent className="text-md">
                  <MessageResponse>{part.text}</MessageResponse>
                </MessageContent>
              </Message>
            </div>
          ))}

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
                {/* {messages.length === 0 && !isLoadingMessages && (
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
                )} */}

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
                                  className="border border-gray-200"
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

                    {/* Assistant message */}
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
                            {/* initial loader when no message parts */}
                            {isLoading &&
                              msgIndex == messages.length - 1 &&
                              message.parts.length === 0 && (
                                <div className="flex items-center mt-1">
                                  <Loader
                                    size={24}
                                    className="animate-spin animation-duration-[1.3s]"
                                  />
                                </div>
                              )}

                            {/* actual message content */}
                            {renderMessageContent(
                              message,
                              msgIndex == messages.length - 1,
                              isLoading
                            )}

                            {/* Show loader below text during streaming */}
                            {status === "streaming" &&
                              msgIndex === messages.length - 1 &&
                              message.parts.length > 0 && (
                                <div className="flex items-center mt-1">
                                  <Loader
                                    size={24}
                                    className="animate-spin animation-duration-[1.3s]"
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* 
                {isLoading && (
                  <div className="flex items-center mt-1">
                    <Loader
                      size={24}
                      className="animate-spin animation-duration-[1.3s]"
                    />
                  </div>
                )} */}
                {/* Show loading placeholder if waiting for assistant response */}
                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex flex-col mb-6">
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        </div>

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
