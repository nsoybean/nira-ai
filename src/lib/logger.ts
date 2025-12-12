/**
 * Logger utility for consistent logging across the application
 * Supports log levels: log, debug, warn, error
 * Handles both text and JSON payloads with pretty formatting
 */

export enum LogLevel {
	LOG = "log",
	DEBUG = "debug",
	WARN = "warn",
	ERROR = "error",
}

interface LoggerOptions {
	prefix?: string;
	enabledInProduction?: boolean;
	minLevel?: LogLevel;
	metadata?: Record<string, string | number>;
}

class Logger {
	private prefix: string;
	private enabledInProduction: boolean;
	private minLevel: LogLevel;
	private metadata: Record<string, string | number>;
	private levelPriority: Record<LogLevel, number> = {
		[LogLevel.DEBUG]: 0,
		[LogLevel.LOG]: 1,
		[LogLevel.WARN]: 2,
		[LogLevel.ERROR]: 3,
	};

	constructor(options: LoggerOptions = {}) {
		this.prefix = options.prefix || "";
		this.enabledInProduction = options.enabledInProduction || false;
		this.minLevel = options.minLevel || LogLevel.DEBUG;
		this.metadata = options.metadata || {};
	}

	/**
	 * Check if logging should be enabled based on environment and settings
	 */
	private shouldLog(level: LogLevel): boolean {
		const isDevelopment = process.env.NODE_ENV === "development";
		const levelMeetsThreshold =
			this.levelPriority[level] >= this.levelPriority[this.minLevel];

		if (isDevelopment) {
			return levelMeetsThreshold;
		}

		return this.enabledInProduction && levelMeetsThreshold;
	}

	/**
	 * Format the log message with timestamp, prefix, and metadata
	 */
	private formatMessage(level: LogLevel, message: string): string {
		const timestamp = new Date().toISOString();
		const levelTag = level.toUpperCase().padEnd(5);
		const prefixTag = this.prefix ? `[${this.prefix}]` : "";

		// Format metadata as key=value pairs
		const metadataStr =
			Object.keys(this.metadata).length > 0
				? Object.entries(this.metadata)
						.map(([key, value]) => `${key}=${value}`)
						.join(" ")
				: "";

		const metadataTag = metadataStr ? `[${metadataStr}]` : "";

		return `${timestamp} ${levelTag} ${prefixTag}${metadataTag} ${message}`;
	}

	/**
	 * Pretty print objects and arrays
	 */
	private formatPayload(payload: any): string {
		if (typeof payload === "string") {
			return payload;
		}

		try {
			return JSON.stringify(payload, null, 2);
		} catch (error) {
			return String(payload);
		}
	}

	/**
	 * Core logging method
	 */
	private writeLog(
		level: LogLevel,
		message: string,
		payload?: any,
		error?: Error
	): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formattedMessage = this.formatMessage(level, message);
		const consoleMethod = console[level] || console.log;

		if (payload !== undefined) {
			if (typeof payload === "object" && !Array.isArray(payload)) {
				// For objects, use console's native formatting for better inspection
				consoleMethod(formattedMessage);
				console.dir(payload, { depth: null, colors: true });
			} else {
				consoleMethod(formattedMessage, this.formatPayload(payload));
			}
		} else {
			consoleMethod(formattedMessage);
		}

		// If there's an error object, log the stack trace
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack);
		}
	}

	/**
	 * Log general information
	 */
	log(message: string, payload?: any): void {
		this.writeLog(LogLevel.LOG, message, payload);
	}

	/**
	 * Log debug information (lowest priority)
	 */
	debug(message: string, payload?: any): void {
		this.writeLog(LogLevel.DEBUG, message, payload);
	}

	/**
	 * Log warnings
	 */
	warn(message: string, payload?: any): void {
		this.writeLog(LogLevel.WARN, message, payload);
	}

	/**
	 * Log errors with optional error object for stack traces
	 */
	error(message: string, payload?: any, error?: Error): void {
		this.writeLog(LogLevel.ERROR, message, payload, error);
	}

	/**
	 * Create a child logger with an extended prefix
	 */
	child(childPrefix: string): Logger {
		const newPrefix = this.prefix
			? `${this.prefix}:${childPrefix}`
			: childPrefix;

		return new Logger({
			prefix: newPrefix,
			enabledInProduction: this.enabledInProduction,
			minLevel: this.minLevel,
			metadata: { ...this.metadata }, // Inherit parent metadata
		});
	}

	/**
	 * Set minimum log level
	 */
	setMinLevel(level: LogLevel): void {
		this.minLevel = level;
	}

	/**
	 * Enable/disable production logging
	 */
	setProductionLogging(enabled: boolean): void {
		this.enabledInProduction = enabled;
	}

	/**
	 * Add a metadata field that will be included in all subsequent logs
	 * Example: logger.addMetadata('userId', '123') or logger.addMetadata('conversationId', 'abc')
	 */
	addMetadata(key: string, value: string | number) {
		this.metadata[key] = value;
		return this;
	}

	/**
	 * Add multiple metadata fields at once
	 * Example: logger.setMetadata({ userId: '123', conversationId: 'abc' })
	 */
	setMetadata(metadata: Record<string, string | number>): void {
		this.metadata = { ...this.metadata, ...metadata };
	}

	/**
	 * Remove a specific metadata field
	 */
	removeMetadata(key: string): void {
		delete this.metadata[key];
	}

	/**
	 * Clear all metadata
	 */
	clearMetadata(): void {
		this.metadata = {};
	}

	/**
	 * Get current metadata
	 */
	getMetadata(): Record<string, string | number> {
		return { ...this.metadata };
	}

	/**
	 * Create a new logger instance with metadata
	 * This creates a completely new logger (not a child) with the specified metadata
	 */
	withMetadata(metadata: Record<string, string | number>): Logger {
		return new Logger({
			prefix: this.prefix,
			enabledInProduction: this.enabledInProduction,
			minLevel: this.minLevel,
			metadata: { ...this.metadata, ...metadata },
		});
	}
}

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
	return new Logger(options);
}

/**
 * Default logger instance for general use
 */
export const logger = createLogger();

/**
 * Export Logger class for creating custom instances
 */
export { Logger };
