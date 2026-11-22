import type { ReactNode } from "react";

export type IconName =
  | "play"
  | "sparkles"
  | "chat"
  | "clear"
  | "rotate"
  | "book"
  | "code"
  | "table"
  | "database"
  | "chevron"
  | "bulb";

const PATHS: Record<IconName, ReactNode> = {
  play: <path d="M8 5.4v13.2L19 12z" fill="currentColor" stroke="none" />,
  sparkles: (
    <>
      <path d="M11 3.2l1.7 4.3 4.3 1.7-4.3 1.7L11 15.2 9.3 10.9 5 9.2l4.3-1.7z" />
      <path d="M18 14.4l.85 2.15 2.15.85-2.15.85L18 20.4l-.85-2.15L15 17.4l2.15-.85z" />
    </>
  ),
  chat: (
    <>
      <path d="M20 14.6a2.9 2.9 0 0 1-2.9 2.9H8.4L4 21V6.4a2.9 2.9 0 0 1 2.9-2.9h10.2A2.9 2.9 0 0 1 20 6.4z" />
      <path d="M8.6 8.8h6.8M8.6 12.4h4.4" />
    </>
  ),
  clear: (
    <>
      <rect x="3.2" y="5" width="17.6" height="14" rx="2.4" />
      <path d="M9.6 9.6l4.8 4.8M14.4 9.6l-4.8 4.8" />
    </>
  ),
  rotate: (
    <>
      <path d="M3.6 12a8.4 8.4 0 1 0 2.7-6.2" />
      <path d="M3.2 3.9v4.6h4.6" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.6S9.6 4.6 4.2 4.6v12.9c5.4 0 7.8 2 7.8 2s2.4-2 7.8-2V4.6c-5.4 0-7.8 2-7.8 2z" />
      <path d="M12 6.6v12.9" />
    </>
  ),
  code: (
    <>
      <path d="M8.4 8.2L4 12l4.4 3.8" />
      <path d="M15.6 8.2L20 12l-4.4 3.8" />
      <path d="M13.4 4.8l-2.8 14.4" />
    </>
  ),
  table: (
    <>
      <rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.2" />
      <path d="M3.2 9.6h17.6M3.2 14.5h17.6M9.1 9.6v9.8M14.9 9.6v9.8" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.2" rx="7.4" ry="2.9" />
      <path d="M4.6 6.2v11.6c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9V6.2" />
      <path d="M4.6 12c0 1.6 3.3 2.9 7.4 2.9s7.4-1.3 7.4-2.9" />
    </>
  ),
  chevron: <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  bulb: (
    <>
      <path d="M12 3.2a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.8h5.4c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3.2z" />
      <path d="M9.6 18.4h4.8M10.6 21h2.8" />
    </>
  ),
};

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}