"use client";

import { UIMessage } from "ai";
import { Sparkles, Loader2 } from "lucide-react";
import { forwardRef } from "react";

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isLoading }, ref) => {
    return (
      <div className="flex-1 overflow-hidden">
        <div ref={ref} className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
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
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === "user" ? (
                      // User message - with bubble
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
                    ) : (
                      // AI message - clean without bubble
                      <div className="flex gap-3 mb-6">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 pt-0.5">
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
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 mb-6">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageList.displayName = "MessageList";
