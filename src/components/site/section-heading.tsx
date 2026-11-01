import { cn } from "@/lib/utils";

/**
 * Urdu section heading with the brand's twin decorative rules and endpoint
 * dots. The two lines and the dots are structurally separated so they can
 * never overlap (fixed 3px gap, dots offset clear of the lower line).
 */
export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "سب دیکھیں",
  light = false,
  center = false,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-6", center && "text-center")}>
      <div className={cn("flex items-end gap-4", center && "justify-center")}>
        <div className="decor-rule flex-1" aria-hidden>
          <span className="rule-dot rule-dot-dot" />
          <span className="rule-track">
            <span className="rule-line" />
            <span className="rule-line opacity-50" />
          </span>
        </div>
        <h2
          className={cn(
            "font-nastaliq-tight text-3xl md:text-[2rem] whitespace-nowrap",
            light ? "text-[#f3ead2]" : "text-primary"
          )}
        >
          {title}
        </h2>
        <div className="decor-rule flex-1" aria-hidden>
          <span className="rule-track">
            <span className="rule-line" />
            <span className="rule-line opacity-50" />
          </span>
          <span className="rule-dot" />
        </div>
      </div>
      {subtitle && (
        <p className={cn("mt-1 text-sm", light ? "text-[#d9bc6a]" : "text-muted-foreground", center && "text-center")}>
          {subtitle}
        </p>
      )}
      {href && !center && (
        <div className="mt-1 text-left">
          <a
            href={href}
            className="text-sm text-gold hover:text-emerald-deep underline underline-offset-4 decoration-dotted transition-colors"
          >
            {linkLabel} ←
          </a>
        </div>
      )}
    </div>
  );
}

/** Slim decorative divider used between page sections. */
export function Divider({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-6", className)} style={style} aria-hidden>
      <span className="h-px w-24 bg-gold/50" />
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      <span className="h-2 w-2 rotate-45 border border-gold" />
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      <span className="h-px w-24 bg-gold/50" />
    </div>
  );
}
