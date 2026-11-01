"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { POEM_CATEGORIES, ARTICLE_CATEGORIES } from "@/lib/site";
import { toast } from "@/hooks/use-toast";
import { UploadCloud, UserRound, ImageIcon, Send, Loader2, Save } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export default function SubmitPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [kind, setKind] = useState<"poem" | "article">("poem");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [topicUploading, setTopicUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", content: "", category: "", tags: "", excerpt: "",
    photoUrl: "", topicImageUrl: "", authorName: "",
  });
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setMe(d?.id ? d : null);
        if (d?.id) setForm((f) => ({ ...f, authorName: d.penName || d.name, photoUrl: d.photoUrl || "" }));
      })
      .finally(() => setLoadingMe(false));
  }, []);

  // edit mode: /submit?edit=<id>&type=poem|article — loads the author's own item
  useEffect(() => {
    if (loadingMe || !me) return;
    const sp = new URLSearchParams(window.location.search);
    const editId = sp.get("edit");
    const t = sp.get("type") === "article" ? "article" : "poem";
    if (!editId) return;
    fetch(`/api/${t === "poem" ? "poems" : "articles"}?mine=1`)
      .then((r) => r.json())
      .then((items) => {
        const item = (Array.isArray(items) ? items : []).find((x: { id: string }) => x.id === editId);
        if (!item) {
          toast({ title: "تحریر نہیں ملی یا آپ کی نہیں ہے", variant: "destructive" });
          return;
        }
        setKind(t);
        setEditingId(editId);
        setEditingStatus(item.status ?? null);
        setFeedback(item.feedback ?? null);
        setForm({
          title: item.title ?? "",
          content: item.content ?? "",
          category: item.category ?? "",
          tags: item.tags ?? "",
          excerpt: item.excerpt ?? "",
          photoUrl: item.coverUrl ?? "",
          topicImageUrl: item.topicImageUrl ?? "",
          authorName: (t === "poem" ? item.poetName : item.authorName) ?? "",
        });
      });
  }, [loadingMe, me]);

  const uploadFile = async (file: File, target: "photo" | "topic") => {
    if (target === "photo") setPhotoUploading(true); else setTopicUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "اپلوڈ ناکام", description: data.error, variant: "destructive" });
        return;
      }
      if (target === "photo") {
        setForm((f) => ({ ...f, photoUrl: data.url }));
        await fetch("/api/auth/profile", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: data.url }),
        });
      } else {
        setForm((f) => ({ ...f, topicImageUrl: data.url }));
      }
      toast({ title: "تصویر اپلوڈ ہو گئی" });
    } finally {
      setPhotoUploading(false);
      setTopicUploading(false);
    }
  };

  const submit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "عنوان اور متن ضروری ہیں", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category || (kind === "poem" ? "غزل" : "ادبی مضامین"),
        tags: form.tags,
        excerpt: form.excerpt,
        poetName: kind === "poem" ? form.authorName : undefined,
        authorName: kind === "article" ? form.authorName : undefined,
        coverUrl: form.photoUrl || undefined,
        topicImageUrl: form.topicImageUrl || undefined,
        status: asDraft ? "DRAFT" : "PENDING",
      };
      const res = editingId
        ? await fetch(`/api/${kind === "poem" ? "poems" : "articles"}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...payload }),
          })
        : await fetch(`/api/${kind === "poem" ? "poems" : "articles"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "بھیجنے میں خرابی", description: data.error, variant: "destructive" });
        return;
      }
      toast({
        title: asDraft ? "مسودہ محفوظ ہو گیا" : editingId ? "ترمیم شدہ تحریر بھیج دی گئی" : "تحریر موصول ہو گئی",
        description: asDraft ? "جب چاہیں ڈیش بورڈ سے مکمل کر کے بھیجیں۔" : "آپ کی تحریر ادارتی معائنے کے لیے بھیج دی گئی ہے۔ منظوری کے بعد شائع ہوگی۔",
      });
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  if (loadingMe) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="manuscript-frame max-w-md rounded-xl bg-card p-10 text-center">
            <UserRound className="mx-auto mb-3 h-12 w-12 text-gold" />
            <h1 className="font-nastaliq-tight text-2xl text-primary">پہلے لاگ اِن کریں</h1>
            <p className="mt-2 font-naskh text-sm leading-7 text-muted-foreground">
              اپنی تحریر بھیجنے کے لیے اکاؤنٹ ضروری ہے تاکہ آپ کی پروفائل پر آپ کی تمام شائع شدہ تحریریں ایک جگہ جمع ہو سکیں۔
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button asChild className="bg-primary font-naskh hover:bg-emerald-deep">
                <Link href="/login">لاگ اِن</Link>
              </Button>
              <Button asChild variant="outline" className="border-gold/40 font-naskh">
                <Link href="/register">نیا اکاؤنٹ</Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const categories = kind === "poem" ? POEM_CATEGORIES : ARTICLE_CATEGORIES;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <SectionHeading
            title={editingId ? "اپنی تحریر میں ترمیم" : "اپنی تحریر بھیجیں"}
            subtitle={editingId ? "ترمیم کے بعد تحریر دوبارہ ادارتی جائزے میں چلی جائے گی" : "تحریر ادارتی معائنے کے بعد شائع کی جائے گی"}
          />

          {editingId && editingStatus === "REVISION" && feedback && (
            <div className="mb-6 rounded-xl border border-[#d9a24a]/50 bg-[#fdf6e3] p-4">
              <p className="text-sm font-naskh font-semibold text-[#8a5b12]">ادارتی رائے (اصلاح مطلوب):</p>
              <p className="mt-1 whitespace-pre-line font-naskh text-sm leading-7 text-[#6d5311]">{feedback}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            {/* kind toggle */}
            <div className="grid grid-cols-2 gap-3">
              {(["poem", "article"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { if (!editingId) { setKind(k); setForm((f) => ({ ...f, category: "" })); } }}
                  disabled={!!editingId}
                  className={`rounded-xl border px-4 py-3 font-nastaliq-tight text-xl transition-colors ${
                    kind === k ? "border-emerald-deep bg-emerald-deep text-[#f3ead2]" : "border-gold/40 bg-card hover:border-gold"
                  } ${editingId && kind !== k ? "opacity-40" : ""}`}
                >
                  {k === "poem" ? "شاعری" : "مضمون / نثر"}
                </button>
              ))}
            </div>

            <div className="manuscript-frame space-y-5 rounded-xl bg-card p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-naskh">عنوان *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 font-nastaliq-tight text-lg" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-naskh">{kind === "poem" ? "شاعر / تخلص" : "مصنف"}</Label>
                  <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className="h-11 font-nastaliq-tight text-lg" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-naskh">صنف</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-11 font-naskh"><SelectValue placeholder="صنف منتخب کریں" /></SelectTrigger>
                    <SelectContent className="max-h-72 font-naskh">
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-naskh">ٹیگز (کاما لے الگ کر کے)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="h-11 font-naskh" placeholder="ادب، غزل، تہذیب…" />
                </div>
              </div>

              {kind === "article" && (
                <div className="space-y-2">
                  <Label className="font-naskh">خلاصہ (مختصر)</Label>
                  <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="font-naskh" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-naskh">{kind === "poem" ? "مکمل کلام *" : "مکمل تحریر *"}</Label>
                <Textarea
                  dir="rtl"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  required
                  className="resize-y font-nastaliq text-lg leading-[2.6]"
                  placeholder={kind === "poem" ? "ہر شعر کے بعد خالی سطر چھوڑیں تاکہ اشعار الگ نظر آئیں…" : "اپنا مضمون یہاں لکھیں — پیراگراف کے درمیان خالی سطر رکھیں…"}
                />
              </div>

              {/* uploads */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-naskh">اپنی تصویر (پروفائل کے لیے)</Label>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "photo")} />
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="flex h-24 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold/50 bg-secondary/50 transition-colors hover:border-gold hover:bg-accent"
                  >
                    {photoUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                      form.photoUrl ? (
                         
                        <img src={form.photoUrl} alt="اپنی تصویر" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <>
                          <UploadCloud className="h-6 w-6 text-gold" />
                          <span className="text-sm font-naskh text-muted-foreground">تصویر چنیں</span>
                        </>
                      )
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="font-naskh">موضوع سے متعلق تصویر</Label>
                  <input ref={topicRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "topic")} />
                  <button
                    type="button"
                    onClick={() => topicRef.current?.click()}
                    className="flex h-24 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold/50 bg-secondary/50 transition-colors hover:border-gold hover:bg-accent"
                  >
                    {topicUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                      form.topicImageUrl ? (
                         
                        <img src={form.topicImageUrl} alt="موضوع کی تصویر" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-gold" />
                          <span className="text-sm font-naskh text-muted-foreground">تصویر چنیں</span>
                        </>
                      )
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-accent/60 p-4 font-naskh text-sm leading-8 text-foreground/80">
              <strong className="text-primary">نوٹ:</strong> ہر تحریر ایڈیٹر کے معائنے سے گزرتی ہے۔ حالت «زیرِ جائزہ» ہوگی؛ منظوری، اصلاح یا مستردی کی صورت میں آپ کو اپنے ڈیش بورڈ میں مطلع کیا جائے گا۔
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={saving} className="h-12 flex-1 gap-2 bg-primary font-naskh text-[16px] font-semibold hover:bg-emerald-deep">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {saving ? "بھیجا جا رہا ہے…" : editingId ? "ترمیم کر کے دوبارہ بھیجیں" : "جائزے کے لیے بھیجیں"}
              </Button>
              {!editingId && (
                <Button type="button" disabled={saving} onClick={(e) => submit(e, true)} variant="outline" className="h-12 gap-2 border-gold/40 font-naskh text-[15px]">
                  <Save className="h-5 w-5" /> مسودہ محفوظ کریں
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
