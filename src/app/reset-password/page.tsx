"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [token, setToken] = useState(sp.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے");
      return;
    }
    if (password !== confirm) {
      setError("دونوں پاس ورڈ ایک جیسے ہوں");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "بازیابی ناکام");
        return;
      }
      alert("پاس ورڈ تبدیل ہو گیا — اب نئے پاس ورڈ سے لاگ اِن کریں۔");
      router.push("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center paper-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="manuscript-frame rounded-2xl bg-card p-8">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 w-fit">
              <LogoMark size={72} />
            </div>
            <h1 className="font-nastaliq-tight text-2xl leading-[1.9] text-primary">نیا پاس ورڈ مقرر کریں</h1>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-naskh">بازیابی ٹوکن</Label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} required dir="ltr" className="font-latin text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">نیا پاس ورڈ</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} className="ps-9 font-latin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">پاس ورڈ کی تصدیق</Label>
              <Input type="password" dir="ltr" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="font-latin" />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-naskh text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={busy} className="w-full gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} پاس ورڈ محفوظ کریں
            </Button>
            <p className="text-center text-xs font-naskh text-muted-foreground">
              <Link href="/login" className="text-primary underline">لاگ اِن پر واپس جائیں</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
