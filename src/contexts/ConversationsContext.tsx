"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";
import { ConversationSettings } from "@/lib/conversation-settings";

interface Conversation {
  id: string;
  title: string;
  webSearch?: boolean;
  settings?: ConversationSettings;
}

interface ConversationsContextType {
  conversations: Conversation[];
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  addConversation: (conversation: Conversation) => void;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  clearAllConversations: () => Promise<boolean>;
  clearConversationsState: () => void;
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

  // Track if we've done initial load to prevent unnecessary refetches
  const hasLoadedRef = useRef(false);

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
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // ✅ OPTIMISTIC: Add conversation to list immediately (when creating new chat)
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => [conversation, ...prev]);
  }, []);

  // ✅ OPTIMISTIC: Delete with rollback on error
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      // Store previous state for rollback
      const previousConversations = conversations;

      try {
        // Optimistically remove from UI immediately
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // Rollback on error
          setConversations(previousConversations);
          console.error("Failed to delete conversation");
          return false;
        }

        return true;
      } catch (error) {
        // Rollback on error
        setConversations(previousConversations);
        console.error("Error deleting conversation:", error);
        return false;
      }
    },
    [conversations]
  );

  // ✅ OPTIMISTIC: Clear all with rollback
  const clearAllConversations = useCallback(async () => {
    const previousConversations = conversations;

    try {
      // Optimistically clear UI
      setConversations([]);

      const response = await fetch("/api/conversations", {
        method: "DELETE",
      });

      if (!response.ok) {
        // Rollback on error
        setConversations(previousConversations);
        console.error("Failed to clear all conversations");
        return false;
      }

      return true;
    } catch (error) {
      // Rollback on error
      setConversations(previousConversations);
      console.error("Error clearing all conversations:", error);
      return false;
    }
  }, [conversations]);

  // ✅ OPTIMISTIC: Update with rollback (for rename, etc.)
  const updateConversation = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      const previousConversations = conversations;

      try {
        // Optimistically update UI
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
          )
        );

        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          // Rollback on error
          setConversations(previousConversations);
          console.error("Failed to update conversation");
          return false;
        }

        return true;
      } catch (error) {
        // Rollback on error
        setConversations(previousConversations);
        console.error("Error updating conversation:", error);
        return false;
      }
    },
    [conversations]
  );

  // Clear conversations state
  const clearConversationsState = useCallback(() => {
    setConversations([]);
  }, []);

  // Initial load only
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadConversations();
    }
  }, [loadConversations]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      conversations,
      isLoadingConversations,
      refreshConversations,
      addConversation,
      deleteConversation,
      clearAllConversations,
      clearConversationsState,
      updateConversation,
    }),
    [
      conversations,
      isLoadingConversations,
      refreshConversations,
      addConversation,
      deleteConversation,
      clearAllConversations,
      clearConversationsState,
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
