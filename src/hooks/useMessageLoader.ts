import { useState, useEffect } from "react";
import { UIMessage } from "ai";

export function useMessageLoader(
  conversationId: string,
  isNewChat: boolean,
  setMessages: (messages: UIMessage[]) => void
) {
  const [isLoadingMessages, setIsLoadingMessages] = useState(!isNewChat);

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

    if (!isNewChat && conversationId) {
      loadMessages();
    }
  }, [conversationId, isNewChat, setMessages]);

  return { isLoadingMessages };
}
