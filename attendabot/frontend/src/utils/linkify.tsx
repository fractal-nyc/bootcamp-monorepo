/**
 * @fileoverview Utility for rendering text with clickable links.
 * Detects URLs in text and wraps them in anchor tags.
 */

import { ReactNode } from "react";

/** Regex pattern for detecting HTTP/HTTPS URLs. */
const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

/**
 * Renders text with URLs converted to clickable links.
 * @param text - The text content to process.
 * @returns React nodes with URLs wrapped in anchor tags.
 */
export function renderWithLinks(text: string): ReactNode[] {
  const parts = text.split(URL_REGEX);

  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      // Reset regex lastIndex since we're reusing it
      URL_REGEX.lastIndex = 0;
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    return part;
  });
}

/** Props for the LinkedText component. */
interface LinkedTextProps {
  children: string;
  className?: string;
}

/**
 * Component that renders text with clickable links.
 * Use this when you need a wrapper element with a className.
 */
export function LinkedText({ children, className }: LinkedTextProps) {
  return <span className={className}>{renderWithLinks(children)}</span>;
}
