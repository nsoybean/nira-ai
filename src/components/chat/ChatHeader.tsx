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
import { PanelLeft, Share2, Trash2, Edit3, HamburgerIcon } from "lucide-react";
import { useState, memo, useRef, useEffect } from "react";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { RenameConversationDialog } from "./RenameConversationDialog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  chatTitle: string;
  onTitleChange: (title: string) => void;
  conversationId: string;
  isNew: boolean;
  onDelete?: (conversationId: string) => Promise<boolean>;
  onRename?: (conversationId: string, newTitle: string) => Promise<boolean>;
}

export const ChatHeader = memo(function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  chatTitle,
  onTitleChange,
  conversationId,
  isNew,
  onDelete,
  onRename,
}: ChatHeaderProps) {
  // state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const originalTitleRef = useRef(chatTitle);
  const isMobile = useIsMobile();

  // Update the ref when chatTitle changes from external sources
  useEffect(() => {
    originalTitleRef.current = chatTitle;
  }, [chatTitle]);

  const handleTitleBlur = async () => {
    if (isNew || !onRename) return;

    const trimmedTitle = chatTitle.trim();

    // If title hasn't changed or is empty, revert to original
    if (!trimmedTitle || trimmedTitle === originalTitleRef.current) {
      onTitleChange(originalTitleRef.current);
      return;
    }

    // If title changed, save it
    if (trimmedTitle !== originalTitleRef.current) {
      const success = await onRename(conversationId, trimmedTitle);
      if (success) {
        originalTitleRef.current = trimmedTitle;
      } else {
        // Revert to original on failure
        onTitleChange(originalTitleRef.current);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete || !onDelete) return;

    setIsDeleting(true);
    await onDelete(conversationToDelete);

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (!onRename) return;

    setIsRenaming(true);
    const success = await onRename(conversationId, newTitle);

    if (success) {
      onTitleChange(newTitle);
    }

    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Share feature coming soon!");
  };

  return (
    <>
      <header className="h-10 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 dark:hover:bg-gray-800"
              onClick={onToggleSidebar}
            >
              {isMobile ? (
                <HamburgerIcon className="h-4 w-4 dark:text-gray-400" />
              ) : (
                <PanelLeft className="h-4 w-4 dark:text-gray-400" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={chatTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
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
                  <DropdownMenuItem
                    className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200"
                    onClick={handleRenameClick}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200"
                    onClick={handleShareClick}
                  >
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

      <RenameConversationDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onConfirm={handleConfirmRename}
        currentTitle={chatTitle}
        isRenaming={isRenaming}
      />
    </>
  );
});
