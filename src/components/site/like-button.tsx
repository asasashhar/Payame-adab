"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function LikeButton({
  resourceType,
  resourceId,
  enabled = true,
  showCount = true,
  className,
}: {
  resourceType: string;
  resourceId: string;
  enabled?: boolean;
  showCount?: boolean;
  className?: string;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    fetch(`/api/likes?resourceType=${resourceType}&resourceId=${resourceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setCount(typeof d.count === "number" ? d.count : 0);
        setLiked(Boolean(d.liked));
      })
      .catch(() => alive && setCount(0));
    return () => { alive = false; };
  }, [resourceType, resourceId]);

  const toggle = async () => {
    if (!enabled) return;
    if (busy) return;
    setBusy(true);
    // optimistic
    const prevLiked = liked;
    const prevCount = count ?? 0;
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, resourceId }),
      });
      const d = await res.json();
      if (!res.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        toast({ title: d.error ?? "خرابی", variant: "destructive" });
      } else {
        setLiked(Boolean(d.liked));
        setCount(d.count ?? prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={!enabled || busy || count === null}
      aria-pressed={liked}
      aria-label={liked ? "پسندیدگی ہٹائیں" : "پسند کریں"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-naskh transition-colors",
        liked
          ? "border-rose-300 bg-rose-50 text-rose-600"
          : "border-gold/40 bg-card text-muted-foreground hover:border-rose-300 hover:text-rose-500",
        !enabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart className={cn("h-4 w-4 transition-transform", liked && "fill-current scale-110")} />
      {showCount && (
        <span className="font-latin text-xs tabular-nums" dir="ltr">
          {count ?? "…"}
        </span>
      )}
    </button>
  );
}
