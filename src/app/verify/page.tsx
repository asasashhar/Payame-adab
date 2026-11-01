"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, CircleCheck, CircleX } from "lucide-react";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) {
          setState("ok");
          setMessage("آپ کی ای میل کامیابی سے تصدیق ہو گئی — اب آپ تحریریں بھیج سکتے ہیں۔");
        } else {
          setState("error");
          setMessage(d.error ?? "تصدیق ناکام ہو گئی۔");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("سرور سے رابطہ نہیں ہو سکا۔");
      });
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="manuscript-frame rounded-2xl bg-card p-10 text-center">
          <CircleX className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-nastaliq-tight text-2xl text-primary">تصدیق نہیں ہو سکی</h1>
          <p className="mt-3 font-naskh text-[15px] leading-8 text-foreground/80">
            تصدیقی لنک نامکمل ہے — براہ کرم اپنے ای میل کا مکمل لنک استعمال کریں۔
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              <Link href="/dashboard"><MailCheck className="h-4 w-4" /> میرا ڈیش بورڈ</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="manuscript-frame rounded-2xl bg-card p-10 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-4 font-nastaliq-tight text-2xl text-primary">تصدیق جاری ہے…</h1>
          </>
        )}
        {state === "ok" && (
          <>
            <CircleCheck className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 font-nastaliq-tight text-2xl text-primary">ای میل تصدیق ہو گئی</h1>
          </>
        )}
        {state === "error" && (
          <>
            <CircleX className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 font-nastaliq-tight text-2xl text-primary">تصدیق نہیں ہو سکی</h1>
          </>
        )}
        <p className="mt-3 font-naskh text-[15px] leading-8 text-foreground/80">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
            <Link href="/dashboard"><MailCheck className="h-4 w-4" /> میرا ڈیش بورڈ</Link>
          </Button>
          <Button asChild variant="outline" className="border-gold/40 font-naskh">
            <Link href="/">سرِ ورق</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <Suspense fallback={<div className="py-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>}>
          <VerifyInner />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
