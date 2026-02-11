/**
 * Shadcn Card component.
 *
 * A simple container with a border, background, and optional header/footer.
 * We use it to visually distinguish user and assistant messages in the chat.
 * See: https://ui.shadcn.com/docs/components/radix/card
 */

import * as React from "react";
import { cn } from "../../lib/utils.js";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";
