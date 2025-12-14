import {
	createIdGenerator,
	DeepPartial,
	tool,
	UIMessageStreamWriter,
} from "ai";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { MyUIMessage } from "../UIMessage";
import { jsonrepair } from "jsonrepair";

/**
 * Markdown File Artifact Types
 *
 * Defines the structure for AI-generated markdown documents that will be
 * rendered in the chat UI with toggle between raw and rendered views.
 */

/**
 * Zod schema for markdown artifact
 */
export const markdownArtifactSchema = z.object({
	/** Title of the markdown document */
	title: z.string().min(1),
	/** Raw markdown content */
	content: z.string().min(1),
	/** Optional description or summary */
	description: z.string().optional(),
});
export type MarkdownArtifact = z.infer<typeof markdownArtifactSchema>;

/**
 * Output schema for the tool execution result
 */
export const markdownArtifactOutputSchema = z.object({
	artifactId: z.string(),
	type: z.literal("markdown"),
	version: z.string(),
	error: z.string(),
	message: z.string(),
	content: markdownArtifactSchema.optional(),
});
export type MarkdownArtifactOutput = z.infer<
	typeof markdownArtifactOutputSchema
>;

/**
 * Validates and parses a markdown artifact from unknown data
 * Uses Zod for validation and returns the parsed result or null
 */
export function parseMarkdownArtifact(data: unknown): MarkdownArtifact | null {
	const result = markdownArtifactSchema.safeParse(data);
	return result.success ? result.data : null;
}

/**
 * Safely parses incremental/partial markdown data for streaming
 * Returns partial data even if full validation fails
 */
export function safeParsePartialMarkdown(
	data: unknown
): DeepPartial<MarkdownArtifact> {
	if (!data || typeof data !== "object") {
		return {};
	}

	const obj = data as any;
	const result: DeepPartial<MarkdownArtifact> = {};

	if (typeof obj.title === "string") {
		result.title = obj.title;
	}
	if (typeof obj.content === "string") {
		result.content = obj.content;
	}
	if (typeof obj.description === "string") {
		result.description = obj.description;
	}

	return result;
}

/**
 * Creates a markdown file artifact with streaming input validation.
 *
 * Architecture:
 * - Main agent generates the markdown using this tool with inputSchema: markdownArtifactSchema
 * - Tool execution validates and persists the input from the agent
 * - Uses onInputDelta() to stream the input delta back to client
 * - Streams UI updates (starting → in_progress → completed)
 * - Persists artifact to database
 * - Returns artifact reference for message parts
 */
export const createMarkdownFileTool = (options: {
	conversationId: string;
	messageId: string;
	userId?: string;
	writer: UIMessageStreamWriter<MyUIMessage>;
}) => {
	const { conversationId, messageId, userId, writer } = options;
	const markdownId = createIdGenerator({
		prefix: "artifact",
		size: 16,
	})();

	// Create logger instance with metadata
	const logger = createLogger({ prefix: "markdownFileTool" }).withMetadata({
		conversationId,
		messageId,
		artifactId: markdownId,
	});

	// Accumulator for concatenating input deltas
	let accumulatedInput = "";

	return tool({
		description: `Create a markdown document file. Use this when the user requests to create text-based documents, notes, documentation, articles, guides, or any formatted text content.

WHEN TO USE:
- Creating documentation, README files, or technical guides
- Writing articles, blog posts, or essays
- Generating formatted notes or summaries
- Creating structured text documents with headings, lists, code blocks, etc.
- Any request to "create a markdown file" or "write a document"

CONTENT GUIDELINES:
- Title: Clear, descriptive title for the document (3-10 words)
- Content: Well-formatted markdown with appropriate headings, lists, code blocks, etc.
- Description (optional): Brief summary of the document's purpose (1-2 sentences)
- Use proper markdown syntax: # for headings, - for lists, \`\`\` for code blocks, **bold**, *italic*, etc.
- Structure content logically with clear sections
- Keep content concise and scannable

The document will be shown in a UI card where users can toggle between raw markdown and rendered preview.`,
		inputSchema: markdownArtifactSchema,
		outputSchema: markdownArtifactOutputSchema,
		execute: async (input) => {
			try {
				// Validate the input
				const validatedInput = markdownArtifactSchema.parse(input);

				// Save artifact to database
				const artifact = await prisma.artifact.create({
					data: {
						id: markdownId,
						conversationId,
						messageId,
						userId: userId || null,
						type: "markdown",
						content: validatedInput as any,
						version: "1",
					},
				});

				// Send completed status
				writer.write({
					type: "data-markdown",
					id: markdownId,
					data: {
						status: "completed",
						content: validatedInput,
					},
				});

				logger.log(`Created artifact ${artifact.id}`);

				// Return artifact with ID as tool output
				return {
					artifactId: artifact.id,
					type: "markdown" as const,
					version: "1",
					error: "",
					message: `Created markdown document. Simply acknowledge the creation.`,
				};
			} catch (error) {
				logger.error("Failed to create artifact", undefined, error as Error);

				// Send error status
				writer.write({
					type: "data-markdown",
					id: markdownId,
					data: {
						status: "error",
						content: undefined,
						error: error instanceof Error ? error.message : "Unknown error",
					},
				});

				// Return error in output schema format
				return {
					artifactId: markdownId,
					type: "markdown" as const,
					version: "1",
					error: error instanceof Error ? error.message : "Unknown error",
					message: `Failed to create markdown document: ${error instanceof Error ? error.message : "Unknown error"}`,
				};
			}
		},
		onInputStart: async () => {
			writer.write({
				type: "data-markdown",
				id: markdownId,
				data: {
					status: "starting",
					content: undefined,
				},
			});
		},
		onInputDelta: async (delta) => {
			// Accumulate the delta
			accumulatedInput += delta.inputTextDelta;

			// Try to parse the accumulated input
			try {
				const repairedJson = jsonrepair(accumulatedInput);
				const parsed = JSON.parse(repairedJson);
				const partialContent = safeParsePartialMarkdown(parsed);

				logger.debug("Streaming partial content", {
					accumulatedLength: accumulatedInput.length,
					hasTitle: !!partialContent.title,
					contentLength: partialContent.content?.length || 0,
				});

				// Stream the partial input back to client
				writer.write({
					type: "data-markdown",
					id: markdownId,
					data: {
						status: "in_progress",
						content: partialContent,
					},
				});
			} catch (error) {
				// Ignore parse errors during streaming - partial JSON may be incomplete
				logger.debug("Failed to parse accumulated input", {
					error: error instanceof Error ? error.message : String(error),
					accumulatedLength: accumulatedInput.length,
				});
			}
		},
	});
};
