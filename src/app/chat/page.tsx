"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, TextStreamChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import Image from "next/image";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const { theme, setTheme } = useTheme();

  const { messages, status, error, sendMessage, stop, regenerate } = useChat({
    experimental_throttle: 50, // to make streaming smoother
    // transport: new TextStreamChatTransport({
    //   api: "/api/chat",
    // }),
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // only send the last message to the server:
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } };
      },
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
    <TooltipProvider>
      <div className="flex h-screen bg-white dark:bg-gray-950">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Lume"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Lume
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 dark:hover:bg-gray-800"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <PanelLeftClose className="h-4 w-4 dark:text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Close sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full justify-start gap-2 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  size="sm"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  New Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-1">
              <div className="group w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800">
                <span className="truncate flex-1">Current Chat</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="group w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span className="truncate flex-1">Previous conversation</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="group w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span className="truncate flex-1">
                  Design system discussion
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="group w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span className="truncate flex-1">API integration help</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-gray-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-3 space-y-3">
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      theme === "light"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      theme === "dark"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Switch theme</p>
              </TooltipContent>
            </Tooltip>

            <Separator />

            {/* User Profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                      EK
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      Elizabeth Keen
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      hey@unspace.agency
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Account settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 dark:hover:bg-gray-800"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="h-4 w-4 dark:text-gray-400" />
                </Button>
              )}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  className="font-medium text-sm text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:outline-none px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 transition-colors"
                  style={{ width: "fit-content", minWidth: "100px" }}
                  placeholder="Chat title..."
                />
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 dark:hover:bg-gray-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 dark:text-gray-400"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chat options</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 dark:bg-gray-900 dark:border-gray-800"
                  >
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 dark:hover:bg-gray-800"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chat options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-48 dark:bg-gray-900 dark:border-gray-800"
                >
                  <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer dark:hover:bg-gray-800 dark:text-gray-200">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400 dark:hover:bg-gray-800">
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
                    <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                    <div>
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Start a new conversation
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ask me anything...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id}>
                        {message.role === "user" ? (
                          // User message - with bubble
                          <div className="flex justify-end mb-6">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 max-w-[75%]">
                              <p className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
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
                              <p className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
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
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="relative">
                {/* Input Container */}
                <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow focus-within:border-gray-300 dark:focus-within:border-gray-600 overflow-hidden">
                  {/* Textarea */}
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    rows={1}
                    className="w-full resize-none bg-transparent border-0 px-4 pt-4 pb-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-48 overflow-y-auto shadow-none"
                    style={{ minHeight: "52px" }}
                  />

                  {/* Bottom Actions Bar */}
                  <div className="flex items-center justify-between px-3 pb-3">
                    {/* Left Side Actions */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Attach file</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add image</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Prompt Library</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Right Side - Submit Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          size="icon"
                          className="h-8 w-8 rounded-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white dark:text-gray-900 transition-all"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </form>

              {/* Footer Text */}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                Lume can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
