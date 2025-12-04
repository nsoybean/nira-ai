import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/contexts/ConversationsContext";
import { FileUIPart } from "ai";

interface UseChatSubmitProps {
  isNewChat: boolean;
  conversationId: string | null;
  sendMessage: (
    message: { text: string; files?: FileUIPart[] },
    options?: any
  ) => void;
  selectedModel: string;
}

export function useChatSubmit({
  isNewChat,
  conversationId,
  sendMessage,
  selectedModel,
}: UseChatSubmitProps) {
  // hook
  const router = useRouter();
  const { refreshConversations } = useConversations();

  // state
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleSubmit = async (
    input: string,
    files: FileUIPart[],
    setInput: (value: string) => void,
    options: {
      useWebsearch?: boolean;
    }
  ) => {
    const useWebsearch = options?.useWebsearch || false;

    if ((!input.trim() && files.length === 0) || isCreatingConversation) return;

    // If this is a new chat, create the conversation and navigate
    if (isNewChat) {
      setIsCreatingConversation(true);

      try {
        // Create the conversation first with the selected model
        const createResponse = await fetch("/api/conversations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: selectedModel, useWebsearch }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create conversation");
        }

        const { id: newConversationId } = await createResponse.json();

        if (newConversationId) {
          // Store the pending message and files in sessionStorage so the new page can send it
          sessionStorage.setItem("pendingMessage", input);
          if (files.length > 0) {
            sessionStorage.setItem("pendingFiles", JSON.stringify(files));
          }
          sessionStorage.setItem(
            "pendingUseWebsearch",
            JSON.stringify(useWebsearch)
          );

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

    // For existing conversations, use normal flow and pass the selected model
    sendMessage(
      { text: input, files },
      { body: { conversationId: conversationId, modelId: selectedModel } }
    );
    setInput("");
  };

  return {
    handleSubmit,
    isCreatingConversation,
  };
}
