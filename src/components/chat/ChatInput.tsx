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
  GlobeIcon,
} from "lucide-react";
import { useRef, useEffect, FormEvent } from "react";
import { ModelSelectorInline } from "./ModelSelectorInline";
import { models } from "tokenlens";
import {
  PromptInput,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputButton,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSubmit,
  PromptInputMessage,
} from "../ai-elements/prompt-input";
import { AVAILABLE_MODELS } from "@/lib/models";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
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

  return (
    <div className="bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <PromptInput
          onSubmit={onSubmit}
          className="mt-4 rounded-2xl"
          globalDrop
          multiple
          accept="image/*"
        >
          {/* header */}
          <PromptInputHeader className="rounded-2xl">
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>

          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask me anything..."
              onChange={(e) => onInputChange(e.target.value)}
              value={input}
              autoFocus
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between">
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              {/* search, tmp commented out */}
              {/* <PromptInputButton variant={"ghost"} onClick={() => {}}>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton> */}

              {/* prompt library, tmo commented out */}
              {/* <Tooltip>
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
              </Tooltip> */}

              {/* model selection */}
              <ModelSelectorInline
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                disabled={isLoading || isCreatingConversation}
              />
            </PromptInputTools>

            {/* submit */}
            <PromptInputSubmit
              disabled={!input || !status}
              status={status}
              className="h-8 w-8 rounded-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white dark:text-gray-900 transition-all"
            >
              {isLoading || isCreatingConversation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </PromptInputSubmit>
          </PromptInputFooter>
        </PromptInput>
        {/* Footer Text */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
          Nira can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
