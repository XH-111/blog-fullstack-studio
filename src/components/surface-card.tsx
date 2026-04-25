import type { HTMLAttributes, PropsWithChildren } from "react";

type SurfaceCardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
  className?: string;
}>;

export function SurfaceCard({
  children,
  className = "",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      {...props}
      className={`rounded-[28px] border border-white/60 bg-[var(--color-panel)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </div>
  );
}
