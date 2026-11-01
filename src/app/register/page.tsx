"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", penName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "رجسٹریشن ناکام", description: data.error, variant: "destructive" });
        return;
      }
      if (data.needsVerification) {
        toast({
          title: "اکاؤنٹ بنا دیا گیا — اب تصدیق درکار ہے",
          description: "تصدیقی لنک آپ کے ای میل پر بھیج دیا گیا ہے (اسپام فولڈر بھی دیکھیں)۔ تصدیق کے بعد آپ تحریریں بھیج سکیں گے۔",
        });
      } else {
        toast({ title: "خوش آمدید!", description: "آپ کا اکاؤنٹ بنا دیا گیا ہے۔" });
      }
      router.push("/dashboard");
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
            <h1 className="font-nastaliq-tight text-3xl text-emerald-ink">نیا اکاؤنٹ</h1>
            <p className="mt-1 font-naskh text-sm text-muted-foreground">
              اپنی تحریریں بھیجنے اور اپنی ادبی پروفائل بنانے کے لیے رجسٹر کریں
            </p>
          </div>

          <form onSubmit={submit} className="manuscript-frame space-y-5 rounded-xl bg-card p-7">
            <div className="space-y-2">
              <Label className="font-naskh">اصل نام *</Label>
              <Input required value={form.name} onChange={set("name")} className="h-11 font-naskh" />
            </div>
            <div className="space-y-2">
              <Label className="font-naskh">قلمی نام (تخلص)</Label>
              <Input value={form.penName} onChange={set("penName")} className="h-11 font-nastaliq-tight text-lg" />
            </div>
            <div className="space-y-2">
              <Label className="font-naskh">ای میل *</Label>
              <Input required type="email" dir="ltr" value={form.email} onChange={set("email")} className="h-11 text-left font-latin" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="font-naskh">پاس ورڈ * (کم از کم 6 حروف)</Label>
              <Input required type="password" minLength={6} dir="ltr" value={form.password} onChange={set("password")} className="h-11 text-left font-latin" />
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full bg-primary font-naskh text-[16px] hover:bg-emerald-deep">
              {loading ? "اکاؤنٹ بنا رہے ہیں…" : "رجسٹر کریں"}
            </Button>
            <p className="text-center text-sm font-naskh text-muted-foreground">
              اکاؤنٹ موجود ہے؟{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-gold">لاگ اِن کریں</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
