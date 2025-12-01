"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useConversations } from "@/hooks/useConversations";
import { useMessageLoader } from "@/hooks/useMessageLoader";
import { useChatSubmit } from "@/hooks/useChatSubmit";
import { DEFAULT_MODEL_ID } from "@/lib/models";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const isNewChat = conversationId === "new";

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  // Clear input when starting a new chat
  useEffect(() => {
    if (isNewChat) {
      setInput("");
    }
  }, [isNewChat]);

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
    transport: new DefaultChatTransport({
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
  });

  // conversations for sidebar
  const {
    conversations,
    isLoadingConversations,
    refreshConversations,
    deleteConversation,
  } = useConversations();

  // conversation messages
  const { isLoadingMessages, messages: loadedMessages } = useMessageLoader(
    conversationId,
    isNewChat
  );

  // chat
  const { handleSubmit: submitChat, isCreatingConversation } = useChatSubmit({
    isNewChat,
    conversationId,
    sendMessage,
    refreshConversations,
    selectedModel,
  });

  useEffect(() => {
    if (loadedMessages.length) {
      setMessages(loadedMessages);
    }
  }, [loadedMessages]);

  // Load conversation details including model when viewing existing chat
  useEffect(() => {
    if (!isNewChat && conversationId) {
      fetch(`/api/conversations/${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.modelId) {
            setSelectedModel(data.modelId);
          }
        })
        .catch((error) => {
          console.error("Error loading conversation:", error);
        });
    }
  }, [conversationId, isNewChat]);

  // Send pending message after mounting from new chat creation
  useEffect(() => {
    // Only run for existing conversations (not "new")
    if (!isNewChat) {
      const pendingMessage = sessionStorage.getItem("pendingMessage");

      if (pendingMessage) {
        // Clear it immediately to prevent double-sending
        sessionStorage.removeItem("pendingMessage");

        // Send the message after the component has fully mounted
        sendMessage({ text: pendingMessage }, { body: { conversationId } });
      }
    }
  }, [isNewChat, conversationId, sendMessage]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "streaming" || status === "submitted") {
      return;
    }

    await submitChat(input, setInput);
  };

  const handleNewChat = () => {
    router.push("/chat/new");
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-white dark:bg-gray-950">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          isLoadingConversations={isLoadingConversations}
          currentConversationId={conversationId}
          onNewChat={handleNewChat}
          onDeleteConversation={deleteConversation}
        />

        <div className="flex-1 flex flex-col">
          <ChatHeader
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(true)}
            chatTitle={chatTitle}
            onTitleChange={setChatTitle}
          />

          <MessageList
            ref={scrollAreaRef}
            messages={messages}
            status={status}
          />

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            status={status}
            isCreatingConversation={isCreatingConversation}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
