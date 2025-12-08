"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BookIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Shimmer } from "./shimmer";

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("not-prose mb-4 text-primary text-xs", className)}
    {...props}
  />
);

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count?: number;
  label: string;
  resultLabel: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
  disableResultCount?: boolean;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  label,
  resultLabel,
  isLoading,
  icon,
  disableResultCount,
  ...props
}: SourcesTriggerProps) => {
  return (
    <CollapsibleTrigger
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {children ?? (
        <>
          {icon ?? <GlobeIcon size={16} />}
          {/* render query max 2 lines truncate  */}
          {label && isLoading ? (
            <Shimmer
              as="span"
              duration={1.5}
              className="font-medium truncate max-w-lg"
            >
              {label}
            </Shimmer>
          ) : label ? (
            <p className="font-medium truncate max-w-lg">{label}</p>
          ) : null}
          {!disableResultCount && (
            <p className="font-medium">
              {isLoading ? "..." : `${count} ${resultLabel}`}
            </p>
          )}
          <ChevronDownIcon className="h-4 w-4" />
        </>
      )}
    </CollapsibleTrigger>
  );
};

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-3 flex w-fit flex-col gap-2",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type SourceProps = ComponentProps<"a">;

export const Source = ({
  href,
  title,
  children,
  icon,
  ...props
}: SourceProps & { icon?: React.ReactNode }) => (
  <a
    className="flex items-center gap-2"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        {icon ?? <BookIcon className="h-4 w-4" />}
        <span className="block font-medium">{title}</span>
      </>
    )}
  </a>
);
