import { ToolUIPart } from "ai";

export type webSearchToolUIPart = ToolUIPart<{
  blabla: {
    input: { query: string };
    output: { results: { url: string; title: string }[] };
  };
}>;

export type webExtractToolUIPart = ToolUIPart<{
  blabla: {
    input: { query: string };
    output: { results: { url: string }[]; failedResults: { url: string }[] };
  };
}>;
