"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  PanelLeft,
  Share2,
  Trash2,
  Edit3,
} from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import { DeleteConversationDialog } from "./DeleteConversationDialog";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  chatTitle: string;
  onTitleChange: (title: string) => void;
}

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  chatTitle,
  onTitleChange,
}: ChatHeaderProps) {
  // state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const isNew = conversationId === "new";

  // hook
  const { deleteConversation } = useConversations();

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    const success = await deleteConversation(conversationToDelete);

    if (success) {
      // If the deleted conversation is the current one, redirect to new chat
      if (conversationToDelete === conversationId) {
        router.push("/chat/new");
      }
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 dark:hover:bg-gray-800"
              onClick={onToggleSidebar}
            >
              <PanelLeft className="h-4 w-4 dark:text-gray-400" />
            </Button>
          )}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={chatTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="font-medium text-sm text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors"
              style={{ width: "fit-content", minWidth: "100px" }}
              placeholder="Chat title..."
              disabled={isNew}
            />

            {!isNew && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 dark:hover:bg-gray-800"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chat options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="start"
                  className="w-48 dark:bg-gray-900 dark:border-gray-800"
                >
                  <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800"
                    onClick={(e) => handleDeleteClick(e, conversationId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
