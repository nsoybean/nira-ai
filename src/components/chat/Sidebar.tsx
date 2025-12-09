"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { useState, memo } from "react";
import { DeleteConversationDialog } from "./DeleteConversationDialog";
import { ClearAllChatsDialog } from "./ClearAllChatsDialog";
import { RenameConversationDialog } from "./RenameConversationDialog";
import { BetaAuthDialog } from "@/components/BetaAuthDialog";
import { useBetaAuth } from "@/contexts/BetaAuthContext";
import { toast } from "sonner";
import { cn, isDevelopment } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversationId: string;
  onNewChat: () => void;
  conversations: Conversation[];
  isLoadingConversations: boolean;
  onDelete?: (conversationId: string) => Promise<boolean>;
  onClearAll?: () => Promise<boolean>;
  onRename?: (conversationId: string, newTitle: string) => Promise<boolean>;
}

// Sidebar content component to be reused in both desktop and mobile versions
const SidebarContent = ({
  currentConversationId,
  onNewChat,
  conversations,
  isLoadingConversations,
  onClose,
  handleDeleteClick,
  handleRenameClick,
  handleShareClick,
  handleClearAllClick,
}: {
  currentConversationId: string;
  onNewChat: () => void;
  conversations: Conversation[];
  isLoadingConversations: boolean;
  onClose?: () => void;
  handleDeleteClick: (e: React.MouseEvent, conversationId: string) => void;
  handleRenameClick: (e: React.MouseEvent, conversation: Conversation) => void;
  handleShareClick: (e: React.MouseEvent) => void;
  handleClearAllClick: () => void;
}) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useBetaAuth();
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Handle conversation click with mobile auto-close
  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
    // Auto-close sidebar on mobile after navigation
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Handle new chat click with mobile auto-close
  const handleNewChatClick = () => {
    onNewChat();
    // Auto-close sidebar on mobile after new chat
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 dark:text-gray-100 font-bold">
              Nira AI
            </span>
            <Badge
              variant={isAuthenticated ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 hover:text-white dark:hover:text-black"
              onClick={() => !isAuthenticated && setBetaDialogOpen(true)}
            >
              BETA
            </Badge>
          </div>
          {onClose && !isMobile && (
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
                <div className="flex items-center gap-2">
                  <span>Close sidebar</span>
                  <Kbd>⌘.</Kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-full justify-start gap-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              size="sm"
              onClick={handleNewChatClick}
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
      <ScrollArea
        className={cn(
          "flex-1 overflow-hidden",
          isDevelopment() && "border-2 border-blue-400"
        )}
      >
        <div className={cn("space-y-1 p-3")}>
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
                onClick={() => handleConversationClick(conv.id)}
                className={cn(
                  `group text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer ${
                    conv.id === currentConversationId
                      ? "text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800"
                      : "text-gray-600 dark:text-gray-400"
                  }`,
                  isDevelopment() && "border-2 border-green-400"
                )}
              >
                <div
                  className={cn(
                    "truncate flex-1 min-w-0 max-w-42",
                    isDevelopment() && "border-2 border-red-400"
                  )}
                >
                  {conv.title}
                </div>
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
                    <DropdownMenuItem
                      className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200"
                      onClick={(e) => handleRenameClick(e, conv)}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
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
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 dark:bg-gray-900 dark:border-gray-800"
          >
            <DropdownMenuItem
              onClick={handleClearAllClick}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all chats
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Beta Auth Dialog */}
      <BetaAuthDialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen} />
    </>
  );
};

export const Sidebar = memo(function Sidebar({
  isOpen,
  onClose,
  currentConversationId,
  onNewChat,
  conversations,
  isLoadingConversations,
  onDelete,
  onClearAll,
  onRename,
}: SidebarProps) {
  // state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [conversationToRename, setConversationToRename] =
    useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // hook
  const isMobile = useIsMobile();

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete || !onDelete) return;

    setIsDeleting(true);
    await onDelete(conversationToDelete);

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleClearAllClick = () => {
    setClearAllDialogOpen(true);
  };

  const handleConfirmClearAll = async () => {
    if (!onClearAll) return;

    setIsClearing(true);
    await onClearAll();

    setIsClearing(false);
    setClearAllDialogOpen(false);
  };

  const handleRenameClick = (
    e: React.MouseEvent,
    conversation: Conversation
  ) => {
    e.stopPropagation();
    setConversationToRename(conversation);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (!conversationToRename || !onRename) return;

    setIsRenaming(true);
    await onRename(conversationToRename.id, newTitle);

    setIsRenaming(false);
    setRenameDialogOpen(false);
    setConversationToRename(null);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Share feature coming soon!");
  };

  // Mobile: Render as Sheet drawer
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <SheetContent
            side="left"
            className="w-[280px] sm:w-[320px] p-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                Access your conversations and settings
              </SheetDescription>
            </SheetHeader>
            <div className="h-full flex flex-col">
              <SidebarContent
                currentConversationId={currentConversationId}
                onNewChat={onNewChat}
                conversations={conversations}
                isLoadingConversations={isLoadingConversations}
                onClose={onClose}
                handleDeleteClick={handleDeleteClick}
                handleRenameClick={handleRenameClick}
                handleShareClick={handleShareClick}
                handleClearAllClick={handleClearAllClick}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Dialogs */}
        <DeleteConversationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
        <ClearAllChatsDialog
          open={clearAllDialogOpen}
          onOpenChange={setClearAllDialogOpen}
          onConfirm={handleConfirmClearAll}
          isClearing={isClearing}
        />
        <RenameConversationDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          onConfirm={handleConfirmRename}
          currentTitle={conversationToRename?.title || ""}
          isRenaming={isRenaming}
        />
      </>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <>
      <aside
        className={`${
          isOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden`}
      >
        <SidebarContent
          currentConversationId={currentConversationId}
          onNewChat={onNewChat}
          conversations={conversations}
          isLoadingConversations={isLoadingConversations}
          onClose={onClose}
          handleDeleteClick={handleDeleteClick}
          handleRenameClick={handleRenameClick}
          handleShareClick={handleShareClick}
          handleClearAllClick={handleClearAllClick}
        />
      </aside>

      {/* Dialogs */}
      <DeleteConversationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
      <ClearAllChatsDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        onConfirm={handleConfirmClearAll}
        isClearing={isClearing}
      />
      <RenameConversationDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onConfirm={handleConfirmRename}
        currentTitle={conversationToRename?.title || ""}
        isRenaming={isRenaming}
      />
    </>
  );
});
