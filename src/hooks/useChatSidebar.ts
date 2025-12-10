import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/contexts/ConversationsContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function useChatSidebar(currentConversationId?: string) {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Initialize sidebar state: closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Update sidebar state when switching between mobile and desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const {
    deleteConversation,
    clearAllConversations,
    updateConversation,
    conversations,
    isLoadingConversations,
  } = useConversations();

  const handleNewChat = useCallback(() => {
    router.push("/new");
  }, [router]);

  const handleDelete = useCallback(
    async (conversationId: string) => {
      const success = await deleteConversation(conversationId);

      if (success) {
        toast.success("Conversation deleted successfully");
        // If the deleted conversation is the current one, redirect to new chat
        if (conversationId === currentConversationId) {
          router.push("/new");
        }
      } else {
        toast.error("Failed to delete conversation");
      }

      return success;
    },
    [deleteConversation, currentConversationId, router]
  );

  const handleClearAll = useCallback(async () => {
    const success = await clearAllConversations();

    if (success) {
      toast.success("All conversations cleared successfully");
      // Redirect to new chat after clearing all
      router.push("/new");
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
      } else {
        toast.error("Failed to rename conversation");
      }

      return success;
    },
    [updateConversation]
  );

  // Keyboard shortcut to start new chat 
  useEffect(() => {
    const handleNewChatShortcut = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleNewChatShortcut);
    return () => window.removeEventListener("keydown", handleNewChatShortcut);
  }, []);


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

  return {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    isLoadingConversations,
    handleNewChat,
    handleDelete,
    handleClearAll,
    handleRename,
  };
}
