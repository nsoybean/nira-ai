"use client";

import { ArtifactWithContent } from "@/lib/types/artifacts";
import {
	getArtifactTitle,
	getArtifactIcon,
	formatArtifactDate,
} from "@/lib/utils/artifactUtils";
import { cn } from "@/lib/utils";

interface ArtifactListItemProps {
	artifact: ArtifactWithContent;
	isSelected?: boolean;
	onClick: () => void;
}

export function ArtifactListItem({
	artifact,
	isSelected = false,
	onClick,
}: ArtifactListItemProps) {

	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full p-2 flex items-start gap-3 transition-colors rounded-md",
				"hover:bg-accent cursor-pointer text-left",
				isSelected && "bg-accent/50 border-l-2 border-l-primary"
			)}
		>
			{/* Icon */}
			<div className="mt-0.5 shrink-0 flex items-center justify-center">
				<div className="">
					{getArtifactIcon(artifact.type)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="font-medium text-sm text-foreground truncate">
					{getArtifactTitle(artifact)}
				</div>
				<div className="text-xs text-muted-foreground mt-1">
					{formatArtifactDate(artifact.createdAt)}
				</div>
			</div>
		</button>
	);
}
