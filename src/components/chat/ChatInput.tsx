"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatStatus } from "ai";
import {
  Loader2,
  Paperclip,
  Image as ImageIcon,
  BookOpen,
  ArrowUp,
} from "lucide-react";
import { useRef, useEffect } from "react";
import { ModelSelectorInline } from "./ModelSelectorInline";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: ChatStatus;
  isCreatingConversation: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  status,
  isCreatingConversation,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const isLoading = status === "submitted" || status === "streaming";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Auto-focus input on mount and after message is sent
  useEffect(() => {
    if (textareaRef.current && !isLoading && !isCreatingConversation) {
      textareaRef.current.focus();
    }
  }, [isLoading, isCreatingConversation]);

  // Focus input when input is cleared (after sending message)
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form onSubmit={onSubmit} className="relative">
          {/* Input Container */}
          <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow focus-within:border-gray-300 dark:focus-within:border-gray-600 overflow-hidden">
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              rows={1}
              autoFocus
              className="w-full resize-none bg-transparent border-0 px-4 pt-4 pb-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-48 overflow-y-auto shadow-none"
              style={{ minHeight: "52px" }}
            />

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between px-3 pb-3 bg-white dark:bg-input/30">
              {/* Left Side Actions */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add image</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Prompt Library</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Right Side - Model Selector and Submit Button */}
              <div className="flex items-center gap-2">
                <ModelSelectorInline
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  disabled={isLoading || isCreatingConversation}
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={
                        isLoading || isCreatingConversation || !input.trim()
                      }
                      size="icon"
                      className="h-8 w-8 rounded-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white dark:text-gray-900 transition-all"
                    >
                      {isLoading || isCreatingConversation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isCreatingConversation
                        ? "Creating chat..."
                        : "Send message"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Text */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
          Lume can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
