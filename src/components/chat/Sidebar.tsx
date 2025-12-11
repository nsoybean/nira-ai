"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
	Edit3,
	Trash2,
	MessageCirclePlusIcon,
	PanelLeft,
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
import { AuthButton } from "@/components/auth/AuthButton";
import { cn, isDevelopment } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { KbdKeyboard } from "@/components/kbdKeyboard";

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
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<span className="font-rem text-lg text-foreground font-bold">
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
									className="h-8 w-8 hover:bg-accent"
									onClick={onClose}
								>
									<PanelLeft className="h-4 w-4 text-muted-foreground" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right">
								<div className="flex items-center gap-2">
									<span>Close sidebar</span>
									<KbdKeyboard keystrokes={"⌘_."} />
								</div>
							</TooltipContent>
						</Tooltip>
					)}
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="w-full py-5 justify-start gap-2 rounded-lg hover:bg-background dark:hover:bg-background hover:shadow-md"
							size="sm"
							variant={"outline"}
							onClick={handleNewChatClick}
						>
							<MessageCirclePlusIcon className="h-4 w-4" />
							New Chat
							<div className="ml-auto">
								{!isMobile && <KbdKeyboard keystrokes="⌘_K" />}
							</div>
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
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : conversations.length === 0 ? (
						<div className="text-center py-8 text-sm text-muted-foreground">
							No conversations yet
						</div>
					) : (
						conversations.map((conv) => (
							<div
								key={conv.id}
								onClick={() => handleConversationClick(conv.id)}
								className={cn(
									`group text-left px-3 py-2.5 text-sm rounded-lg hover:bg-sidebar-accent transition-colors flex items-center gap-2 cursor-pointer ${
										conv.id === currentConversationId
											? "text-sidebar-accent-foreground bg-sidebar-accent"
											: "text-muted-foreground"
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
										className="w-48 bg-popover dark:border-gray-800"
									>
										<DropdownMenuItem
											className="cursor-pointer hover:bg-accent text-foreground"
											onClick={(e) => handleRenameClick(e, conv)}
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
			<div className="p-3 space-y-3 border-t border-border">
				{/* Theme Toggle */}
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-1 bg-muted rounded-lg p-1">
							<button
								onClick={() => setTheme("light")}
								className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
									theme === "light"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Sun className="h-3.5 w-3.5" />
								Light
							</button>
							<button
								onClick={() => setTheme("dark")}
								className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
									theme === "dark"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
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

				{/* User Profile / Auth */}
				<AuthButton onClearAll={handleClearAllClick} />
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
						className="w-[280px] sm:w-[320px] p-0 bg-sidebar border-r border-sidebar-border"
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
				} transition-all duration-300 flex flex-col overflow-hidden bg-sidebar`}
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
