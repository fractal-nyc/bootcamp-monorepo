/**
 * Utility for merging Tailwind CSS class names.
 *
 * Shadcn components use this helper to combine default styles with
 * any custom classes passed via the `className` prop. `clsx` handles
 * conditional classes, and `twMerge` deduplicates conflicting Tailwind
 * classes (e.g. "px-2 px-4" becomes just "px-4").
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
