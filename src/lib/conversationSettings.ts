/**
 * Conversation settings stored in the settings JSON column
 */
export interface ConversationSettings {
	extendedThinking: boolean;
	websearch: boolean;
	// Future settings can be added here without schema changes
}

/**
 * Default values for conversation settings
 */
export const DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
	extendedThinking: false,
	websearch: false,
};

/**
 * Helper to merge partial settings with defaults
 */
export function mergeConversationSettings(
	settings: Partial<ConversationSettings> | null | undefined
): ConversationSettings {
	return {
		...DEFAULT_CONVERSATION_SETTINGS,
		...settings,
	};
}
