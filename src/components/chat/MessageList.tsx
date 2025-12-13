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
import { Image } from "../ai-elements/image";
import { SlidesOutlineArtifact } from "../artifacts/SlidesOutlineArtifact";
import { MyUIMessage } from "@/lib/UIMessage";
import { Shimmer } from "../ai-elements/shimmer";

// Helper function to parse artifact XML output
function parseArtifactXML(
	xmlString: string
): { id: string; version: string } | null {
	try {
		const idMatch = xmlString.match(/id="([^"]+)"/);
		const versionMatch = xmlString.match(/version="([^"]+)"/);

		if (idMatch && versionMatch) {
			return { id: idMatch[1], version: versionMatch[1] };
		}
	} catch (error) {
		console.error("Failed to parse artifact XML:", error);
	}
	return null;
}

interface MessageListProps {
	messages: MyUIMessage[];
	status: ChatStatus;
	isLoadingChatMessage?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
	(
		{ messages, status, isLoadingChatMessage: isLoadingMessages = false },
		ref
	) => {
		const isLoading = status === "submitted" || status === "streaming";
		const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

		const handleCopy = (text: string, messageId: string) => {
			navigator.clipboard.writeText(text);
			setCopiedMessageId(messageId);
			setTimeout(() => {
				setCopiedMessageId(null);
			}, 2000);
		};

		return (
			<Conversation>
				<ConversationContent className="max-w-4xl mx-auto max-h-[100%]">
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
									<Sources key={`sources-${message.id}-${msgIndex}`}>
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
																<MessageAction onClick={() => { }} label="Retry">
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
												<ReasoningContent className="pl-4">
													{part.text}
												</ReasoningContent>
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
										const webSearchPart = part;

										return (
											<Sources key={`webSearch-${message.id}-${i}`}>
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
															? `result${webSearchPart?.output?.results.length > 1
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
										const webExtractPart = part;

										return (
											<Sources key={`webExtract-${message.id}-${i}`}>
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
										const imageGenerationPart = part;
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

									// rendering data parts: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data#rendering-persistent-data-parts
									// note: ephemeral data parts, not stored in message.parts, simply for streaming
									case "data-slidesOutline":
										const artifact = part.data;
										switch (artifact.status) {
											case "starting":
												return (
													<div
														key={`artifact-loading-${part.id}-${msgIndex}`}
														className="mt-2 mb-10 text-muted-foreground"
													>
														<Shimmer>
															Starting slides generation...
														</Shimmer>
													</div>
												);

											case "in_progress":
												return (
													<div
														key={`artifact-streaming-${part.id}-${msgIndex}`}
														className="mt-2 mb-10 max-w-[80%]"
													>
														<SlidesOutlineArtifact
															artifactId={part.id ?? "unknown"}
															initialContent={artifact.content}
															version="1"
														/>
													</div>
												);

											default:
												return null;
										}

									case "tool-createSlidesOutline":
										if (part.state === "output-available" && part.output) {
											return (
												<div
													key={`artifact-${part.output.artifactId}-${msgIndex}`}
													className="mt-2 mb-10 max-w-[80%]"
												>
													<SlidesOutlineArtifact
														artifactId={part.output.artifactId}
														version={part.output.version}
													/>
												</div>
											);
										}

									default:
										return null;
								}
							})}
						</div>
					))}

					{/* streaming loader, animate */}
					{status === "submitted" ||
						(status === "streaming" && (
							<Loader className="h-6 w-6 text-muted-foreground animate-spin" />
						))}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		);
	}
);
