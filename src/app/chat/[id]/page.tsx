"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessageLoader } from "@/hooks/useMessageLoader";
import { useChatSubmit } from "@/hooks/useChatSubmit";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { useConversations } from "@/contexts/ConversationsContext";
import { toast } from "sonner";
import { getRandomGreeting } from "@/data/greetings";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const isNewChat = conversationId === "new";

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [initialWebSearch, setInitialWebSearch] = useState(false);
  const [initialExtendedThinking, setInitialExtendedThinking] = useState(false);

  const {
    deleteConversation,
    clearAllConversations,
    updateConversation,
    conversations,
    isLoadingConversations,
  } = useConversations();

  // Clear input when starting a new chat
  useEffect(() => {
    if (isNewChat) {
      setInput("");
    }
  }, [isNewChat]);

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

  const {
    messages,
    setMessages,
    status,
    sendMessage,
    error,
    stop,
    regenerate,
  } = useChat({
    id: conversationId || undefined,
    experimental_throttle: 50, // to make streaming smoother
    transport,
  });

  // conversation messages
  const { messages: loadedMessages, isLoadingMessages } = useMessageLoader(
    conversationId,
    isNewChat
  );

  // chat
  const { handleSubmit: submitChat, isCreatingConversation } = useChatSubmit({
    isNewChat,
    conversationId,
    sendMessage,
    selectedModel,
  });

  useEffect(() => {
    if (loadedMessages.length) {
      setMessages(loadedMessages);
    }
  }, [loadedMessages, setMessages]);

  // Load conversation details including model and title when viewing existing chat
  useEffect(() => {
    if (!isNewChat && conversationId) {
      fetch(`/api/conversations/${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.modelId) {
            setSelectedModel(data.modelId);
          }
          if (data.title) {
            setChatTitle(data.title);
          }
          if (data.websearch !== undefined) {
            setInitialWebSearch(data.websearch);
          }
          if (data.settings?.extendedThinking !== undefined) {
            setInitialExtendedThinking(data.settings.extendedThinking);
          }
        })
        .catch((error) => {
          console.error("Error loading conversation:", error);
        });
    }
  }, [conversationId, isNewChat]);

  // Send pending message after mounting from new chat creation
  // Use a ref to track if we've already processed the pending message
  const pendingMessageProcessedRef = useRef(false);

  useEffect(() => {
    // Only run for existing conversations (not "new")
    if (!isNewChat && !pendingMessageProcessedRef.current) {
      const pendingMessage = sessionStorage.getItem("pendingMessage");
      const pendingFilesStr = sessionStorage.getItem("pendingFiles");

      if (pendingMessage) {
        // Mark as processed
        pendingMessageProcessedRef.current = true;

        // Clear them immediately to prevent double-sending
        sessionStorage.removeItem("pendingMessage");
        sessionStorage.removeItem("pendingFiles");

        // Parse files if they exist
        const pendingFiles = pendingFilesStr ? JSON.parse(pendingFilesStr) : [];

        // Send the message after the component has fully mounted
        sendMessage(
          { text: pendingMessage, files: pendingFiles },
          { body: { conversationId } }
        );
      }
    }
  }, [isNewChat, conversationId, sendMessage]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Detect when user manually scrolls
  // useEffect(() => {
  //   const scrollArea = scrollAreaRef.current;
  //   if (!scrollArea) return;

  //   const handleScroll = () => {
  //     const { scrollTop, scrollHeight, clientHeight } = scrollArea;
  //     const isNearBottom = scrollHeight - scrollTop - clientHeight < 30; // Xpx threshold

  //     // Update auto-scroll preference based on scroll position
  //     shouldAutoScrollRef.current = isNearBottom;
  //   };

  //   scrollArea.addEventListener("scroll", handleScroll);
  //   return () => scrollArea.removeEventListener("scroll", handleScroll);
  // }, []);

  // Auto-scroll to bottom when messages change (only if user hasn't scrolled up)
  // useEffect(() => {
  //   if (scrollAreaRef.current && shouldAutoScrollRef.current) {
  //     scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  //   }
  // }, [messages]);

  const handleSubmit = useCallback(
    async (
      message: { text: string; files?: any[] },
      options: { useWebSearch: boolean }
    ) => {
      if (status === "streaming" || status === "submitted") {
        return;
      }

      // Pass both text and files to submitChat
      await submitChat(message.text, message.files || [], setInput, {
        useWebsearch: options.useWebSearch,
      });
    },
    [status, submitChat, setInput]
  );

  const handleNewChat = useCallback(() => {
    router.push("/chat/new");
  }, [router]);

  const handleDelete = useCallback(
    async (conversationId: string) => {
      const success = await deleteConversation(conversationId);

      if (success) {
        toast.success("Conversation deleted successfully");
        // If the deleted conversation is the current one, redirect to new chat
        if (conversationId === params.id) {
          router.push("/chat/new");
        }
      } else {
        toast.error("Failed to delete conversation");
      }

      return success;
    },
    [deleteConversation, params.id, router]
  );

  const handleClearAll = useCallback(async () => {
    const success = await clearAllConversations();

    if (success) {
      toast.success("All conversations cleared successfully");
      // Redirect to new chat after clearing all
      router.push("/chat/new");
    } else {
      toast.error("Failed to clear conversations");
    }

    return success;
  }, [clearAllConversations, router]);

  const handleRename = useCallback(
    async (conversationId: string, newTitle: string) => {
      const success = await updateConversation(conversationId, {
        title: newTitle,
      });

      if (success) {
        toast.success("Conversation renamed successfully");
        // Update the header title if we're renaming the current conversation
        if (conversationId === params.id) {
          setChatTitle(newTitle);
        }
      } else {
        toast.error("Failed to rename conversation");
      }

      return success;
    },
    [updateConversation, params.id]
  );

  // Keyboard shortcut to toggle sidebar (Cmd/Ctrl + .)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "." && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check if chat is empty (no messages and not loading)
  const isChatEmpty = messages.length === 0 && !isLoadingMessages;

  // Get a random greeting on component mount (lazy initialization ensures it only runs once)
  const [randomGreeting] = useState(() => getRandomGreeting());

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 border border-red-400">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={conversationId}
        onNewChat={handleNewChat}
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onRename={handleRename}
      />

      <div className="flex-1 flex flex-col">
        {/* Show header only when there are messages */}
        {!isChatEmpty && (
          <ChatHeader
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(true)}
            chatTitle={chatTitle}
            onTitleChange={setChatTitle}
            conversationId={conversationId}
            isNew={isNewChat}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        )}

        {/* Centered layout for empty chat */}
        {isChatEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Toggle sidebar button for empty state */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            )}

            {/* Greeting */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                {randomGreeting.title}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {randomGreeting.subtitle}
              </p>
            </div>

            {/* Centered input */}
            <div className="w-full max-w-3xl">
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSubmit={(message, event, options) => {
                  handleSubmit(message, options);
                }}
                status={status}
                isCreatingConversation={isCreatingConversation}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                conversationId={conversationId}
                isNewChat={isNewChat}
                initialWebSearch={initialWebSearch}
                initialExtendedThinking={initialExtendedThinking}
              />
            </div>
          </div>
        ) : (
          /* Standard layout with messages */
          <div className="flex-1 overflow-hidden border border-green-400">
            <div className="max-w-4xl mx-auto p-6 relative h-full border border-blue-400">
              <div className="flex flex-col h-full">
                <MessageList
                  ref={scrollAreaRef}
                  messages={messages}
                  status={status}
                  isLoadingMessages={isLoadingMessages}
                />

                <ChatInput
                  input={input}
                  onInputChange={setInput}
                  onSubmit={(message, event, options) => {
                    handleSubmit(message, options);
                  }}
                  status={status}
                  isCreatingConversation={isCreatingConversation}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  conversationId={conversationId}
                  isNewChat={isNewChat}
                  initialWebSearch={initialWebSearch}
                  initialExtendedThinking={initialExtendedThinking}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
