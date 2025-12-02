import { ConversationsProvider } from "@/contexts/ConversationsContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConversationsProvider>{children}</ConversationsProvider>;
}
