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
	const Icon = getArtifactIcon(artifact.type);
	const title = getArtifactTitle(artifact);
	const formattedDate = formatArtifactDate(artifact.createdAt);

	return (
		<button
			onClick={onClick}
			className={cn(
				"w-full p-4 flex items-start gap-3 border-b transition-colors",
				"hover:bg-accent cursor-pointer text-left",
				isSelected && "bg-accent/50 border-l-2 border-l-primary"
			)}
		>
			{/* Icon */}
			<div className="mt-0.5 shrink-0">
				<Icon className="h-5 w-5 text-muted-foreground" />
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="font-medium text-sm text-foreground truncate">
					{title}
				</div>
				<div className="text-xs text-muted-foreground mt-1">
					{formattedDate}
				</div>
			</div>
		</button>
	);
}
