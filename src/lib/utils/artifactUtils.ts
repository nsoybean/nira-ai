import { formatDistanceToNow, differenceInHours, format } from "date-fns";
import { FileText, Presentation, File, type LucideIcon } from "lucide-react";
import { ArtifactWithContent } from "@/lib/types/artifacts";
import { SlidesOutlineArtifact } from "@/lib/llmTools/createSlidesOutline";
import { MarkdownArtifact } from "@/lib/llmTools/createMarkdownFile";
import { FileMdIcon } from "@phosphor-icons/react";

/**
 * Extract title from artifact based on its type
 */
export function getArtifactTitle(artifact: ArtifactWithContent): string {
	// Handle slides outline
	if (
		artifact.type === "slidesOutline" ||
		artifact.type === "artifact_type_slides_outline"
	) {
		const content = artifact.content as SlidesOutlineArtifact;
		return content?.outline?.pptTitle || "Untitled Presentation";
	}

	// Handle markdown
	if (
		artifact.type === "markdown" ||
		artifact.type === "artifact_type_document"
	) {
		const content = artifact.content as MarkdownArtifact;
		return content?.title || "Untitled Document";
	}

	// Fallback for unknown types
	return "Unknown Artifact";
}

/**
 * Get appropriate icon for artifact type
 */
export function getArtifactIcon(type: string): LucideIcon {
	const iconMap: Record<string, LucideIcon> = {
		slidesOutline: Presentation,
		markdown: FileMdIcon,
	};

	return iconMap[type] || File;
}

/**
 * Format artifact date as relative time (if less than 24 hours) or absolute date
 * Example: "2 hours ago" or "Dec 12, 2025 at 3:45 PM"
 */
export function formatArtifactDate(date: Date | string): string {
	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;
		const hoursDiff = differenceInHours(new Date(), dateObj);

		// Show relative time if less than 24 hours
		if (hoursDiff < 24) {
			return formatDistanceToNow(dateObj, { addSuffix: true });
		}

		// Show absolute date time if 24 hours or more
		return format(dateObj, "MMM d, yyyy 'at' h:mm a");
	} catch (error) {
		console.error("Error formatting artifact date:", error);
		return "Unknown date";
	}
}
