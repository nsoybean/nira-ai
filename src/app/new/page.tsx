"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useMemo, useCallback } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatSubmit } from "@/hooks/useChatSubmit";
import { useChatSidebar } from "@/hooks/useChatSidebar";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { getRandomGreeting } from "@/data/greetings";
import { Button } from "@/components/ui/button";
import { HamburgerIcon, PanelLeftIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/contexts/AuthContext";

export default function NewChatPage() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [initialWebSearch, setInitialWebSearch] = useState(false);
  const [initialExtendedThinking, setInitialExtendedThinking] = useState(false);
  const isMobile = useIsMobile();
  const { data: session, isPending: isAuthPending } = useSession();

  // Sidebar logic
  const {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    isLoadingConversations,
    handleNewChat,
    handleDelete,
    handleClearAll,
    handleRename,
  } = useChatSidebar("new");

  // Memoize transport to prevent re-creating on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // send only last message with model info
        prepareSendMessagesRequest({ messages, id, body }) {
          return {
            body: {
              message: messages[messages.length - 1],
              id,
              conversationId: body?.conversationId,
              modelId: body?.modelId,
            },
          };
        },
      }),
    []
  );

  const { messages, status, sendMessage } = useChat({
    experimental_throttle: 50, // to make streaming smoother
    transport,
  });

  // chat
  const { handleSubmit: submitChat, isCreatingConversation } = useChatSubmit({
    isNewChat: true,
    conversationId: "new",
    sendMessage,
    selectedModel,
  });

  const handleSubmit = useCallback(
    async (
      message: { text: string; files?: any[] },
      settings: { useWebSearch: boolean; useExtendedThinking: boolean }
    ) => {
      if (status === "streaming" || status === "submitted") {
        return;
      }

      // Pass both text and files to submitChat with settings
      await submitChat(message.text, message.files || [], setInput, {
        useWebsearch: settings.useWebSearch,
        useExtendedThinking: settings.useExtendedThinking,
      });
    },
    [status, submitChat, setInput]
  );

  // Get a random greeting on component mount (lazy initialization ensures it only runs once)
  const [randomGreeting] = useState(() => getRandomGreeting());

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId="new"
        onNewChat={handleNewChat}
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onRename={handleRename}
      />

      <div className="flex-1 flex flex-col">
        {/* Centered layout for new chat */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Toggle sidebar button */}
          {!sidebarOpen && (
            <Button
              variant={"ghost"}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSidebarOpen(true)}
            >
              {isMobile ? (
                <HamburgerIcon size={10} />
              ) : (
                <PanelLeftIcon size={10} />
              )}
            </Button>
          )}

          {/* Nira AI Branding (for unauthenticated users) */}
          {!isAuthPending && !session && (
            <div className="text-center mb-3">
              <h1 className="font-rem text-6xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">
                NIRA AI
              </h1>
            </div>
          )}

          {/* Greeting (only for authenticated users) */}
          {!isAuthPending && session && (
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                {randomGreeting.title}
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {randomGreeting.subtitle}
              </p>
            </div>
          )}

          {/* Centered input */}
          <div className="w-full max-w-3xl">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={(message, event, settings) => {
                handleSubmit(message, settings);
              }}
              status={status}
              isCreatingConversation={isCreatingConversation}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              conversationId="new"
              isNewChat={true}
              initialWebSearch={initialWebSearch}
              initialExtendedThinking={initialExtendedThinking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
