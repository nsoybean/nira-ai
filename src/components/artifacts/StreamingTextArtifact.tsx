"use client";

import { LucideIcon } from "lucide-react";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactContent,
} from "@/components/ai-elements/artifact";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ReactNode } from "react";

interface StreamingTextArtifactProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  content?: string;
  status: "streaming" | "completed"
  actions?: ReactNode;
  maxHeight?: string;
  showScrollIndicator?: boolean;
  className?: string;
}

export function StreamingTextArtifact({
  icon: Icon,
  title,
  description,
  content,
  status,
  actions,
  maxHeight = "500px",
  showScrollIndicator = true,
  className,
}: StreamingTextArtifactProps) {
  const { scrollRef, isUserScrolling } = useAutoScroll(content);

  return (
    <Artifact className={className}>
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <div>
            <ArtifactTitle>
              {status === 'streaming' ?
                <Shimmer>{title}</Shimmer>
                :
                title}
            </ArtifactTitle>
            {description && (
              <ArtifactDescription>{description}</ArtifactDescription>
            )}
          </div>
        </div>
        {actions && <ArtifactActions>{actions}</ArtifactActions>}
      </ArtifactHeader>
      <ArtifactContent className="p-0 relative">
        <ScrollArea className="h-full" style={{ maxHeight }}>
          <div ref={scrollRef} className="overflow-auto" style={{ maxHeight }}>
            <div className="p-4 whitespace-pre-wrap">{content}</div>
          </div>
        </ScrollArea>
        {showScrollIndicator && isUserScrolling && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
            Auto-scroll paused
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}
