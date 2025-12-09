import { useState, useEffect } from "react";
import { MyUIMessage } from "@/lib/types";

// load messages for a conversation
export function useMessageLoader(conversationId: string, isNewChat: boolean) {
  const [isLoadingMessages, setIsLoadingMessages] = useState(!isNewChat);
  const [messages, setMessages] = useState<MyUIMessage[]>([]);

  useEffect(() => {
    async function loadMessages() {
      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`
        );

        if (!response.ok) {
          console.error("Failed to load messages");
          return;
        }

        const loadedMessages = await response.json();

        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    // fetch messages only if not a new chat
    if (!isNewChat && conversationId) {
      loadMessages();
    } else {
      setIsLoadingMessages(false);
    }
  }, [conversationId, isNewChat]);

  return { isLoadingMessages, messages };
}
