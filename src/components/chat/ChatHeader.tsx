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
import { useConversations } from "@/contexts/ConversationsContext";

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  conversationId: string;
  isNew: boolean;
  onDelete?: (conversationId: string) => Promise<boolean>;
  onRename?: (conversationId: string, newTitle: string) => Promise<boolean>;
}

export const ChatHeader = memo(function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  conversationId,
  isNew,
  onDelete,
  onRename,
}: ChatHeaderProps) {
  const { conversations } = useConversations();

  // Get title from context
  const chatTitle =
    conversations.find((conv) => conv.id === conversationId)?.title ||
    "New Chat";

  // state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editingTitle, setEditingTitle] = useState(chatTitle);
  const originalTitleRef = useRef(chatTitle);
  const isMobile = useIsMobile();

  // Update local editing state and ref when chatTitle prop changes from context
  useEffect(() => {
    setEditingTitle(chatTitle);
    originalTitleRef.current = chatTitle;
  }, [chatTitle]);

  const handleTitleBlur = async () => {
    if (isNew || !onRename) return;

    const trimmedTitle = editingTitle.trim();

    // If title hasn't changed or is empty, revert to original
    if (!trimmedTitle || trimmedTitle === originalTitleRef.current) {
      setEditingTitle(originalTitleRef.current);
      return;
    }

    // If title changed, save it
    if (trimmedTitle !== originalTitleRef.current) {
      const success = await onRename(conversationId, trimmedTitle);
      if (success) {
        originalTitleRef.current = trimmedTitle;
      } else {
        // Revert to original on failure
        setEditingTitle(originalTitleRef.current);
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
      setEditingTitle(newTitle);
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
      <header className="h-10 flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:bg-accent"
              onClick={onToggleSidebar}
            >
              {isMobile ? (
                <HamburgerIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="font-medium text-sm text-foreground bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded-md hover:bg-accent focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors"
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
                        className="h-6 w-6 hover:bg-accent"
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
                          className="text-muted-foreground"
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
                  className="w-48 bg-popover border-border"
                >
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-accent text-foreground"
                    onClick={handleRenameClick}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-accent text-foreground"
                    onClick={handleShareClick}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive hover:bg-accent"
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
