"use client";

import { useArtifacts } from "@/contexts/ArtifactsContext";
import { ArtifactsList } from "./ArtifactsList";
import { ArtifactViewer } from "./ArtifactViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

export function ArtifactsPanel() {
	const { selectedArtifactId, selectArtifact, closePanel, artifacts } =
		useArtifacts();

	// Viewer mode: Show artifact with back button
	if (selectedArtifactId) {
		return (
			<div className="flex flex-col h-full bg-background">
				{/* Header with back button */}
				<div className="flex items-center gap-2 p-2 shrink-0">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => selectArtifact(null)}
						className="h-8 w-8"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<span className="font-medium text-sm">Artifacts</span>
				</div>

				{/* Artifact viewer */}
				<div className="p-2">
					<ArtifactViewer artifactId={selectedArtifactId} />
				</div>
			</div>
		);
	}

	// List mode: Show all artifacts
	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header with close button */}
			<div className="flex items-center p-2 justify-between shrink-0">
				<span className="font-medium text-sm">
					Artifacts ({artifacts.length})
				</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={closePanel}
					className="h-8 w-8"
				>
					<X className="h-4 w-4" />
				</Button>
			</div >

			{/* Artifacts list */}
			< ArtifactsList />
		</div >
	);
}
