"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  MessageSquarePlus,
  Paperclip,
  Image as ImageIcon,
  BookOpen,
  ArrowUp,
  MessageSquare,
  MoreVertical,
  Sun,
  Moon,
  Share2,
  Trash2,
  Edit3,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [chatTitle, setChatTitle] = useState("New Chat");

  const { messages, status, error, sendMessage, stop, regenerate } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/chat",
    }),
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: input }],
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-700" />
              <span className="font-semibold text-gray-900">Lume</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          <Button className="w-full justify-start gap-2" size="sm">
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-3 text-gray-700 bg-gray-200">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Current Chat</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-3 text-gray-600">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Previous conversation</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-3 text-gray-600">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Design system discussion</span>
            </button>
            <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-3 text-gray-600">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">API integration help</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">EK</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Elizabeth Keen
              </p>
              <p className="text-xs text-gray-500 truncate">
                hey@unspace.agency
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                className="font-medium text-sm text-gray-900 bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded hover:bg-gray-100 focus:bg-gray-100 transition-colors flex-1 min-w-0"
                placeholder="Chat title..."
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollAreaRef} className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                  <Sparkles className="h-12 w-12 text-gray-300" />
                  <div>
                    <h2 className="text-xl font-medium mb-2 text-gray-900">
                      Start a new conversation
                    </h2>
                    <p className="text-sm text-gray-500">Ask me anything...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === "user" ? (
                        // User message - with bubble
                        <div className="flex justify-end mb-6">
                          <div className="bg-gray-100 rounded-2xl px-4 py-2.5 max-w-[75%]">
                            <p className="text-[15px] text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {message.parts
                                .filter((part) => part.type === "text")
                                .map((part: any, i) => (
                                  <span key={i}>{part.text}</span>
                                ))}
                            </p>
                          </div>
                        </div>
                      ) : (
                        // AI message - clean without bubble
                        <div className="flex gap-3 mb-6">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-[15px] text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {message.parts
                                .filter((part) => part.type === "text")
                                .map((part: any, i) => (
                                  <span key={i}>{part.text}</span>
                                ))}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mb-6">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              {/* Input Container */}
              <div className="relative border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow focus-within:border-gray-300 flex items-end">
                {/* Input Actions - Left Side */}
                <div className="flex items-center gap-0.5 pl-3 pb-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </div>

                {/* Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-0 px-2 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-32 overflow-y-auto shadow-none"
                  style={{ minHeight: "44px" }}
                />

                {/* Submit Button - Right Side */}
                <div className="pr-2.5 pb-2">
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Footer Text */}
            <p className="text-xs text-center text-gray-400 mt-3">
              Lume can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
