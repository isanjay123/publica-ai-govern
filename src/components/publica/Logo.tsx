import { Link } from "@tanstack/react-router";
import mark from "@/assets/publica-mark.png";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  withTagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  className?: string;
}) {
  const dims = size === "lg" ? 48 : size === "sm" ? 26 : 34;
  return (
    <Link to="/" className={cn("group flex items-center gap-3 focus-ring rounded-lg", className)}>
      <img
        src={mark}
        alt="Publica"
        width={dims}
        height={dims}
        style={{ width: dims, height: dims }}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg",
          )}
        >
          PUBLICA
        </span>
        {withTagline && (
          <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Transparent Governance
          </span>
        )}
      </span>
    </Link>
  );
}
