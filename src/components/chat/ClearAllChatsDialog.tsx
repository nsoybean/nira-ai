"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ClearAllChatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isClearing: boolean;
}

export function ClearAllChatsDialog({
  open,
  onOpenChange,
  onConfirm,
  isClearing,
}: ClearAllChatsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-gray-100">
            Clear all chats?
          </AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            This will permanently delete all conversations and their messages.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isClearing}
            className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isClearing}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear all"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
