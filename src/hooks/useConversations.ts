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

  return {
    conversations,
    isLoadingConversations,
    refreshConversations,
  };
}
