"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface RenameConversationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (newTitle: string) => void | Promise<void>;
	currentTitle: string;
	isRenaming: boolean;
}

export function RenameConversationDialog({
	open,
	onOpenChange,
	onConfirm,
	currentTitle,
	isRenaming,
}: RenameConversationDialogProps) {
	const [title, setTitle] = useState(currentTitle);

	useEffect(() => {
		setTitle(currentTitle);
	}, [currentTitle, open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (title.trim() && title !== currentTitle) {
			onConfirm(title.trim());
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-card border-border sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-foreground">
						Rename conversation
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Enter a new title for this conversation.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Conversation title"
							className="bg-background border-input text-foreground"
							disabled={isRenaming}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isRenaming}
							className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isRenaming || !title.trim() || title === currentTitle}
							className="bg-info hover:bg-info/90 text-info-foreground"
						>
							{isRenaming ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Renaming...
								</>
							) : (
								"Rename"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
