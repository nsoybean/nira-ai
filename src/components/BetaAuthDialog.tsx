"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useBetaAuth } from "@/contexts/BetaAuthContext";

interface BetaAuthDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BetaAuthDialog({ open, onOpenChange }: BetaAuthDialogProps) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const { authenticate } = useBetaAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsVerifying(true);

		try {
			const success = await authenticate(password);

			if (success) {
				setPassword("");
				onOpenChange(false);
			} else {
				setError("Invalid password. Please try again.");
			}
		} catch (err) {
			setError("An error occurred. Please try again.");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setPassword("");
			setError("");
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Beta Access Required</DialogTitle>
					<DialogDescription>
						This app is currently in beta. Please enter the beta access password
						to continue.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter beta password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isVerifying}
								autoFocus
							/>
							{error && <p className="text-sm text-destructive">{error}</p>}
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isVerifying}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!password || isVerifying}>
							{isVerifying ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Unlock"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
