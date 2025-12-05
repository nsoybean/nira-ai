"use client";

import { ChatStatus } from "ai";
import { Loader2, ArrowUp, Settings2 } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

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
  initialExtendedThinking?: boolean;
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
  initialExtendedThinking = false,
}: ChatInputProps) {
  // ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Internal state for settings
  const [useWebSearch, setUseWebSearch] = useState(initialWebSearch);
  const [useExtendedThinking, setUseExtendedThinking] = useState(initialExtendedThinking);
  const isInitialMount = useRef(true);
  const isInitialMountThinking = useRef(true);

  // Store pending files during conversation creation
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);

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

  // Mutation for updating extended thinking setting
  const { mutate: updateExtendedThinking } = useMutation({
    mutationFn: async (extendedThinking: boolean) => {
      return updateConversation(conversationId, {
        settings: { extendedThinking },
      });
    },
    onError: (error) => {
      toast.error(`Failed to update extended thinking setting: ${error}`);
      // reset
      setUseExtendedThinking((prev) => !prev);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Sync internal state with initialWebSearch prop when it changes
  useEffect(() => {
    setUseWebSearch(initialWebSearch);
  }, [initialWebSearch]);

  // Sync internal state with initialExtendedThinking prop when it changes
  useEffect(() => {
    setUseExtendedThinking(initialExtendedThinking);
  }, [initialExtendedThinking]);

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

  // Update conversation when extended thinking is toggled (not on mount)
  useEffect(() => {
    // Skip the first render (mount)
    if (isInitialMountThinking.current) {
      isInitialMountThinking.current = false;
      return;
    }

    // Only update when toggled and not a new chat
    if (!isNewChat && conversationId) {
      updateExtendedThinking(useExtendedThinking);
    }
  }, [useExtendedThinking, conversationId, isNewChat, updateExtendedThinking]);

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

  // Clear pending files when navigating away (conversationId changes) or chat is no longer new
  useEffect(() => {
    if (!isNewChat && pendingFiles.length > 0) {
      setPendingFiles([]);
    }
  }, [isNewChat, conversationId, pendingFiles.length]);

  // Wrapper for onSubmit to capture files during conversation creation
  const handleSubmit = (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
    // If creating a new conversation, store the files
    if (isNewChat && message.files && message.files.length > 0) {
      setPendingFiles(message.files);
    }

    onSubmit(message, event, { useWebSearch });
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl"
          globalDrop
          multiple
          accept="image/*"
        >
          {/* header */}
          <PromptInputHeader className="rounded-2xl">
            {/* Show pending files during conversation creation */}
            {isCreatingConversation && pendingFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-2">
                {pendingFiles.map((file, index) => (
                  <PromptInputAttachment key={index} data={file} />
                ))}
              </div>
            ) : (
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            )}
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

              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <PromptInputButton
                    variant={(useWebSearch || useExtendedThinking) ? "default" : "ghost"}
                    type="button"
                  >
                    <Settings2 size={16} />
                    <span>Settings</span>
                  </PromptInputButton>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Chat Settings</h4>
                      <p className="text-xs text-muted-foreground">
                        Configure settings for this conversation
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Web Search Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">
                            Web Search
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Search the web for answers
                          </p>
                        </div>
                        <Switch
                          checked={useWebSearch}
                          onCheckedChange={setUseWebSearch}
                          disabled={isLoading || isCreatingConversation}
                        />
                      </div>

                      {/* Extended Thinking Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">
                            Extended Thinking
                          </label>
                          <p className="text-xs text-muted-foreground">
                            More thinking tokens (10k vs 2k)
                          </p>
                        </div>
                        <Switch
                          checked={useExtendedThinking}
                          onCheckedChange={setUseExtendedThinking}
                          disabled={isLoading || isCreatingConversation}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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
