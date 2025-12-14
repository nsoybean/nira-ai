"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useMemo,
	ReactNode,
} from "react";
import { ArtifactWithContent } from "@/lib/types/artifacts";

interface ArtifactsContextType {
	// Panel state
	isPanelOpen: boolean;
	selectedArtifactId: string | null; // null = list view, string = viewer mode

	// Data state
	artifacts: ArtifactWithContent[];
	isLoadingArtifacts: boolean;

	// Actions
	openPanel: (artifactId?: string) => void; // Opens panel, optionally to specific artifact
	closePanel: () => void; // Closes panel and resets to list view
	selectArtifact: (artifactId: string | null) => void; // null = back to list, string = view artifact
	fetchArtifacts: (conversationId: string) => Promise<void>;
	refreshArtifacts: () => Promise<void>;
}

const ArtifactsContext = createContext<ArtifactsContextType | undefined>(
	undefined
);

interface ArtifactsProviderProps {
	children: ReactNode;
	conversationId: string;
}

export function ArtifactsProvider({
	children,
	conversationId,
}: ArtifactsProviderProps) {
	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
		null
	);
	const [artifacts, setArtifacts] = useState<ArtifactWithContent[]>([]);
	const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);

	// Fetch artifacts for a conversation
	const fetchArtifacts = useCallback(async (convId: string) => {
		try {
			setIsLoadingArtifacts(true);
			const response = await fetch(
				`/api/artifacts/conversation/${convId}`
			);

			if (!response.ok) {
				console.error("Failed to load artifacts:", response.statusText);
				return;
			}

			const data = await response.json();
			setArtifacts(data);
		} catch (error) {
			console.error("Error loading artifacts:", error);
		} finally {
			setIsLoadingArtifacts(false);
		}
	}, []);

	// Refresh artifacts (re-fetch for current conversation)
	const refreshArtifacts = useCallback(async () => {
		if (conversationId) {
			await fetchArtifacts(conversationId);
		}
	}, [conversationId, fetchArtifacts]);

	// Auto-fetch artifacts when conversationId changes
	useEffect(() => {
		if (conversationId) {
			fetchArtifacts(conversationId);
		}

		// Reset state when conversation changes
		return () => {
			setIsPanelOpen(false);
			setSelectedArtifactId(null);
		};
	}, [conversationId, fetchArtifacts]);

	// Open panel (optionally to a specific artifact)
	const openPanel = useCallback((artifactId?: string) => {
		setIsPanelOpen(true);
		if (artifactId) {
			setSelectedArtifactId(artifactId);
		}
	}, []);

	// Close panel and reset to list view
	const closePanel = useCallback(() => {
		setIsPanelOpen(false);
		setSelectedArtifactId(null);
	}, []);

	// Select artifact (null = back to list, string = view artifact)
	const selectArtifact = useCallback((artifactId: string | null) => {
		setSelectedArtifactId(artifactId);
	}, []);

	// Memoize context value to prevent unnecessary re-renders
	const value = useMemo(
		() => ({
			isPanelOpen,
			selectedArtifactId,
			artifacts,
			isLoadingArtifacts,
			openPanel,
			closePanel,
			selectArtifact,
			fetchArtifacts,
			refreshArtifacts,
		}),
		[
			isPanelOpen,
			selectedArtifactId,
			artifacts,
			isLoadingArtifacts,
			openPanel,
			closePanel,
			selectArtifact,
			fetchArtifacts,
			refreshArtifacts,
		]
	);

	return (
		<ArtifactsContext.Provider value={value}>
			{children}
		</ArtifactsContext.Provider>
	);
}

/**
 * Hook to use artifacts context
 * Must be used within ArtifactsProvider
 */
export function useArtifacts() {
	const context = useContext(ArtifactsContext);
	if (context === undefined) {
		throw new Error("useArtifacts must be used within ArtifactsProvider");
	}
	return context;
}
