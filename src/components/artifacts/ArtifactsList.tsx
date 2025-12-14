"use client";

import { useArtifacts } from "@/contexts/ArtifactsContext";
import { ArtifactListItem } from "./ArtifactListItem";
import { EmptyArtifactsState } from "./EmptyArtifactsState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export function ArtifactsList() {
	const {
		artifacts,
		isLoadingArtifacts,
		selectedArtifactId,
		selectArtifact,
	} = useArtifacts();

	// Loading state
	if (isLoadingArtifacts) {
		return (
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Loading artifacts...
					</p>
				</div>
			</div>
		);
	}

	// Empty state
	if (artifacts.length === 0) {
		return <EmptyArtifactsState />;
	}

	// List view
	return (
		<ScrollArea className="flex-1">
			<div className="flex flex-col p-2">
				{artifacts.map((artifact) => (
					<ArtifactListItem
						key={artifact.id}
						artifact={artifact}
						isSelected={selectedArtifactId === artifact.id}
						onClick={() => selectArtifact(artifact.id)}
					/>
				))}
			</div>
		</ScrollArea>
	);
}
