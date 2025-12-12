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

interface ClearAllChatsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void | Promise<void>;
	isClearing: boolean;
}

export function ClearAllChatsDialog({
	open,
	onOpenChange,
	onConfirm,
	isClearing,
}: ClearAllChatsDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-card border-border">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-foreground">
						Clear all chats?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-muted-foreground">
						This will permanently delete all conversations and their messages.
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isClearing}
						className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isClearing}
						className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
					>
						{isClearing ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Clearing...
							</>
						) : (
							"Clear all"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
