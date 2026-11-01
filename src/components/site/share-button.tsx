"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export function ShareButton({ title, className }: { title: string; className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 border-gold/40 font-naskh ${className ?? ""}`}
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) await navigator.share({ title, url }).catch(() => {});
        else {
          await navigator.clipboard.writeText(url);
          alert("لنک کاپی ہو گیا");
        }
      }}
    >
      <Share2 className="h-4 w-4" /> شیئر
    </Button>
  );
}
