"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteConversationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void | Promise<void>;
	isDeleting: boolean;
}

export function DeleteConversationDialog({
	open,
	onOpenChange,
	onConfirm,
	isDeleting,
}: DeleteConversationDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-card border-border">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-foreground">
						Delete conversation?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-muted-foreground">
						This will permanently delete this conversation and all its messages.
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isDeleting}
						className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isDeleting}
						className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
					>
						{isDeleting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Deleting...
							</>
						) : (
							"Delete"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
