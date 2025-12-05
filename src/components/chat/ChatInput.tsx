"use client";

import { ChatStatus } from "ai";
import { Loader2, ArrowUp, GlobeIcon } from "lucide-react";
import { useRef, useEffect, FormEvent, useState } from "react";
import { ModelSelectorInline } from "./ModelSelectorInline";
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
  PromptInputSubmit,
  PromptInputMessage,
} from "../ai-elements/prompt-input";
import { useConversations } from "@/contexts/ConversationsContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
    options: { useWebSearch: boolean }
  ) => void | Promise<void>;
  status: ChatStatus;
  isCreatingConversation: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  conversationId: string;
  isNewChat: boolean;
  initialWebSearch?: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  status,
  isCreatingConversation,
  selectedModel,
  onModelChange,
  conversationId,
  isNewChat,
  initialWebSearch = false,
}: ChatInputProps) {
  // ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Internal state for web search
  const [useWebSearch, setUseWebSearch] = useState(initialWebSearch);
  const isInitialMount = useRef(true);

  // Get updateConversation from context
  const { updateConversation } = useConversations();

  // Mutation for updating web search setting
  const { mutate: updateWebSearch } = useMutation({
    mutationFn: async (webSearch: boolean) => {
      return updateConversation(conversationId, { webSearch });
    },
    onError: (error) => {
      toast.error(`Failed to update web search setting: ${error}`);
      // reset
      setUseWebSearch((prev) => !prev);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Sync internal state with initialWebSearch prop when it changes
  useEffect(() => {
    setUseWebSearch(initialWebSearch);
  }, [initialWebSearch]);

  // Update conversation when web search is toggled (not on mount)
  useEffect(() => {
    // Skip the first render (mount)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only update when toggled and not a new chat
    if (!isNewChat && conversationId) {
      updateWebSearch(useWebSearch);
    }
  }, [useWebSearch, conversationId, isNewChat, updateWebSearch]);

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
          onSubmit={(message, event) =>
            onSubmit(message, event, { useWebSearch })
          }
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
              disabled={isLoading || isCreatingConversation}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between">
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger disabled={isLoading || isCreatingConversation} />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

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

              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant={useWebSearch ? "default" : "ghost"}
                disabled={isLoading || isCreatingConversation}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>

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
      </div>
    </div>
  );
}
