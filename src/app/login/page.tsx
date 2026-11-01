"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "لاگ اِن ناکام", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "خوش آمدید!", description: "آپ کامیابی سے لاگ اِن ہو گئے۔" });
      router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col paper-bg">
      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center">
            <LogoMark size={72} className="mb-3 shadow-md" />
            <h1 className="font-nastaliq-tight text-3xl text-emerald-ink">لاگ اِن کریں</h1>
            <p className="mt-1 font-naskh text-sm text-muted-foreground">اپنے ادبی اکاؤنٹ میں داخل ہوں</p>
          </div>

          <form onSubmit={submit} className="manuscript-frame space-y-5 rounded-xl bg-card p-7">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-naskh">ای میل</Label>
              <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 text-left font-latin" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-naskh">پاس ورڈ</Label>
              <Input id="password" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 text-left font-latin" />
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full bg-primary font-naskh text-[16px] hover:bg-emerald-deep">
              {loading ? "لاگ اِن ہو رہا ہے…" : "لاگ اِن"}
            </Button>
            <p className="text-center text-xs font-naskh">
              <Link href="/forgot-password" className="text-gold hover:text-primary underline">پاس ورڈ بھول گئے ہیں؟</Link>
            </p>
            <p className="text-center text-sm font-naskh text-muted-foreground">
              اکاؤنٹ نہیں ہے؟{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-gold">نیا اکاؤنٹ بنائیں</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
