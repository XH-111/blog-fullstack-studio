import type { PropsWithChildren } from "react";

type SurfaceCardProps = PropsWithChildren<{
  className?: string;
}>;

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <div
      className={`rounded-[28px] border border-white/60 bg-[var(--color-panel)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}
