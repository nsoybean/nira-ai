import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/contexts/ConversationsContext";
import { FileUIPart } from "ai";
import { toast } from "sonner";

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

  // ✅ OPTIMIZED: Use addConversation instead of refreshConversations
  const { addConversation } = useConversations();

  // state
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleSubmit = async (
    input: string,
    files: FileUIPart[],
    setInput: (value: string) => void,
    settings: {
      useWebsearch?: boolean;
      useExtendedThinking?: boolean;
    }
  ) => {
    const useWebsearch = settings?.useWebsearch || false;
    const useExtendedThinking = settings?.useExtendedThinking || false;

    if ((!input.trim() && files.length === 0) || isCreatingConversation) return;

    // If this is a new chat, create the conversation and navigate
    if (isNewChat) {
      setIsCreatingConversation(true);

      try {
        // Create the conversation first with the selected model and settings
        const createResponse = await fetch("/api/conversations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: selectedModel,
            settings: {
              websearch: useWebsearch,
              extendedThinking: useExtendedThinking,
            },
          }),
        });

        // if missing beta token
        if (createResponse.status === 401) {
          const response = await createResponse.json();
          if (
            response.error === "Unauthorized" &&
            response.message === "Valid beta authentication token is required"
          ) {
            toast.error(
              "Thanks for trying! Still in beta 🙂 Email me: nyangbin@gmail.com"
            );

            return;
          }
        }

        if (!createResponse.ok) {
          throw new Error("Failed to create conversation");
        }

        const newConversation = await createResponse.json();

        if (newConversation.id) {
          // ✅ OPTIMIZED: Add to sidebar immediately (no refetch needed!)
          addConversation({
            id: newConversation.id,
            title: newConversation.title || "New Chat",
            settings: {
              websearch: useWebsearch,
              extendedThinking: useExtendedThinking,
            },
          });

          // Store the pending message and files in sessionStorage so the new page can send it
          sessionStorage.setItem("pendingMessage", input);
          if (files.length > 0) {
            sessionStorage.setItem("pendingFiles", JSON.stringify(files));
          }

          // Navigate to the new conversation
          router.push(`/chat/${newConversation.id}`);

          // ❌ REMOVED: No need for refreshConversations() anymore!
          // The conversation is already in the sidebar from addConversation()

          // Add a small delay before clearing loading state
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        // Input is already preserved, just need to exit loading state
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
