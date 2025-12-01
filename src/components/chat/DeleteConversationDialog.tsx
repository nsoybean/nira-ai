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

interface DeleteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
}

export function DeleteConversationDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteConversationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-gray-100">
            Delete conversation?
          </AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            This will permanently delete this conversation and all its
            messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
