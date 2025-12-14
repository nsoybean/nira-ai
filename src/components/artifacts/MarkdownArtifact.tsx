"use client";

import { useState, useEffect } from "react";
import {
	Artifact,
	ArtifactHeader,
	ArtifactDescription,
	ArtifactTitle,
} from "@/components/ai-elements/artifact";
import {
	FileTextIcon,
	DownloadIcon,
	EyeIcon,
	CodeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	MarkdownArtifact as MarkdownArtifactType,
} from "@/lib/llmTools/createMarkdownFile";
import { DeepPartial } from "ai";
import { MessageResponse } from "../ai-elements/message";
import { FileMdIcon } from "@phosphor-icons/react";

interface MarkdownArtifactProps {
	artifactId: string;
	initialContent?: DeepPartial<MarkdownArtifactType>;
	version: string;
}

// Type guard to safely check if content is fully loaded
function isFullContent(
	content: DeepPartial<MarkdownArtifactType> | undefined
): content is MarkdownArtifactType {
	return !!(content?.title && content?.content);
}

export function MarkdownArtifact({
	artifactId,
	initialContent,
	version,
}: MarkdownArtifactProps) {
	const [content, setContent] = useState<
		DeepPartial<MarkdownArtifactType> | undefined
	>(initialContent);
	const [isLoading, setIsLoading] = useState(!initialContent);
	const [isOpen, setIsOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

	// Sync content when initialContent changes (for streaming updates)
	useEffect(() => {
		if (initialContent) {
			setContent(initialContent);
		}
	}, [initialContent]);

	// Fetch latest version on mount (handles page refresh)
	useEffect(() => {
		async function fetchLatest() {
			if (!artifactId) {
				return;
			}

			// Only set loading if we don't have initial content
			if (!initialContent) setIsLoading(true);

			try {
				const res = await fetch(`/api/artifacts/${artifactId}`);
				if (res.ok) {
					const artifact = await res.json();
					setContent(artifact.content);
				}
			} catch (error) {
				console.error("Failed to fetch latest artifact:", error);
			} finally {
				setIsLoading(false);
			}
		}
		fetchLatest();
	}, [artifactId, initialContent]);

	// Download markdown as file
	const handleDownload = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent opening the drawer
		if (!content?.content || !content?.title) return;

		const blob = new Blob([content.content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${content.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<>
			{/* Compact Card in Chat */}
			<Artifact
				className="cursor-pointer transition-colors shadow-2xs"
				onClick={() => setIsOpen(true)}
			>
				<ArtifactHeader className="bg-background hover:bg-accent/50">
					<div className="flex items-center gap-4 flex-1">
						<FileMdIcon />
						<div className="flex flex-col flex-1">
							<ArtifactTitle>
								{initialContent?.title || '<Undefined>'}
							</ArtifactTitle>

							<ArtifactDescription>Document · MD</ArtifactDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
							className="flex items-center gap-2"
						>
							<DownloadIcon className="size-4" />
							Download
						</Button>
					</div>
				</ArtifactHeader>
			</Artifact>

			{/* Side Drawer with Full Content */}
			{/* <Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
					<SheetHeader className="space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<SheetTitle className="text-2xl">{content.title}</SheetTitle>
								{content.description && (
									<p className="text-sm text-muted-foreground mt-2">
										{content.description}
									</p>
								)}
							</div>
						</div>

						<div className="flex items-center justify-between gap-2 pt-2 border-t">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setViewMode((prev) =>
										prev === "preview" ? "raw" : "preview"
									)
								}
								className="flex items-center gap-2"
							>
								{viewMode === "preview" ? (
									<>
										<CodeIcon className="size-4" />
										<span>Show Raw</span>
									</>
								) : (
									<>
										<EyeIcon className="size-4" />
										<span>Show Preview</span>
									</>
								)}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={handleDownload}
								className="flex items-center gap-2"
							>
								<DownloadIcon className="size-4" />
								Download
							</Button>
						</div>
					</SheetHeader>

					<div className="mt-6">
						{viewMode === "preview" ? (
							<MessageResponse>
								{content.content}
							</MessageResponse>

						) : (
							<div className="rounded-md border bg-muted/50 p-4">
								<pre className="font-mono text-sm whitespace-pre-wrap break-words">
									{content.content}
								</pre>
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet> */}
		</>
	);
}
