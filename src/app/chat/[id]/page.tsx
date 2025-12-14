"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useMessageLoader } from "@/hooks/useMessageLoader";
import { useChatSubmit } from "@/hooks/useChatSubmit";
import { useChatSidebar } from "@/hooks/useChatSidebar";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { MyUIMessage } from "@/lib/UIMessage";
import { useConversations } from "@/contexts/ConversationsContext";

export default function ChatPage() {
	const params = useParams();
	const conversationId = params.id as string;

	const [input, setInput] = useState("");
	const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
	const [initialWebSearch, setInitialWebSearch] = useState(false);
	const [initialExtendedThinking, setInitialExtendedThinking] = useState(false);

	// For streaming title effect
	const streamingTitleRef = useRef<{
		fullTitle: string;
		currentIndex: number;
		intervalId?: NodeJS.Timeout;
	}>({ fullTitle: "", currentIndex: 0 });

	// Sidebar logic
	const {
		sidebarOpen,
		setSidebarOpen,
		conversations,
		isLoadingConversations,
		handleNewChat,
		handleDelete,
		handleClearAll,
		handleRename: handleSidebarRename,
	} = useChatSidebar(conversationId);

	const { updateConversation } = useConversations();

	// Memoize transport to prevent re-creating on every render
	const transport = useMemo(
		() =>
			new DefaultChatTransport<UIMessage>({
				api: "/api/chat",
				// send only last message with model info
				prepareSendMessagesRequest({ messages, id, body }) {
					return {
						body: {
							message: messages[messages.length - 1],
							id,
							conversationId: body?.conversationId,
							modelId: body?.modelId,
						},
					};
				},
			}),
		[]
	);

	const {
		messages,
		setMessages,
		status,
		sendMessage,
		error,
		stop,
		regenerate,
	} = useChat<MyUIMessage>({
		id: conversationId || undefined,
		experimental_throttle: 50, // to make streaming smoother
		transport,
		onData: (dataPart) => {
			const part = dataPart as MyUIMessage["parts"][number];
			if (part.type === "data-title") {
				const convId = dataPart.id;
				if (convId) {
					const fullTitle = part.data.value || "New Chat";

					// Clear any existing streaming interval
					if (streamingTitleRef.current.intervalId) {
						clearInterval(streamingTitleRef.current.intervalId);
					}

					// Reset streaming state
					streamingTitleRef.current = {
						fullTitle,
						currentIndex: 0,
						intervalId: undefined,
					};

					// Stream the title character by character
					const intervalId = setInterval(() => {
						const { fullTitle, currentIndex } = streamingTitleRef.current;

						if (currentIndex < fullTitle.length) {
							const streamedTitle = fullTitle.slice(0, currentIndex + 1);
							updateConversation(convId, {
								title: streamedTitle,
							});
							streamingTitleRef.current.currentIndex += 1;
						} else {
							// Streaming complete, clear the interval
							if (streamingTitleRef.current.intervalId) {
								clearInterval(streamingTitleRef.current.intervalId);
								streamingTitleRef.current.intervalId = undefined;
							}
						}
					}, 30); // Stream every 30ms for smooth effect

					streamingTitleRef.current.intervalId = intervalId;
				}
			}
		},
	});

	// conversation messages
	const { messages: loadedMessages, isLoadingMessages } = useMessageLoader(
		conversationId,
		false // Never a new chat in this route
	);

	// chat
	const { handleSubmit: submitChat, isCreatingConversation } = useChatSubmit({
		isNewChat: false, // Never a new chat in this route
		conversationId,
		sendMessage,
		selectedModel,
	});

	useEffect(() => {
		if (loadedMessages.length) {
			setMessages(loadedMessages);
		}
	}, [loadedMessages, setMessages]);

	// Load conversation details including model (title now comes from context)
	useEffect(() => {
		if (conversationId) {
			fetch(`/api/conversations/${conversationId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.modelId) {
						setSelectedModel(data.modelId);
					}
					// Read websearch from settings (preferred) or fallback to deprecated column
					if (data.settings?.websearch !== undefined) {
						setInitialWebSearch(data.settings.websearch);
					} else if (data.websearch !== undefined) {
						setInitialWebSearch(data.websearch);
					}
					if (data.settings?.extendedThinking !== undefined) {
						setInitialExtendedThinking(data.settings.extendedThinking);
					}
				})
				.catch((error) => {
					console.error("Error loading conversation:", error);
				});
		}
	}, [conversationId]);

	// Send pending message after mounting from new chat creation
	// Use a ref to track if we've already processed the pending message
	const pendingMessageProcessedRef = useRef(false);

	useEffect(() => {
		if (!pendingMessageProcessedRef.current) {
			const pendingMessage = sessionStorage.getItem("pendingMessage");
			const pendingFilesStr = sessionStorage.getItem("pendingFiles");

			if (pendingMessage) {
				// Mark as processed
				pendingMessageProcessedRef.current = true;

				// Clear them immediately to prevent double-sending
				sessionStorage.removeItem("pendingMessage");
				sessionStorage.removeItem("pendingFiles");

				// Parse files if they exist
				const pendingFiles = pendingFilesStr ? JSON.parse(pendingFilesStr) : [];

				// Send the message after the component has fully mounted
				sendMessage(
					{ text: pendingMessage, files: pendingFiles },
					{ body: { conversationId } }
				);
			}
		}
	}, [conversationId, sendMessage]);

	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const handleSubmit = useCallback(
		async (
			message: { text: string; files?: any[] },
			settings: { useWebSearch: boolean; useExtendedThinking: boolean }
		) => {
			if (status === "streaming" || status === "submitted") {
				return;
			}

			// Pass both text and files to submitChat with settings
			await submitChat(message.text, message.files || [], setInput, {
				useWebsearch: settings.useWebSearch,
				useExtendedThinking: settings.useExtendedThinking,
			});
		},
		[status, submitChat, setInput]
	);

	const handleRename = useCallback(
		async (conversationId: string, newTitle: string) => {
			// Title will be automatically synced from context, no need to set local state
			return await handleSidebarRename(conversationId, newTitle);
		},
		[handleSidebarRename]
	);

	// Cleanup streaming interval on unmount
	useEffect(() => {
		return () => {
			if (streamingTitleRef.current.intervalId) {
				clearInterval(streamingTitleRef.current.intervalId);
			}
		};
	}, []);

	// Check if chat is empty (no messages and not loading)
	const isChatEmpty = messages.length === 0 && !isLoadingMessages;

	return (
		<div className="flex h-screen bg-background">
			<Sidebar
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				currentConversationId={conversationId}
				onNewChat={handleNewChat}
				conversations={conversations}
				isLoadingConversations={isLoadingConversations}
				onDelete={handleDelete}
				onClearAll={handleClearAll}
				onRename={handleRename}
			/>
			<div className="flex-1 flex flex-col p-2 bg-sidebar">
				<div className="flex-1 flex flex-col bg-background rounded-md overflow-hidden">
					{/* Show header for specific chat */}
					{!isChatEmpty && (
						<ChatHeader
							sidebarOpen={sidebarOpen}
							onToggleSidebar={() => setSidebarOpen(true)}
							conversationId={conversationId}
							isNew={false}
							onDelete={handleDelete}
							onRename={handleRename}
						/>
					)}

					{/* Centered layout for empty chat */}
					{isChatEmpty ? (
						<div className="flex-1 flex flex-col items-center justify-center px-4">
							{/* Toggle sidebar button for empty state */}
							{!sidebarOpen && (
								<button
									onClick={() => setSidebarOpen(true)}
									className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line x1="3" y1="12" x2="21" y2="12"></line>
										<line x1="3" y1="6" x2="21" y2="6"></line>
										<line x1="3" y1="18" x2="21" y2="18"></line>
									</svg>
								</button>
							)}

							{/* Centered input */}
							<div className="w-full max-w-3xl">
								<ChatInput
									input={input}
									onInputChange={setInput}
									onSubmit={(message, event, settings) => {
										handleSubmit(message, settings);
									}}
									status={status}
									isCreatingConversation={isCreatingConversation}
									selectedModel={selectedModel}
									onModelChange={setSelectedModel}
									conversationId={conversationId}
									isNewChat={false}
									initialWebSearch={initialWebSearch}
									initialExtendedThinking={initialExtendedThinking}
								/>
							</div>
						</div>
					) : (
						/* Standard layout with messages */
						<div className="flex-1 overflow-hidden">
							<div className="mx-auto p-2 relative h-full">
								<div className="flex flex-col h-full gap-2">
									<MessageList
										ref={scrollAreaRef}
										messages={messages}
										status={status}
										isLoadingChatMessage={isLoadingMessages}
									/>
									<div className="flex flex-col gap-1">
										<ChatInput
											input={input}
											onInputChange={setInput}
											onSubmit={(message, event, options) => {
												handleSubmit(message, options);
											}}
											status={status}
											isCreatingConversation={isCreatingConversation}
											selectedModel={selectedModel}
											onModelChange={setSelectedModel}
											conversationId={conversationId}
											isNewChat={false}
											initialWebSearch={initialWebSearch}
											initialExtendedThinking={initialExtendedThinking}
										/>

										<p className="text-xs text-center text-muted-foreground">
											Nira can make mistakes. Check important info.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
