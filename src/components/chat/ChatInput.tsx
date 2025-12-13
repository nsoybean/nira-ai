"use client";

import { ChatStatus } from "ai";
import { Loader2, ArrowUp, Settings2 } from "lucide-react";
import { useRef, useEffect, FormEvent, useState } from "react";
import { ModelSelectorInline } from "./ModelSelectorInline";
import {
	PromptInput,
	PromptInputHeader,
	PromptInputAttachments,
	PromptInputAttachment,
	PromptInputBody,
	PromptInputTextarea,
	PromptInputFooter,
	PromptInputTools,
	PromptInputActionMenu,
	PromptInputActionMenuTrigger,
	PromptInputActionMenuContent,
	PromptInputActionAddAttachments,
	PromptInputButton,
	PromptInputSubmit,
	PromptInputMessage,
	usePromptInputAttachments,
} from "../ai-elements/prompt-input";
import { useConversations } from "@/contexts/ConversationsContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";

interface ChatInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSubmit: (
		message: PromptInputMessage,
		event: FormEvent<HTMLFormElement>,
		settings: { useWebSearch: boolean; useExtendedThinking: boolean }
	) => void | Promise<void>;
	status: ChatStatus;
	isCreatingConversation: boolean;
	selectedModel: string;
	onModelChange: (modelId: string) => void;
	conversationId: string;
	isNewChat: boolean;
	initialWebSearch?: boolean;
	initialExtendedThinking?: boolean;
}

export function ChatInput({
	input,
	onInputChange,
	onSubmit,
	status,
	isCreatingConversation,
	selectedModel,
	onModelChange,
	conversationId,
	isNewChat,
	initialWebSearch = false,
	initialExtendedThinking = false,
}: ChatInputProps) {
	// ref
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auth
	const { data: session, isPending: isAuthPending } = useSession();
	const [authDialogOpen, setAuthDialogOpen] = useState(false);

	// Internal state for settings
	const [useWebSearch, setUseWebSearch] = useState(initialWebSearch);
	const [useExtendedThinking, setUseExtendedThinking] = useState(
		initialExtendedThinking
	);
	const isInitialMount = useRef(true);

	// Store pending files during conversation creation
	const [pendingFiles, setPendingFiles] = useState<any[]>([]);

	// Get updateConversation from context
	const { updateConversation } = useConversations();

	// Combined mutation for updating settings
	const { mutate: updateSettings } = useMutation({
		mutationFn: async (updates: {
			webSearch?: boolean;
			extendedThinking?: boolean;
		}) => {
			// Send all settings in a unified settings object
			const payload: any = {
				settings: {
					websearch: updates.webSearch,
					extendedThinking: updates.extendedThinking,
				},
			};

			return updateConversation(conversationId, payload);
		},
		onError: (error, variables) => {
			toast.error(`Failed to update settings: ${error}`);
			// Reset both settings on error
			if (variables.webSearch !== undefined) {
				setUseWebSearch((prev) => !prev);
			}
			if (variables.extendedThinking !== undefined) {
				setUseExtendedThinking((prev) => !prev);
			}
		},
	});

	const isLoading = status === "submitted" || status === "streaming";

	// Sync internal state with initial props when they change
	useEffect(() => {
		setUseWebSearch(initialWebSearch);
	}, [initialWebSearch]);

	useEffect(() => {
		setUseExtendedThinking(initialExtendedThinking);
	}, [initialExtendedThinking]);

	// Update conversation when settings are toggled (combined effect)
	useEffect(() => {
		// Skip the first render (mount)
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}

		// Only update when toggled and not a new chat
		if (!isNewChat && conversationId) {
			updateSettings({
				webSearch: useWebSearch,
				extendedThinking: useExtendedThinking,
			});
		}
	}, [
		useWebSearch,
		useExtendedThinking,
		conversationId,
		isNewChat,
		updateSettings,
	]);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height =
				textareaRef.current.scrollHeight + "px";
		}
	}, [input]);

	// Auto-focus input on mount and after message is sent
	useEffect(() => {
		if (textareaRef.current && !isLoading && !isCreatingConversation) {
			textareaRef.current.focus();
		}
	}, [isLoading, isCreatingConversation]);

	// Focus input when input is cleared (after sending message)
	useEffect(() => {
		if (input === "" && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [input]);

	// Clear pending files when navigating away (conversationId changes) or chat is no longer new
	useEffect(() => {
		if (!isNewChat && pendingFiles.length > 0) {
			setPendingFiles([]);
		}
	}, [isNewChat, conversationId, pendingFiles.length]);

	// Wrapper for onSubmit to capture files during conversation creation
	const handleSubmit = (
		message: PromptInputMessage,
		event: FormEvent<HTMLFormElement>
	) => {
		// Check if user is logged in
		if (!session && !isAuthPending) {
			// Show auth dialog
			setAuthDialogOpen(true);
			return;
		}

		// If creating a new conversation, store the files
		if (isNewChat && message.files && message.files.length > 0) {
			setPendingFiles(message.files);
		}

		onSubmit(message, event, { useWebSearch, useExtendedThinking });
	};

	// Component to conditionally render header only when attachments exist
	const ConditionalHeader = () => {
		const attachments = usePromptInputAttachments();
		const hasAttachments = attachments.files.length > 0;
		const hasPendingFiles = isCreatingConversation && pendingFiles.length > 0;

		if (!hasAttachments && !hasPendingFiles) {
			return null;
		}

		return (
			<PromptInputHeader className="rounded-2xl">
				{/* Show pending files during conversation creation */}
				{hasPendingFiles ? (
					<div className="flex flex-wrap gap-2 p-2">
						{pendingFiles.map((file, index) => (
							<PromptInputAttachment key={index} data={file} />
						))}
					</div>
				) : (
					<PromptInputAttachments>
						{(attachment) => <PromptInputAttachment data={attachment} />}
					</PromptInputAttachments>
				)}
			</PromptInputHeader>
		);
	};

	return (
		<>
			<PromptInput
				onSubmit={handleSubmit}
				className="rounded-2xl max-w-4xl mx-auto"
				globalDrop
				multiple
				accept="image/*"
			>
				{/* header - only shown when there are attachments */}
				<ConditionalHeader />

				<PromptInputBody>
					<PromptInputTextarea
						placeholder="Ask me anything..."
						onChange={(e) => onInputChange(e.target.value)}
						value={input}
						autoFocus
						disabled={isLoading || isCreatingConversation}
					/>
				</PromptInputBody>
				<PromptInputFooter className="flex items-center justify-between">
					<PromptInputTools>
						<PromptInputActionMenu>
							<PromptInputActionMenuTrigger
								disabled={isLoading || isCreatingConversation}
							/>
							<PromptInputActionMenuContent>
								<PromptInputActionAddAttachments />
							</PromptInputActionMenuContent>
						</PromptInputActionMenu>

						{/* Settings Popover */}
						<Popover>
							<PopoverTrigger asChild>
								<PromptInputButton
									variant={
										useWebSearch || useExtendedThinking ? "default" : "ghost"
									}
									type="button"
									disabled={isLoading || isCreatingConversation}
								>
									<Settings2 size={16} />
									{/* <span>Settings</span> */}
								</PromptInputButton>
							</PopoverTrigger>
							<PopoverContent className="w-xs p-2" align="start">
								<div className="space-y-2 p-2">
									{/* <h4 className="font-medium text-sm">Chat Settings</h4> */}
									<p className="text-xs text-muted-foreground">
										Configure settings for this conversation
									</p>
								</div>

								<div className="space-y-1">
									{/* Web Search Toggle */}
									<div
										className="flex items-center justify-between hover:bg-secondary rounded-md p-2 cursor-pointer"
										onClick={() =>
											!isLoading &&
											!isCreatingConversation &&
											setUseWebSearch(!useWebSearch)
										}
									>
										<div className="space-y-0.5">
											<label className="text-sm font-medium">Web Search</label>
											<p className="text-xs text-muted-foreground">
												Search the web for answers
											</p>
										</div>
										<Switch
											checked={useWebSearch}
											onCheckedChange={setUseWebSearch}
											disabled={isLoading || isCreatingConversation}
										/>
									</div>

									{/* Extended Thinking Toggle */}
									<div
										className="flex items-center justify-between  hover:bg-secondary rounded-md p-2 cursor-pointer"
										onClick={() =>
											!isLoading &&
											!isCreatingConversation &&
											setUseExtendedThinking(!useExtendedThinking)
										}
									>
										<div className="space-y-0.5">
											<label className="text-sm font-medium">
												Extended Thinking
											</label>
											<p className="text-xs text-muted-foreground">
												Enable advanced reasoning capabilities
											</p>
										</div>
										<Switch
											checked={useExtendedThinking}
											onCheckedChange={setUseExtendedThinking}
											disabled={isLoading || isCreatingConversation}
										/>
									</div>
								</div>
							</PopoverContent>
						</Popover>

						{/* model selection */}
						<ModelSelectorInline
							selectedModel={selectedModel}
							onModelChange={onModelChange}
							disabled={isLoading || isCreatingConversation}
						/>
					</PromptInputTools>

					{/* submit */}
					<PromptInputSubmit
						disabled={!input || !status}
						status={status}
						className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all"
					>
						{isLoading || isCreatingConversation ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ArrowUp className="h-4 w-4" />
						)}
					</PromptInputSubmit>
				</PromptInputFooter>
			</PromptInput>

			{/* Auth Dialog for non-logged-in users */}
			<AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
		</>
	);
}
