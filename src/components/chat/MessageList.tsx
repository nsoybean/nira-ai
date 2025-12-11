"use client";

import { ChatStatus, UIMessage } from "ai";
import {
	Loader2,
	Loader,
	CopyIcon,
	RefreshCcwIcon,
	Check,
	GlobeIcon,
	BookIcon,
	ChevronDownIcon,
	XIcon,
	BrainIcon,
} from "lucide-react";
import { forwardRef, useState } from "react";
import {
	Message,
	MessageContent,
	MessageResponse,
	MessageActions,
	MessageAction,
	MessageAttachment,
} from "../ai-elements/message";
import {
	Reasoning,
	ReasoningTrigger,
	ReasoningContent,
} from "../ai-elements/reasoning";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "../ai-elements/conversation";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "../ai-elements/sources";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
	webSearchToolUIPart,
	webExtractToolUIPart,
	imageGenerationToolUIPart,
} from "@/types/tools";
import { Image } from "../ai-elements/image";

interface MessageListProps {
	messages: UIMessage[];
	status: ChatStatus;
	isLoadingChatMessage?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
	({ messages, status, isLoadingChatMessage: isLoadingMessages = false }, ref) => {
		const isLoading = status === "submitted" || status === "streaming";
		const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

		const handleCopy = (text: string, messageId: string) => {
			navigator.clipboard.writeText(text);
			setCopiedMessageId(messageId);
			setTimeout(() => {
				setCopiedMessageId(null);
			}, 2000);
		};

		/**
		 * @deprecated
		 * @param message
		 * @param isLastMessage 
		 * @param isLoading 
		 * @returns 
		 */
		function renderMessageContent(
			message: UIMessage,
			isLastMessage: boolean,
			isLoading: boolean
		) {
			const allText = message.parts
				.filter((p) => p.type === "text" && p.text)
				.map((p: any) => p.text)
				.join("");

			// Check if message has any reasoning or tool parts that need timeline
			const hasTimelineParts = message.parts.some(
				(p) =>
					p.type === "reasoning" ||
					p.type === "tool-webSearch" ||
					p.type === "tool-webExtract" ||
					p.type === "step-start"
			);

			const textParts = message.parts.filter(
				(p) => p.type === "text" && p.text
			);

			return (
				<Message from={"assistant"} key={message.id}>
					<div className={cn("flex flex-col gap-4")}>
						{/* Timeline - wrap all reasoning and tools in single ChainOfThought */}
						{hasTimelineParts && (
							<div className="w-full space-y-2">
								{message.parts.map((part: any, partIndex) => {
									const isLastPart = partIndex === message.parts.length - 1;
									const isStreaming =
										status === "streaming" && isLastPart && isLastMessage;

									// Reasoning step
									if (part.type === "reasoning" && part.text) {
										return (
											<Collapsible
												key={`${message.id}-reasoning-${partIndex}`}
												defaultOpen={isStreaming && isLastPart}
											>
												<div className="flex gap-2 text-sm">
													<div className="relative mt-0.5">
														<div className="size-4 flex items-center justify-center">
															{/* <div
                              className={cn(
                                "size-2 rounded-full",
                                isStreaming
                                  ? "bg-info animate-pulse"
                                  : "bg-muted-foreground"
                              )}
                            /> */}
															<BrainIcon className="size-4" />
														</div>
														{!isLastPart && (
															<div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
														)}
													</div>
													<div className="flex-1 space-y-2 pb-2">
														<CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
															<span className="font-medium text-sm">
																Reasoning
															</span>
															<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
														</CollapsibleTrigger>
														<CollapsibleContent>
															<div className="relative max-h-[400px] overflow-y-auto">
																<div className="text-sm text-foreground whitespace-pre-wrap pr-2">
																	{part.text}
																</div>
																{/* Fade gradient at bottom */}
																<div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
															</div>
														</CollapsibleContent>
													</div>
												</div>
											</Collapsible>
										);
									}

									// Web search tool step
									if (part.type === "tool-webSearch") {
										const output = part?.output;
										const input = part?.input;
										const resultsCount = output?.results?.length || 0;
										const query = input?.query;
										const isToolLoading = !output?.results;

										return (
											<Collapsible
												key={`${message.id}-websearch-${partIndex}`}
												defaultOpen={false}
											>
												<div className="flex gap-2 text-sm">
													<div className="relative mt-0.5">
														<GlobeIcon className="size-4" />
														{!isLastPart && (
															<div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
														)}
													</div>
													<div className="flex-1 space-y-2 pb-2">
														<CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
															<span className="font-medium text-sm flex-1 text-left">
																{query || "Web search"}
															</span>
															{resultsCount > 0 && (
																<span className="text-xs text-muted-foreground">
																	{resultsCount} result
																	{resultsCount > 1 ? "s" : ""}
																</span>
															)}
															<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
														</CollapsibleTrigger>
														<CollapsibleContent>
															{output?.results && (
																<div className="relative max-h-[220px] overflow-y-auto">
																	<div className="pr-2">
																		{output.results.map(
																			(result: any, i: number) => {
																				let domain = "";
																				try {
																					const url = new URL(result.url);
																					domain = url.hostname.replace(
																						"www.",
																						""
																					);
																				} catch (e) {
																					domain = result.url;
																				}

																				return (
																					<a
																						key={`${message.id}-websearch-result-${i}`}
																						href={result.url}
																						target="_blank"
																						rel="noreferrer"
																						className="flex items-start gap-2 hover:bg-accent -mx-2 px-4 py-2 rounded transition-colors"
																					>
																						<div className="flex flex-row items-center gap-1 flex-1 min-w-0">
																							<img
																								src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
																								alt={`${domain} logo`}
																								className="size-4 rounded-sm shrink-0 bg-white"
																							/>
																							<div className="text-sm font-medium text-foreground truncate">
																								{result.title || result.url}
																							</div>
																							<div className="text-xs text-muted-foreground">
																								{domain}
																							</div>
																						</div>
																					</a>
																				);
																			}
																		)}
																	</div>
																	{/* Fade gradient at bottom */}
																	<div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
																</div>
															)}
														</CollapsibleContent>
													</div>
												</div>
											</Collapsible>
										);
									}

									// Web extract tool step
									if (part.type === "tool-webExtract") {
										const input = part?.input;
										const numUrls = input?.urls?.length || 0;
										const output = part?.output;
										const successCount = output?.results?.length || 0;
										const failCount = output?.failedResults?.length || 0;
										const isToolLoading = output?.responseTime === undefined;

										return (
											<Collapsible
												key={`${message.id}-webextract-${partIndex}`}
												defaultOpen={false}
											>
												<div className="flex gap-2 text-sm">
													<div className="relative mt-0.5">
														<BookIcon className="size-4" />
														{!isLastPart && (
															<div className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
														)}
													</div>
													<div className="flex-1 space-y-2 pb-2">
														<CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors group w-full">
															<span className="font-medium text-sm flex-1 text-left">
																Reading {numUrls} page{numUrls > 1 ? "s" : ""}
															</span>
															{(successCount > 0 || failCount > 0) && (
																<span className="text-xs text-muted-foreground">
																	{`${successCount} success ${
																		failCount ? `, ${failCount} failed` : ""
																	}`.trim()}
																</span>
															)}
															<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
														</CollapsibleTrigger>
														<CollapsibleContent>
															<div className="relative max-h-[220px] overflow-y-auto">
																<div className="pr-2">
																	{/* Success Results */}
																	{output?.results?.map(
																		(result: any, i: number) => {
																			let domain = "";
																			try {
																				const url = new URL(result.url);
																				domain = url.hostname.replace(
																					"www.",
																					""
																				);
																			} catch (e) {
																				domain = result.url;
																			}

																			return (
																				<a
																					key={`${message.id}-extract-success-${i}`}
																					href={result.url}
																					target="_blank"
																					rel="noreferrer"
																					className="flex items-start gap-2 hover:bg-accent -mx-2 px-4 py-2 rounded transition-colors"
																				>
																					<div className="flex flex-row items-center gap-1 flex-1 min-w-0">
																						<img
																							src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
																							alt={`${domain} logo`}
																							className="size-4 rounded-sm shrink-0 bg-white"
																						/>
																						<div className="text-sm text-foreground truncate max-w-lg">
																							{result.url}
																						</div>
																					</div>
																				</a>
																			);
																		}
																	)}

																	{/* Failed Results */}
																	{output?.failedResults?.map(
																		(failed: any, i: number) => (
																			<div
																				key={`${message.id}-extract-fail-${i}`}
																				className="flex items-start gap-2 text-sm hover:bg-accent -mx-2 px-2 py-2 rounded"
																			>
																				<XIcon
																					size={16}
																					className="text-destructive mt-0.5 shrink-0"
																				/>
																				<div className="flex-1 min-w-0">
																					<a
																						href={failed.url}
																						target="_blank"
																						rel="noreferrer"
																						className="text-sm text-foreground truncate block max-w-lg"
																					>
																						{failed.url}
																					</a>
																					<p className="text-xs text-muted-foreground mt-1">
																						{failed.error}
																					</p>
																				</div>
																			</div>
																		)
																	)}
																</div>
																{/* Fade gradient at bottom */}
																<div className="sticky bottom-0 h-8 bg-linear-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
															</div>
														</CollapsibleContent>
													</div>
												</div>
											</Collapsible>
										);
									}

									return null;
								})}
							</div>
						)}

						{/* Text content - render all text parts as messages */}
						{textParts.map((part: any, textIndex) => (
							<MessageContent
								key={`${message.id}-text-${textIndex}`}
								className="max-w-full"
							>
								<MessageResponse>{part.text}</MessageResponse>
							</MessageContent>
						))}

						{/* Show copy action once complete - only after last text group */}
						{!isLoading && allText && (
							<MessageActions className="ml-auto">
								<MessageAction
									onClick={() => handleCopy(allText, message.id)}
									label={copiedMessageId === message.id ? "Copied" : "Copy"}
								>
									{copiedMessageId === message.id ? (
										<Check className="size-3" />
									) : (
										<CopyIcon className="size-3" />
									)}
								</MessageAction>
							</MessageActions>
						)}

						{/* Reminder note - only show on last message */}
						{isLastMessage && (
							<div className="ml-auto">
								<p className="text-xs text-center text-muted-foreground mt-1">
									Nira can make mistakes. Check important info.
								</p>
							</div>
						)}
					</div>
				</Message>
			);
		}

		return (
			<Conversation>
				<ConversationContent className="max-w-4xl mx-auto">
					{/* loading */}
					{isLoadingMessages && !messages.length && (
						<div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
							<Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
							<div>
								<h2 className="text-xl font-medium mb-2 text-foreground">
									Loading messages...
								</h2>
								<p className="text-sm text-muted-foreground">Please wait</p>
							</div>
						</div>
					)}

					{/* messages */}
					{messages.map((message, msgIndex) => (
						<div key={message.id}>
							{/* source url */}
							{message.role === "assistant" &&
								message.parts.filter((part) => part.type === "source-url")
									.length > 0 && (
									<Sources>
										<SourcesTrigger
											count={
												message.parts.filter(
													(part) => part.type === "source-url"
												).length
											}
											label={"Sources"}
											resultLabel="results"
										/>
										{message.parts
											.filter((part) => part.type === "source-url")
											.map((part, i) => (
												<SourcesContent key={`${message.id}-${i}`}>
													<Source
														key={`${message.id}-${i}`}
														href={part.url}
														title={part.url}
													/>
												</SourcesContent>
											))}
									</Sources>
								)}

							{/* text */}
							{message.parts.map((part, i) => {
								switch (part.type) {
									case "text":
										const isLastMessage = msgIndex === messages.length - 1;

										return (
											<Message
												key={`${message.id}-${i}`}
												from={message.role}
												className="mb-2"
											>
												<MessageContent>
													<MessageResponse>{part.text}</MessageResponse>
												</MessageContent>

												{/* show action only for last text part */}
												{message.role === "assistant" && (
													<MessageActions>
														{isLastMessage &&
															i === message.parts.length - 1 && (
																<MessageAction onClick={() => {}} label="Retry">
																	<RefreshCcwIcon className="size-3" />
																</MessageAction>
															)}
														{isLastMessage &&
															i === message.parts.length - 1 && (
																<MessageAction
																	onClick={() => {
																		handleCopy(part.text, message.id);
																	}}
																	label={
																		copiedMessageId === message.id
																			? "Copied"
																			: "Copy"
																	}
																>
																	{copiedMessageId === message.id ? (
																		<Check className="size-3" />
																	) : (
																		<CopyIcon className="size-3" />
																	)}
																</MessageAction>
															)}
													</MessageActions>
												)}
											</Message>
										);

									case "reasoning":
										return (
											<Reasoning
												key={`${message.id}-${i}`}
												className="w-full"
												isStreaming={
													status === "streaming" &&
													i === message.parts.length - 1 &&
													message.id === messages.at(-1)?.id
												}
											>
												<ReasoningTrigger />
												<ReasoningContent>{part.text}</ReasoningContent>
											</Reasoning>
										);

									case "file":
										return (
											<MessageAttachment
												key={`${message.id}-${i}`}
												data={part}
												className="ml-auto border border-gray-250 rounded-md mb-2"
											/>
										);

									case "tool-webSearch":
										const webSearchPart = part as webSearchToolUIPart;

										return (
											<Sources>
												<SourcesTrigger
													count={webSearchPart?.output?.results?.length || 0}
													label={
														webSearchPart?.input?.query
															? // capitalize first letter
																webSearchPart?.input?.query
																	.charAt(0)
																	.toUpperCase() +
																webSearchPart?.input?.query.slice(1)
															: "Web search"
													}
													isLoading={!webSearchPart?.output?.results?.length}
													resultLabel={
														webSearchPart?.output?.results != undefined &&
														webSearchPart?.output?.results?.length > 0
															? `result${
																	webSearchPart?.output?.results.length > 1
																		? "s"
																		: ""
																}`
															: ""
													}
												/>
												<SourcesContent
													key={`${message.id}-${webSearchPart.toolCallId}`}
													className="ml-2 pl-4 border-l"
												>
													{webSearchPart?.output?.results?.map(
														(result: any, i: number) => {
															let domain = "";
															try {
																const url = new URL(result.url);
																domain = url.hostname.replace("www.", "");
															} catch (e) {
																domain = result.url;
															}

															return (
																<Source
																	key={`${message.id}-websearch-result-${i}`}
																	href={result.url}
																	title={result.title}
																	icon={
																		<img
																			src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
																			alt={`${domain} logo`}
																			className="size-5 rounded-sm shrink-0 bg-white"
																		/>
																	}
																/>
															);
														}
													)}
												</SourcesContent>
											</Sources>
										);

									case "tool-webExtract":
										const webExtractPart = part as webExtractToolUIPart;

										return (
											<Sources>
												<SourcesTrigger
													count={undefined}
													resultLabel={""}
													label={isLoading ? "Reading web" : "Read web"}
													icon={<BookIcon className="h-4 w-4" />}
													disableResultCount={true}
												/>
												<SourcesContent
													key={`${message.id}-${webExtractPart.toolCallId}`}
													className="ml-2 pl-4 border-l"
												>
													{/* successful */}
													{webExtractPart?.output?.results?.map(
														(result: any, i: number) => {
															let domain = "";
															try {
																const url = new URL(result.url);
																domain = url.hostname.replace("www.", "");
															} catch (e) {
																domain = result.url;
															}

															return (
																<Source
																	key={`${message.id}-websearch-result-${i}`}
																	href={result.url}
																	title={result.url}
																	icon={
																		<img
																			src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
																			alt={`${domain} logo`}
																			className="size-5 rounded-sm shrink-0 bg-white"
																		/>
																	}
																/>
															);
														}
													)}

													{webExtractPart?.output?.failedResults?.map(
														(failedResult: any, i: number) => {
															let domain = "";
															try {
																const url = new URL(failedResult.url);
																domain = url.hostname.replace("www.", "");
															} catch (e) {
																domain = failedResult.url;
															}

															return (
																<Source
																	key={`${message.id}-websearch-result-${i}`}
																	href={failedResult.url}
																	className="flex flex-row items-center space-x-2"
																	children={
																		<>
																			<img
																				src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV}`}
																				alt={`${domain} logo`}
																				className="size-5 rounded-sm shrink-0 bg-white"
																			/>
																			<XIcon
																				size={16}
																				className="text-destructive mt-0.5 shrink-0"
																			/>
																			<span className="block font-medium">
																				{failedResult.url}
																			</span>
																			<p className="text-xs text-muted-foreground mt-1">
																				{failedResult.error}
																			</p>
																		</>
																	}
																/>
															);
														}
													)}
												</SourcesContent>
											</Sources>
										);

									case "tool-image_generation":
										const imageGenerationPart =
											part as imageGenerationToolUIPart;
										const image = {
											base64: imageGenerationPart.output?.result || "",
											mediaType: "image/jpeg",
											uint8Array: new Uint8Array([]),
										};

										return (
											image.base64 && (
												<Image
													{...image}
													alt="Example generated image"
													className="aspect-square h-[150px] border"
												/>
											)
										);
									default:
										console.log("part", part);
										return null;
								}
							})}
						</div>
					))}



					{/* streaming loader, animate */}
					{status === "submitted"  || status==='streaming' && <Loader className="h-6 w-6 text-muted-foreground animate-spin" />}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		);
	}
);
