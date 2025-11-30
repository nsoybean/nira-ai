"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  PanelLeftClose,
  MessageSquarePlus,
  MoreVertical,
  Sun,
  Moon,
  Share2,
  Trash2,
  Edit3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  isLoadingConversations: boolean;
  currentConversationId: string;
  onNewChat: () => void;
  onDeleteConversation: (conversationId: string) => Promise<boolean>;
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  isLoadingConversations,
  currentConversationId,
  onNewChat,
  onDeleteConversation,
}: SidebarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    const success = await onDeleteConversation(conversationToDelete);

    if (success) {
      // If the deleted conversation is the current one, redirect to new chat
      if (conversationToDelete === currentConversationId) {
        router.push("/chat/new");
      }
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
      } transition-all duration-300 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Lume
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <PanelLeftClose className="h-4 w-4 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Close sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full justify-start gap-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              size="sm"
              onClick={onNewChat}
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Start a new conversation</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="space-y-1 p-3">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className={`group w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer ${
                  conv.id === currentConversationId
                    ? "text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <span className="truncate flex-1">{conv.title}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
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
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="p-3 space-y-3 border-t border-gray-200 dark:border-gray-800">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === "light"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Switch theme</p>
          </TooltipContent>
        </Tooltip>

        <Separator />

        {/* User Profile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                  EK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  Elizabeth Keen
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  hey@unspace.agency
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Account settings</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">
              Delete conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
