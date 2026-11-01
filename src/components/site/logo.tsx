import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Payam-e-Adab official logo — the uploaded circular badge artwork.
 * Used in header, footer, hero, admin login, dashboard, watermarks and favicon.
 */
export function LogoMark({ size = 56, className }: { size?: number; className?: string }) {
  return (
     
    <img
      src="/brand/logo-badge.png"
      alt="پیامِ ادب — Payam-e-Adab"
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function BrandLock({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <LogoMark size={compact ? 44 : 52} />
      <span className="flex flex-col items-start">
        <span
          className={cn(
            "font-nastaliq-tight text-primary leading-snug group-hover:text-emerald-deep transition-colors",
            compact ? "text-xl" : "text-2xl"
          )}
        >
          پیامِ ادب
        </span>
        {!compact && (
          <span className="text-[11px] tracking-wide text-muted-foreground font-latin">
            PAYAM-E-ADAB
          </span>
        )}
      </span>
    </Link>
  );
}
