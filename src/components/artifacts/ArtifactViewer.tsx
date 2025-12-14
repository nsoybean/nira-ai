"use client";

import { useState, useEffect } from "react";
import { SlidesOutlineArtifact } from "./SlidesOutlineArtifact";
import { MarkdownArtifact } from "./MarkdownArtifact";
import { Loader2, AlertCircle } from "lucide-react";
import { ArtifactWithContent } from "@/lib/types/artifacts";

interface ArtifactViewerProps {
	artifactId: string;
}

/**
 * Type Registry: Maps artifact types to their renderer components
 * To add a new artifact type, simply add an entry here
 */
const ARTIFACT_RENDERERS: Record<
	string,
	React.ComponentType<{
		artifactId: string;
		initialContent?: any;
		version: string;
	}>
> = {
	slidesOutline: SlidesOutlineArtifact,
	markdown: MarkdownArtifact,
};

export function ArtifactViewer({ artifactId }: ArtifactViewerProps) {
	const [artifact, setArtifact] = useState<ArtifactWithContent | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch artifact data
	useEffect(() => {
		async function fetchArtifact() {
			try {
				setIsLoading(true);
				setError(null);

				const response = await fetch(`/api/artifacts/${artifactId}`);

				if (!response.ok) {
					throw new Error(
						`Failed to fetch artifact: ${response.statusText}`
					);
				}

				const data = await response.json();
				setArtifact(data);
			} catch (err) {
				console.error("Error fetching artifact:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load artifact"
				);
			} finally {
				setIsLoading(false);
			}
		}

		if (artifactId) {
			fetchArtifact();
		}
	}, [artifactId]);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Loading artifact...
					</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error || !artifact) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="flex flex-col items-center gap-3 text-center max-w-sm">
					<div className="p-4 rounded-full bg-destructive/10">
						<AlertCircle className="h-8 w-8 text-destructive" />
					</div>
					<div>
						<h3 className="font-medium text-foreground mb-1">
							Failed to load artifact
						</h3>
						<p className="text-sm text-muted-foreground">
							{error || "Artifact not found"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Get appropriate renderer for artifact type
	const Renderer = ARTIFACT_RENDERERS[artifact.type];

	// Unsupported type
	if (!Renderer) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="flex flex-col items-center gap-3 text-center max-w-sm">
					<div className="p-4 rounded-full bg-muted">
						<AlertCircle className="h-8 w-8 text-muted-foreground" />
					</div>
					<div>
						<h3 className="font-medium text-foreground mb-1">
							Unsupported artifact type
						</h3>
						<p className="text-sm text-muted-foreground">
							Type: {artifact.type}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Render artifact with appropriate component
	return (
		<div className="flex-1 overflow-auto">
			<Renderer
				artifactId={artifact.id}
				initialContent={artifact.content}
				version={artifact.version}
			/>
		</div>
	);
}
