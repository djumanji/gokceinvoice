import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Provides consistent table chrome: border, rounded corners,
 * sticky header, zebra rows, and hover states.
 */
export function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-auto rounded-lg border",
        // Sticky header background + border compensation
        "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:bg-background [&_thead_th]:z-10",
        // Zebra rows and hover
        "[&_tbody_tr:nth-child(even)]:bg-muted/30 [&_tbody_tr:hover]:bg-muted/50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}


