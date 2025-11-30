"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Chat Root Page
 *
 * Redirects to /chat/new for a blank chat experience.
 * Conversation is only created when user sends first message.
 */
export default function ChatRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat/new');
  }, [router]);

  return null;
}
