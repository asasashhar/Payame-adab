"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  guestName: string | null;
  user?: { name: string; penName: string | null; photoUrl: string | null } | null;
};

function initials(name: string) {
  return name.trim().slice(0, 1);
}

export function Comments({
  resourceType,
  resourceId,
  enabled = true,
  guestsAllowed = true,
  title = "تبصرے",
}: {
  resourceType: string;
  resourceId: string;
  enabled?: boolean;
  guestsAllowed?: boolean;
  title?: string;
}) {
  const [items, setItems] = useState<CommentRow[] | null>(null);
  const [me, setMe] = useState<{ name: string; penName: string | null } | null>(null);
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    fetch(`/api/comments?resourceType=${resourceType}&resourceId=${resourceId}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [resourceType, resourceId]);

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d?.id ? d : null))
      .catch(() => setMe(null));
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType, resourceId, body,
          guestName: me ? undefined : guestName,
          guestEmail: me ? undefined : guestEmail,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "خرابی", variant: "destructive" });
      } else {
        setBody("");
        setDone(true);
        toast({ title: d.message ?? "تبصرہ موصول ہو گیا" });
      }
    } catch {
      toast({ title: "خرابی — دوبارہ کوشش کریں", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="manuscript-frame relative overflow-hidden rounded-xl bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
        <MessageCircle className="h-5 w-5 text-gold" />
        {title}
        {items && <span className="text-sm text-muted-foreground font-latin" dir="ltr">({items.length})</span>}
      </h2>

      {enabled ? (
        <form onSubmit={submit} className="mb-6 space-y-3 rounded-lg bg-accent/50 p-4">
          {!me && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-naskh">نام {guestsAllowed ? "" : "(لاگ اِن ضروری)"}</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={guestsAllowed ? "آپ کا نام" : "لاگ اِن کریں"}
                  disabled={!guestsAllowed}
                  required={guestsAllowed}
                  className="font-naskh bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">ای میل (اختیاری)</Label>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="essay@example.com"
                  disabled={!guestsAllowed}
                  dir="ltr"
                  className="font-latin bg-card"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-naskh">آپ کا تبصرہ</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              required
              placeholder={enabled && (me || guestsAllowed) ? "اپنی رائے لکھیں…" : "تبصرے بھیجنے کے لیے لاگ اِن کریں"}
              disabled={!me && !guestsAllowed}
              className="font-naskh bg-card"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy || (!me && !guestsAllowed)} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              بھیجیں
            </Button>
            {done && (
              <p className="text-sm font-naskh text-emerald-deep">
                شکریہ! آپ کا تبصرہ منظوری کے لیے موصول ہو گیا۔
              </p>
            )}
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-lg bg-accent/50 p-4 text-center font-naskh text-sm text-muted-foreground">
          اس صفحے پر تبصرے فی الحال بند ہیں۔
        </p>
      )}

      {items === null ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-accent/40" />)}</div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center font-naskh text-sm text-muted-foreground">
          ابھی کوئی منظور شدہ تبصرہ نہیں — پہلا تبصرہ آپ کریں!
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => {
            const name = c.user?.penName || c.user?.name || c.guestName || "مہمان قاری";
            return (
              <li key={c.id} className="flex gap-3 rounded-lg border border-gold/20 bg-card p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-nastaliq-tight text-primary">
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-naskh font-semibold text-primary">{name}</span>
                    <span className="text-[11px] font-latin text-muted-foreground" dir="ltr">
                      {new Date(c.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-line font-naskh text-sm leading-7 text-foreground/85">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
