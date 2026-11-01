"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailQuestion } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center paper-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="manuscript-frame rounded-2xl bg-card p-8 text-center">
          <div className="mx-auto mb-4 w-fit">
            <LogoMark size={72} />
          </div>
          <h1 className="font-nastaliq-tight text-2xl leading-[1.9] text-primary">پاس ورڈ بازیابی</h1>
          {sent ? (
            <div className="mt-4 space-y-4">
              <p className="rounded-lg bg-[#e3f0e6] px-4 py-3 font-naskh text-sm leading-7 text-[#2f6d46]">
                اگر یہ ای میل رجسٹرڈ ہے تو آپ کی بازیابی کی درخواست موصول ہو گئی ہے۔
                براہ کرم سائٹ ایڈمنسٹریٹر سے رابطہ کریں — وہ آپ کو ایک وقتی بازیابی لنک بھیج دیں گے (30 منٹ کی میعاد)۔
              </p>
              <Button asChild variant="outline" className="font-naskh">
                <Link href="/login">لاگ اِن پر واپس</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4 text-start">
              <div className="space-y-1.5">
                <Label className="font-naskh">رجسٹرڈ ای میل</Label>
                <div className="relative">
                  <MailQuestion className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email" dir="ltr" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="ps-9 font-latin"
                  />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full gap-2 bg-primary font-naskh hover:bg-emerald-deep">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} درخواست بھیجیں
              </Button>
              <p className="text-center text-xs font-naskh text-muted-foreground">
                <Link href="/login" className="text-primary underline">لاگ اِن پر واپس جائیں</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
