"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, ShieldCheck, ShieldOff, Trash2, KeyRound, Power, Link2, UserCog } from "lucide-react";
import { ADMIN_MODULES } from "@/lib/admin-resources";

type Admin = {
  id: string; email: string; name: string; penName: string | null;
  status: string; mustChangePassword: boolean; lastLoginAt: string | null; createdAt: string;
  permissions?: string;
};
type ResetReq = { id: string; email: string; name: string; resetToken: string | null; resetTokenExpiry: string | null };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [resetRequests, setResetRequests] = useState<ResetReq[]>([]);
  const [maxActive, setMaxActive] = useState(5);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "darulhuda" });
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<Admin | null>(null);
  const [resetTarget, setResetTarget] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("darulhuda");
  const [permTarget, setPermTarget] = useState<Admin | null>(null);
  const [permKeys, setPermKeys] = useState<string[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admins");
    if (res.ok) {
      const d = await res.json();
      setAdmins(d.admins);
      setResetRequests(d.resetRequests ?? []);
      setMaxActive(d.maxActive ?? 5);
      setOwnerEmail(d.ownerEmail ?? "");
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d?.id ? { id: d.id } : null)).catch(() => {});
  }, [load]);

  const op = async (body: Record<string, string>, okTitle: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        toast({ title: d.error ?? "کارروائی ناکام", variant: "destructive" });
        return false;
      }
      toast({ title: okTitle });
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const openPerms = (a: Admin) => {
    setPermTarget(a);
    const p = a.permissions ?? "*";
    setPermKeys(p === "*" ? [] : p.split(",").map((x) => x.trim()).filter(Boolean));
  };

  const isOwner = (a: Admin) => ownerEmail && a.email.toLowerCase() === ownerEmail.toLowerCase();

  const savePerms = async () => {
    if (!permTarget) return;
    // empty selection = no modules selected → treat as full access to avoid lockout
    const value = permKeys.length === 0 ? "*" : permKeys.join(",");
    const ok = await op({ op: "set-permissions", id: permTarget.id, permissions: value },
      permKeys.length === 0 ? "تمام اجازتیں بحال کر دی گئیں" : "اجازتیں محفوظ ہو گئیں");
    if (ok) setPermTarget(null);
  };

  const activeCount = admins?.filter((a) => a.status === "ACTIVE").length ?? 0;
  const canCreate = activeCount < maxActive;

  const getResetLink = async (u: ResetReq) => {
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "reset-link", id: u.id }),
    });
    const d = await res.json();
    if (!res.ok) {
      toast({ title: d.error ?? "لنک نہیں بنا", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}${d.url}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    toast({
      title: "بازیابی لنک کاپی ہو گیا",
      description: `${url} (میعاد: ${new Date(d.expiry).toLocaleString("en-GB")}) — محفوظ ذریعے سے بھیجیں`,
    });
  };

  return (
    <div>
      <AdminPageHeader
        title="ایڈمنسٹریٹرز کا انتظام"
        subtitle={`زیادہ سے زیادہ ${maxActive} فعال ایڈمنسٹریٹر — فی الحال ${activeCount} فعال۔ تمام حقوق سرور پر نافذ ہیں۔`}
        action={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              <Plus className="h-4 w-4" /> نیا ایڈمنسٹریٹر
            </Button>
          ) : (
            <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-naskh text-muted-foreground">
              حد پوری ہو چکی ہے ({activeCount}/{maxActive})
            </span>
          )
        }
      />

      {admins === null ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gold/25 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 text-primary font-naskh">
                  <th className="px-4 py-3 text-start">نام</th>
                  <th className="px-4 py-3 text-start">ای میل</th>
                  <th className="px-4 py-3 text-start">حالت</th>
                  <th className="px-4 py-3 text-start">پچھلا لاگ اِن</th>
                  <th className="px-4 py-3 text-start">تخلیق</th>
                  <th className="px-4 py-3 text-start">کارروائیاں</th>
                </tr>
              </thead>
              <tbody className="font-naskh">
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-gold/15">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className={`h-4 w-4 ${a.status === "ACTIVE" ? "text-primary" : "text-muted-foreground"}`} />
                        {a.name}
                        {a.id === me?.id && <Badge variant="outline" className="font-naskh text-[10px]">آپ</Badge>}
                        {isOwner(a) && <Badge className="bg-gold/20 font-naskh text-[10px] text-[#8a6d1a]">بانی</Badge>}
                      </span>
                      {a.mustChangePassword && (
                        <span className="mt-0.5 block text-[11px] text-[#8a6d1a]">ابتدائی پاس ورڈ استعمال میں</span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {(a.permissions ?? "*") === "*" ? "تمام اجازتیں" : `${(a.permissions ?? "").split(",").filter(Boolean).length} حصے`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-latin text-xs" dir="ltr">{a.email}</td>
                    <td className="px-4 py-3">
                      {a.status === "ACTIVE" ? (
                        <Badge className="bg-[#e3f0e6] font-naskh text-[#2f6d46]">فعال</Badge>
                      ) : (
                        <Badge className="bg-muted font-naskh text-muted-foreground">معطل</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-latin text-xs" dir="ltr">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 font-latin text-xs" dir="ltr">
                      {new Date(a.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 gap-1.5 font-naskh text-xs text-primary hover:bg-accent"
                          disabled={busy}
                          onClick={() => { setResetTarget(a); setNewPassword("darulhuda"); }}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> پاس ورڈ
                        </Button>
                        {!isOwner(a) && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 font-naskh text-xs text-[#6d5311] hover:bg-accent"
                            disabled={busy}
                            onClick={() => openPerms(a)}
                          >
                            <UserCog className="h-3.5 w-3.5" /> اجازتیں
                          </Button>
                        )}
                        {a.id !== me?.id && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 font-naskh text-xs text-[#2a4d8f] hover:bg-accent"
                            disabled={busy || (a.status === "ACTIVE" && activeCount <= 1)}
                            onClick={() => op({ op: "toggle", id: a.id }, a.status === "ACTIVE" ? "اکاؤنٹ معطل ہو گیا" : "اکاؤنٹ فعال ہو گیا")}
                            title={a.status === "ACTIVE" ? "معطل کریں" : "فعال کریں"}
                          >
                            {a.status === "ACTIVE" ? <ShieldOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                            {a.status === "ACTIVE" ? "معطل" : "فعال"}
                          </Button>
                        )}
                        {a.id !== me?.id && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 font-naskh text-xs text-destructive hover:bg-[#fbe4e4]"
                            disabled={busy}
                            onClick={() => setConfirmRevoke(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> ہٹائیں
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="mb-3 mt-8 font-nastaliq-tight text-xl text-primary">پاس ورڈ بازیابی کی درخواستیں</h2>
      <div className="manuscript-frame rounded-xl bg-card p-5">
        {resetRequests.length === 0 ? (
          <p className="py-2 text-center font-naskh text-sm text-muted-foreground">ابھی کوئی درخواست زیرِ التوا نہیں۔</p>
        ) : (
          <ul className="space-y-2">
            {resetRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent/50 px-3 py-2">
                <span className="font-naskh text-sm">
                  {r.name} <span className="font-latin text-xs text-muted-foreground" dir="ltr">({r.email})</span>
                  <span className="ms-2 rounded-full bg-[#fdf3d7] px-2 py-0.5 text-[10px] text-[#8a6d1a]">
                    میعاد: {r.resetTokenExpiry ? new Date(r.resetTokenExpiry).toLocaleString("en-GB") : "—"}
                  </span>
                </span>
                <Button size="sm" variant="outline" className="gap-1.5 font-naskh" onClick={() => getResetLink(r)}>
                  <Link2 className="h-3.5 w-3.5" /> بازیابی لنک کاپی کریں
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs font-naskh leading-6 text-muted-foreground">
          نظام میں ای میل سروس موجود نہیں، اس لیے بازیابی کا محفوظ طریقہ یہ ہے: درخواست دہندہ «پاس ورڈ بھول گئے» صفحے سے درخواست دیتا ہے، پھر کوئی بھی مجاز ایڈمنسٹریٹر اوپر سے ایک وقتی (30 منٹ) بازیابی لنک کاپی کر کے متعلقہ شخص کو بھیج دیتا ہے۔
        </p>
      </div>

      {/* create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">نیا ایڈمنسٹریٹر ({activeCount + 1}/{maxActive})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="font-naskh">نام</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-naskh" placeholder="مکمل نام" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">ای میل</Label>
              <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="font-latin" placeholder="admin@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-naskh">ابتدائی پاس ورڈ</Label>
              <Input dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-latin" />
              <p className="text-[11px] font-naskh text-muted-foreground">
                ڈیفالٹ «darulhuda» ہے — پہلے لاگ اِن کے بعد پاس ورڈ تبدیل کرنا لازمی قرار دیا جاتا ہے۔
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="font-naskh">منسوخ</Button>
            <Button
              disabled={busy}
              className="gap-2 bg-primary font-naskh hover:bg-emerald-deep"
              onClick={async () => {
                const ok = await op({ op: "create", ...form }, "ایڈمنسٹریٹر بنا دیا گیا");
                if (ok) { setCreateOpen(false); setForm({ name: "", email: "", password: "darulhuda" }); }
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} بنائیں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reset password dialog */}
      <Dialog open={resetTarget !== null} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">
              پاس ورڈ ری سیٹ — {resetTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="font-naskh">نیا پاس ورڈ</Label>
              <Input dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="font-latin" />
              <p className="text-[11px] font-naskh text-muted-foreground">
                متعلقہ ایڈمن اگلے لاگ اِن پر نیا پاس ورڈ مقرر کرنے کی ہدایت دیا جائے گا۔
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} className="font-naskh">منسوخ</Button>
            <Button
              disabled={busy}
              className="gap-2 bg-primary font-naskh hover:bg-emerald-deep"
              onClick={async () => {
                if (!resetTarget) return;
                const ok = await op({ op: "reset-password", id: resetTarget.id, password: newPassword }, "پاس ورڈ ری سیٹ ہو گیا");
                if (ok) setResetTarget(null);
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} ری سیٹ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* permissions dialog */}
      <Dialog open={permTarget !== null} onOpenChange={(o) => !o && setPermTarget(null)}>
        <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto nice-scroll sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">
              اجازتیں — {permTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs font-naskh leading-6 text-muted-foreground">
            ہر ایڈمنسٹریٹر کے لیے منتخب کریں کہ وہ پینل کے کون کون سے حصے استعمال کر سکتا ہے۔
            اجازتیں سرور پر نافذ ہوتی ہیں — بغیر اجازت کے متعلقہ API بھی مسترد کر دیے جائیں گے۔
            سب کچھ منتخب نہ ہو تو «تمام اجازتیں» کا بٹن استعمال کریں۔
          </p>
          <div className="space-y-1.5 py-1">
            <button
              type="button"
              onClick={() => setPermKeys(ADMIN_MODULES.map((m) => m.key))}
              className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-naskh text-[#6d5311] hover:bg-accent"
            >
              تمام اجازتیں منتخب کریں
            </button>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {ADMIN_MODULES.map((m) => (
                <label key={m.key} className="flex cursor-pointer items-start gap-2 rounded-lg border border-gold/25 bg-accent/30 px-3 py-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-3.5 w-3.5"
                    checked={permKeys.includes(m.key)}
                    onChange={(e) => setPermKeys((ks) => (e.target.checked ? [...ks, m.key] : ks.filter((k) => k !== m.key)))}
                  />
                  <span className="font-naskh text-xs leading-6">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermTarget(null)} className="font-naskh">منسوخ</Button>
            <Button onClick={savePerms} disabled={busy} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} محفوظ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* revoke confirm */}
      <Dialog open={confirmRevoke !== null} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-destructive">ایڈمنسٹریٹر ہٹائیں؟</DialogTitle>
          </DialogHeader>
          <p className="font-naskh text-sm leading-7 text-foreground/85">
            کیا آپ واقعی <strong>{confirmRevoke?.name}</strong> (<span className="font-latin" dir="ltr">{confirmRevoke?.email}</span>) کا ایڈمن اکاؤنٹ ہٹانا چاہتے ہیں؟ یہ کارروائی کالعدم نہیں ہو سکتی۔
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)} className="font-naskh">منسوخ</Button>
            <Button
              disabled={busy}
              className="gap-2 bg-destructive font-naskh hover:bg-destructive/90"
              onClick={async () => {
                if (!confirmRevoke) return;
                const ok = await op({ op: "revoke", id: confirmRevoke.id }, "اکاؤنٹ ہٹا دیا گیا");
                if (ok) setConfirmRevoke(null);
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} ہٹا دیں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
