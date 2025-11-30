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

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const isNewChat = conversationId === "new";

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [actualConversationId, setActualConversationId] = useState<
    string | null
  >(isNewChat ? null : conversationId);

  const {
    messages,
    setMessages,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
  } = useChat({
    experimental_throttle: 50, // to make streaming smoother
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const { conversations, isLoadingConversations, refreshConversations } =
    useConversations();

  useMessageLoader(conversationId, isNewChat, setMessages);

  const { handleSubmit: submitChat, isCreatingConversation } = useChatSubmit({
    isNewChat,
    actualConversationId,
    setActualConversationId,
    sendMessage,
    refreshConversations,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitChat(input, setInput, isLoading);
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
            isLoading={isLoading}
          />

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isCreatingConversation={isCreatingConversation}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
