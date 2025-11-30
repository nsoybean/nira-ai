import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  title: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        console.error("Failed to load conversations");
        return;
      }

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const refreshConversations = () => {
    loadConversations();
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to delete conversation");
        return false;
      }

      // Refresh the conversation list after successful deletion
      await loadConversations();
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  };

  return {
    conversations,
    isLoadingConversations,
    refreshConversations,
    deleteConversation,
  };
}
