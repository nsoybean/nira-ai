"use client";

import { ShapesIcon } from "@phosphor-icons/react";

export function EmptyArtifactsState() {
	return (
		<div className="flex-1 flex items-center justify-center p-8">
			<div className="flex flex-col items-center gap-3 text-center max-w-sm">
				<div className="p-4 rounded-full bg-muted">
					<ShapesIcon className="h-8 w-8 text-muted-foreground" />
				</div>
				<div>
					<h3 className="font-medium text-foreground mb-1">
						No artifacts yet
					</h3>
					<p className="text-sm text-muted-foreground">
						Artifacts you create will appear here
					</p>
				</div>
			</div>
		</div>
	);
}
