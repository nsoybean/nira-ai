"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Loader2, Send, Sparkles, StopCircle, RotateCcw } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
  } = useChat();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Lume</h1>
          </div>
          <div className="text-sm text-muted-foreground">Claude 3.5 Sonnet</div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollAreaRef}
          className="h-full overflow-y-auto container mx-auto px-4"
        >
          <div className="max-w-3xl mx-auto py-8 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Welcome to Lume
                  </h2>
                  <p className="text-muted-foreground">
                    Start a conversation with Claude 3.5 Sonnet
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 bg-primary flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </Avatar>
                  )}
                  <Card
                    className={`px-4 py-3 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part: any, i) => (
                          <span key={i}>{part.text}</span>
                        ))}
                    </p>
                  </Card>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">You</span>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </Avatar>
                <Card className="px-4 py-3 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Lume..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Lume can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
