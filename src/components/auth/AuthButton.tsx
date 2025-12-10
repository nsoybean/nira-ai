"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/contexts/AuthContext";
import { useConversations } from "@/contexts/ConversationsContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Trash2, LogOut, User } from "lucide-react";
import { AuthDialog } from "./AuthDialog";

interface AuthButtonProps {
  onClearAll?: () => void;
}

export function AuthButton({ onClearAll }: AuthButtonProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { clearConversationsState } = useConversations();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleSignOut = async () => {
    clearConversationsState();

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/new");
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Button
          onClick={() => setAuthDialogOpen(true)}
          className="w-full"
          variant="outline"
        >
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  const initials =
    session.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    session.user.email?.slice(0, 2).toUpperCase() ||
    "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
          <Avatar className="h-8 w-8">
            {session.user.image && <AvatarImage src={session.user.image} />}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session.user.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-popover border-border"
      >
        {onClearAll && (
          <>
            <DropdownMenuItem
              onClick={onClearAll}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all chats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-accent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
