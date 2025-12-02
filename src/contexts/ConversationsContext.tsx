"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface Conversation {
  id: string;
  title: string;
}

interface ConversationsContextType {
  conversations: Conversation[];
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => Promise<boolean>;
}

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const loadConversations = useCallback(async () => {
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
  }, []);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  const deleteConversation = useCallback(
    async (conversationId: string) => {
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
    },
    [loadConversations]
  );

  const updateConversation = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          console.error("Failed to update conversation");
          return false;
        }

        // Refresh the conversation list after successful update
        await loadConversations();
        return true;
      } catch (error) {
        console.error("Error updating conversation:", error);
        return false;
      }
    },
    [loadConversations]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      conversations,
      isLoadingConversations,
      refreshConversations,
      deleteConversation,
      updateConversation,
    }),
    [
      conversations,
      isLoadingConversations,
      refreshConversations,
      deleteConversation,
      updateConversation,
    ]
  );

  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within ConversationsProvider"
    );
  }
  return context;
}
