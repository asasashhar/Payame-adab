"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, UploadCloud, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Ad = {
  id: string; title: string; imageUrl: string; linkUrl: string | null;
  slot: string; width: string | null; active: boolean; sortOrder: number;
};

const EMPTY = { title: "", imageUrl: "", linkUrl: "", slot: "LEFT", width: "300", sortOrder: 0, active: true };

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  type AdForm = { title: string; imageUrl: string; linkUrl: string; slot: string; width: string; sortOrder: number; active: boolean };
  const [form, setForm] = useState<AdForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Ad | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setAds(null);
    const res = await fetch("/api/ads");
    const data = await res.json();
    setAds([...(data.left ?? []), ...(data.right ?? [])]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (ad: Ad) => {
    setEditing(ad);
    setForm({
      title: ad.title, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl ?? "",
      slot: ad.slot, width: ad.width ?? "300", sortOrder: ad.sortOrder, active: ad.active,
    });
    setDialogOpen(true);
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "اپلوڈ ناکام", description: data.error, variant: "destructive" });
        return;
      }
      setForm((f) => ({ ...f, imageUrl: data.url }));
      toast({ title: "تصویر اپلوڈ ہو گئی" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast({ title: "عنوان اور تصویر ضروری ہیں", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ads", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "محفوظ نہیں ہوا", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: editing ? "اشتہار تبدیل ہو گیا" : "نیا اشتہار شامل ہو گیا", description: "ہوم پیج پر فوراً نظر آئے گا۔" });
      setDialogOpen(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    await fetch("/api/ads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ad.id, active: !ad.active }),
    });
    toast({ title: ad.active ? "اشتہار بند کر دیا گیا" : "اشتہار فعال کر دیا گیا" });
    load();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await fetch(`/api/ads?id=${confirmDelete.id}`, { method: "DELETE" });
      toast({ title: "اشتہار حذف ہو گیا" });
      setConfirmDelete(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  const grouped = (slot: string) => (ads ?? []).filter((a) => a.slot === slot);

  return (
    <div>
      <AdminPageHeader
        title="اشتہارات کا انتظام"
        subtitle="ہوم پیج کے بایاں اور دایاں کالم — تصویر، لنک، سائز اور فعال/غیر فعال کا کنٹرول"
        action={
          <Button onClick={openCreate} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
            <Plus className="h-4 w-4" /> نیا اشتہار
          </Button>
        }
      />

      {ads === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-8">
          {(["LEFT", "RIGHT"] as const).map((slot) => (
            <section key={slot}>
              <h2 className="mb-3 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
                <Megaphone className="h-5 w-5 text-gold" />
                {slot === "LEFT" ? "بایاں کالم" : "دایاں کالم"}
                <span className="text-xs font-naskh text-muted-foreground">({grouped(slot).length} اشتہار)</span>
              </h2>
              {grouped(slot).length === 0 ? (
                <div className="rounded-xl border border-dashed border-gold/40 bg-card p-8 text-center font-naskh text-sm text-muted-foreground">
                  اس جانب کوئی اشتہار نہیں — خالی جگہ صاف ستھری رہے گی۔
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped(slot).map((ad) => (
                    <div key={ad.id} className={cn("rounded-xl border bg-card p-3", ad.active ? "border-gold/30" : "border-muted opacity-60")}>
                      <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        { }
                        <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-contain" />
                      </div>
                      <p className="truncate font-nastaliq-tight text-lg leading-8">{ad.title}</p>
                      <p className="truncate text-xs font-latin text-muted-foreground" dir="ltr">{ad.linkUrl || "—"}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Switch checked={ad.active} onCheckedChange={() => toggleActive(ad)} aria-label="فعال/بند" />
                          <span className="text-xs font-naskh text-muted-foreground">{ad.active ? "فعال" : "بند"}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-8 gap-1 border-gold/40 font-naskh" onClick={() => openEdit(ad)}>
                            <Pencil className="h-3.5 w-3.5" /> ترمیم
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-destructive/40 font-naskh text-destructive hover:bg-[#fbe4e4]" onClick={() => setConfirmDelete(ad)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto nice-scroll sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">{editing ? "اشتہار میں ترمیم" : "نیا اشتہار"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="font-naskh">اشتہار کا نام (اندرونی انتظام کے لیے) *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="font-naskh" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">تصویر *</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-28 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold/50 bg-secondary/50 hover:border-gold"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : form.imageUrl ? (
                   
                  <img src={form.imageUrl} alt="اشتہار" className="h-full w-full rounded-xl object-contain" />
                ) : (
                  <>
                    <UploadCloud className="h-6 w-6 text-gold" />
                    <span className="text-sm font-naskh text-muted-foreground">تصویر اپلوڈ کریں (پسندیدہ: عمودی بینر 300×600)</span>
                  </>
                )}
              </button>
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">ڈیسٹینیشن لنک (کلک کرنے پر کھلے گا)</Label>
              <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} dir="ltr" placeholder="https://…" className="font-latin text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-naskh">پوزیشن</Label>
                <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
                  <SelectTrigger className="font-naskh"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-naskh">
                    <SelectItem value="LEFT">بایاں کالم</SelectItem>
                    <SelectItem value="RIGHT">دایاں کالم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-naskh">چوڑائی (پکسل)</Label>
                <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className="font-latin" />
              </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <div className="space-y-1.5">
                <Label className="font-naskh">ترتیب (چھوٹا پہلے)</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} className="font-latin" />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-accent/40 px-4 py-2.5">
                <span className="font-naskh text-sm">فعال رکھیں</span>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-naskh">منسوخ</Button>
            <Button onClick={save} disabled={busy} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} محفوظ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent dir="rtl" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-destructive">اشتہار حذف کریں؟</DialogTitle>
          </DialogHeader>
          <p className="font-naskh text-sm leading-7">
            «{confirmDelete?.title}» مکمل طور پر حذف ہو جائے گا۔ یہ کارروائی واپس نہیں ہو سکتی۔
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="font-naskh">منسوخ</Button>
            <Button variant="destructive" onClick={remove} disabled={busy} className="gap-2 font-naskh">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} حذف کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
