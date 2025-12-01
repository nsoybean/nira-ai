import { useState } from "react";
import { useRouter } from "next/navigation";

interface UseChatSubmitProps {
  isNewChat: boolean;
  conversationId: string | null;
  sendMessage: (message: { text: string }, options?: any) => void;
  refreshConversations: () => void;
}

export function useChatSubmit({
  isNewChat,
  conversationId,
  sendMessage,
  refreshConversations,
}: UseChatSubmitProps) {
  const router = useRouter();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleSubmit = async (
    input: string,
    setInput: (value: string) => void
  ) => {
    if (!input.trim() || isCreatingConversation) return;

    // If this is a new chat, create the conversation and navigate
    if (isNewChat) {
      setIsCreatingConversation(true);

      try {
        // Create the conversation first
        const createResponse = await fetch("/api/conversations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create conversation");
        }

        const { id: newConversationId } = await createResponse.json();

        if (newConversationId) {
          // Store the pending message in sessionStorage so the new page can send it
          sessionStorage.setItem("pendingMessage", input);

          // Clear input immediately for better UX
          setInput("");

          // Navigate to the new conversation
          router.push(`/chat/${newConversationId}`);

          // Reload conversations list
          refreshConversations();
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        // Restore input on error
        setInput(input);
      } finally {
        setIsCreatingConversation(false);
      }

      return;
    }

    // For existing conversations, use normal flow
    sendMessage({ text: input }, { body: { conversationId: conversationId } });
    setInput("");
  };

  return {
    handleSubmit,
    isCreatingConversation,
  };
}
