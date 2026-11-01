import { cn } from "@/lib/utils";
import type { WatermarkConfig } from "@/lib/site";

const POSITION_CLASS: Record<WatermarkConfig["position"], string> = {
  center: "items-center justify-center",
  "top-start": "items-start justify-start p-8",
  "top-end": "items-start justify-end p-8",
  "bottom-start": "items-end justify-start p-8",
  "bottom-end": "items-end justify-end p-8",
};

/**
 * The official Payam-e-Adab logo as a watermark behind published content.
 * Configuration (opacity / size / position / on-off) comes from the admin
 * dashboard via server settings; the print layouts embed the same asset so
 * downloaded PDFs keep the mark.
 */
export function Watermark({
  config,
  print = false,
  className,
}: {
  config?: Partial<WatermarkConfig> | null;
  print?: boolean;
  className?: string;
}) {
  const enabled = config?.enabled !== false;
  if (!enabled) return null;
  const opacity = Math.min(30, Math.max(1, config?.opacity ?? 6)) / 100;
  const size = Math.min(720, Math.max(120, config?.size ?? 340));
  const position = (config?.position ?? "center") as WatermarkConfig["position"];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 select-none flex",
        POSITION_CLASS[position],
        className
      )}
      style={{ opacity: print ? opacity : undefined }}
      aria-hidden
    >
      { }
      <img
        src="/brand/watermark.png"
        alt=""
        className="max-w-full"
        style={{ width: size, height: size, objectFit: "contain", opacity: print ? undefined : opacity }}
        draggable={false}
      />
    </div>
  );
}

/** CSS variable injection for the CSS-driven watermark layer (.watermark-layer). */
export function watermarkStyle(config: Partial<WatermarkConfig> | null): React.CSSProperties {
  const opacity = Math.min(30, Math.max(1, config?.opacity ?? 6)) / 100;
  return { ["--wm-opacity" as string]: String(opacity) };
}
