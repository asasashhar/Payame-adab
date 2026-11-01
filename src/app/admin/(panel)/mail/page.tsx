"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Send, RefreshCw, Trash2, MailCheck, MailWarning, MailQuestion, Info, FileText, RotateCcw, Eye } from "lucide-react";

type MailRow = {
  id: string; toEmail: string; subject: string; kind: string; status: string;
  error: string | null; attempts: number; createdAt: string; sentAt: string | null;
  relatedType: string | null; relatedId: string | null;
};

type MailData = {
  smtpConfigured: boolean; smtpHost: string; smtpPort: string; smtpUser: string;
  smtpFrom: string; mailEnabled: boolean;
  counters: { SENT: number; FAILED: number; PENDING: number };
  logs: MailRow[];
};

const KIND_URDU: Record<string, string> = {
  PUBLISHED: "اشاعت کی خوشخبری", APPROVED: "منظوری", REJECTED: "مستردی",
  REVISION: "اصلاح مطلوب", PENDING: "زیرِ جائزہ اطلاع",
  VERIFY: "ای میل تصدیق", RESET: "پاس ورڈ بازیابی", TEST: "آزمائشی",
};

const TEMPLATE_KINDS = ["PUBLISHED", "APPROVED", "REJECTED", "REVISION", "PENDING", "VERIFY", "RESET"] as const;

type TplKind = (typeof TEMPLATE_KINDS)[number];

const PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: "[مصنف کا نام]", meaning: "مصنف کا رجسٹرڈ نام" },
  { token: "[تحریر کا عنوان]", meaning: "تحریر کا عنوان" },
  { token: "[سائٹ کا نام]", meaning: "ویب سائٹ کا نام" },
  { token: "[لنک]", meaning: "متعلقہ صفحے کا لنک (بٹن کی صورت میں)" },
  { token: "[وجہ]", meaning: "ایڈمن کا ذاتی پیغام / وجہ (خصوصی خانے میں)" },
  { token: "[تجاویز]", meaning: "بہتری کی تجاویز (خصوصی خانے میں)" },
];

const STATUS_UI: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  SENT: { label: "بھیجی گئی", cls: "bg-emerald-deep/10 text-emerald-deep", icon: <MailCheck className="h-3.5 w-3.5" /> },
  FAILED: { label: "ناکام", cls: "bg-[#fbe4e4] text-[#a03333]", icon: <MailWarning className="h-3.5 w-3.5" /> },
  PENDING: { label: "قطار میں", cls: "bg-[#fdf3d7] text-[#8a6d1a]", icon: <MailQuestion className="h-3.5 w-3.5" /> },
};

export default function AdminMailPage() {
  const [data, setData] = useState<MailData | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [smtp, setSmtp] = useState({ host: "", port: "587", secure: false, user: "", pass: "", from: "", enabled: true });
  const [testTo, setTestTo] = useState("");
  const [tpl, setTpl] = useState<Record<string, { subject: string; body: string }>>({});
  const [tplSaving, setTplSaving] = useState(false);
  const [tplOpen, setTplOpen] = useState<TplKind | null>(null);
  const [preview, setPreview] = useState<{ subject: string; toEmail: string; bodyHtml: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/mail?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const d = await res.json();
        setPreview({ subject: d.subject, toEmail: d.toEmail, bodyHtml: d.bodyHtml });
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const load = useCallback(async () => {
    const res = await fetch("/api/mail");
    if (!res.ok) { toast({ title: "اجازت نہیں", variant: "destructive" }); return; }
    const d = (await res.json()) as MailData;
    setData(d);
    setSmtp({
      host: d.smtpHost, port: d.smtpPort, secure: d.smtpPort === "465",
      user: d.smtpUser, pass: "", from: d.smtpFrom, enabled: d.mailEnabled,
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // load editable email templates
  const loadTemplates = useCallback(async () => {
    const s = await fetch("/api/settings").then((r) => r.json());
    const next: Record<string, { subject: string; body: string }> = {};
    for (const k of TEMPLATE_KINDS) {
      next[k] = { subject: s[`mailTpl_${k}_subject`] ?? "", body: s[`mailTpl_${k}_body`] ?? "" };
    }
    setTpl(next);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const saveTemplates = async () => {
    setTplSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const k of TEMPLATE_KINDS) {
        body[`mailTpl_${k}_subject`] = tpl[k]?.subject ?? "";
        body[`mailTpl_${k}_body`] = tpl[k]?.body ?? "";
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) toast({ title: "ای میل ٹیمپلیٹس محفوظ ہو گئیں", description: "اگلی اطلاعات اسی نئے متن میں جائیں گی۔" });
      else toast({ title: "محفوظ نہیں ہوا", variant: "destructive" });
    } finally {
      setTplSaving(false);
    }
  };

  const saveSmtp = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "save-smtp",
          mailEnabled: smtp.enabled,
          smtpHost: smtp.host,
          smtpPort: smtp.port,
          smtpSecure: smtp.secure ? "1" : "0",
          smtpUser: smtp.user,
          smtpPass: smtp.pass, // empty → keeps the saved password
          smtpFrom: smtp.from,
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast({ title: "محفوظ نہیں ہوا", description: d.error, variant: "destructive" }); return; }
      toast({ title: "SMTP ترتیبات محفوظ ہو گئیں" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "send-test", to: testTo || undefined }),
      });
      const d = await res.json();
      if (!res.ok) { toast({ title: "خرابی", description: d.error, variant: "destructive" }); return; }
      if (d.ok) toast({ title: "آزمائشی ای میل بھیج دی گئی — لاگ میں حیثیت دیکھیں" });
      else toast({ title: "بھیجی نہیں جا سکی", description: "نیچے لاگ میں خرابی کی تفصیل دیکھیں۔", variant: "destructive" });
      load();
    } finally {
      setTesting(false);
    }
  };

  const resend = async (id: string) => {
    setResending(id);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "resend", id }),
      });
      const d = await res.json();
      toast({
        title: d.ok ? "دوبارہ بھیجنے کی کوشش کامیاب" : "دوبارہ بھیجنا ناکام",
        variant: d.ok ? undefined : "destructive",
      });
      load();
    } finally {
      setResending(null);
    }
  };

  const remove = async (id: string) => {
    await fetch("/api/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "delete", id }),
    });
    load();
  };

  return (
    <div>
      <AdminPageHeader
        title="ای میل سینٹر"
        subtitle="SMTP ترتیبات، آزمائشی پیغام اور تمام بھیجی گئی/ناکام اطلاعات کا ریکارڈ"
      />

      {/* SMTP settings */}
      <section className="mb-8 rounded-xl border border-gold/25 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <Send className="h-5 w-5 text-gold" /> SMTP ترتیبات
        </h2>
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-[#eef6f0] px-4 py-3 text-xs font-naskh leading-6 text-[#2f6d46]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Gmail استعمال کے لیے: smtp.gmail.com، پورٹ 587، اپنا Gmail ایڈریس اور <b>App Password</b> (عام پاس ورڈ نہیں) درج کریں۔
            Google اکاؤنٹ کی سیکیورٹی ترتیبات سے 2-Step Verification آن کر کے App Password بنائیں۔ ترتیبات خالی ہوں تو اطلاعات قطار میں رہتی ہیں اور بعد میں دوبارہ بھیجی جا سکتی ہیں۔
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="font-naskh">SMTP سرور (مثلاً smtp.gmail.com)</Label>
            <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} dir="ltr" className="font-latin text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-naskh">پورٹ (587 TLS / 465 SSL)</Label>
            <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value, secure: e.target.value === "465" })} dir="ltr" className="font-latin text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-naskh">استعمال کا نام / ای میل</Label>
            <Input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} dir="ltr" className="font-latin text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-naskh">پاس ورڈ / App Password {data?.smtpHost ? "(خالی چھوڑیں تو پرانا رہے گا)" : ""}</Label>
            <Input type="password" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} dir="ltr" className="font-latin text-sm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="font-naskh">بھیجنے والا نام و ای میل (From)</Label>
            <Input value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} dir="ltr" className="font-latin text-sm" placeholder="Payam-e-Adab <payameadab@gmail.com>" />
          </div>
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-accent/40 px-4 py-2.5 sm:w-64">
              <span className="font-naskh text-sm">ای میل اطلاعات فعال</span>
              <Switch checked={smtp.enabled} onCheckedChange={(v) => setSmtp({ ...smtp, enabled: v })} />
            </label>
            <Button onClick={saveSmtp} disabled={saving} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} محفوظ کریں
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gold/20 pt-4">
          <div className="space-y-1.5">
            <Label className="font-naskh">آزمائشی ای میل کس پتے پر؟</Label>
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} dir="ltr" placeholder="خالی چھوڑیں تو اپنے ای میل پر" className="w-72 font-latin text-sm" />
          </div>
          <Button variant="outline" onClick={sendTest} disabled={testing} className="gap-2 border-gold/40 font-naskh">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} آزمائشی پیغام بھیجیں
          </Button>
          {data && (
            <p className={data.smtpConfigured ? "text-xs font-naskh text-emerald-deep" : "text-xs font-naskh text-[#8a6d1a]"}>
              {data.smtpConfigured ? "✓ SMTP ترتیب مکمل — ای میلیں براہِ راست بھیجی جا رہی ہیں" : "⚠ SMTP ترتیب نامکمل — اطلاعات قطار میں جمع ہو رہی ہیں"}
            </p>
          )}
        </div>
      </section>

      {/* editable email templates */}
      <section className="mb-8 rounded-xl border border-gold/25 bg-card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-nastaliq-tight text-xl text-primary">
          <FileText className="h-5 w-5 text-gold" /> ای میل ٹیمپلیٹس — متن بدلیں
        </h2>
        <p className="mb-4 font-naskh text-xs leading-6 text-muted-foreground">
          خالی خانے کا مطلب ہے سسٹم کا اصل اردو ٹیمپلیٹ استعمال ہو رہا ہے۔ کوئی ٹیمپلیٹ بدلیں تو وہی متن بھیجا جائے گا —
          ہر قسم کا موضوع اور متن الگ الگ ترتیب دیا جا سکتا ہے۔ درج ذیل نشانات (placeholders) خودکار طور پر اصل معلومات سے بدل دیے جاتے ہیں:
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((ph) => (
            <span key={ph.token} className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-[11px] font-naskh" title={ph.meaning}>
              <b className="text-primary">{ph.token}</b>
              <span className="text-muted-foreground">{ph.meaning}</span>
            </span>
          ))}
        </div>
        <div className="space-y-3">
          {TEMPLATE_KINDS.map((k) => {
            const open = tplOpen === k;
            const custom = !!(tpl[k]?.subject?.trim() || tpl[k]?.body?.trim());
            return (
              <div key={k} className="rounded-lg border border-gold/25 bg-accent/30">
                <button
                  type="button"
                  onClick={() => setTplOpen(open ? null : k)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
                >
                  <span className="flex items-center gap-2 font-naskh text-sm">
                    <span className="font-semibold">{KIND_URDU[k]}</span>
                    {custom && <span className="rounded-full bg-emerald-deep/10 px-2 py-0.5 text-[10px] text-emerald-deep">کسٹم متن فعال</span>}
                  </span>
                  <span className="font-naskh text-xs text-muted-foreground">{open ? "بند کریں ▲" : "کھولیں ▼"}</span>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-gold/20 px-4 pb-4 pt-3">
                    <div className="space-y-1.5">
                      <Label className="font-naskh">ای میل کا موضوع</Label>
                      <Input
                        value={tpl[k]?.subject ?? ""}
                        onChange={(e) => setTpl({ ...tpl, [k]: { ...tpl[k], subject: e.target.value } })}
                        placeholder="خالی = اصل موضوع"
                        className="font-naskh"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-naskh">ای میل کا متن (ہر سطر الگ پیراگراف بنے گا؛ **بولڈ** بھی استعمال کر سکتے ہیں)</Label>
                      <Textarea
                        value={tpl[k]?.body ?? ""}
                        onChange={(e) => setTpl({ ...tpl, [k]: { ...tpl[k], body: e.target.value } })}
                        placeholder="خالی = اصل اردو ٹیمپلیٹ"
                        rows={8}
                        className="font-naskh leading-8"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-gold/40 font-naskh text-xs"
                      onClick={() => setTpl({ ...tpl, [k]: { subject: "", body: "" } })}
                    >
                      <RotateCcw className="h-3 w-3" /> اصل ٹیمپلیٹ پر واپس جائیں
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button onClick={saveTemplates} disabled={tplSaving} className="mt-4 gap-2 bg-primary font-naskh hover:bg-emerald-deep">
          {tplSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} تمام ٹیمپلیٹس محفوظ کریں
        </Button>
      </section>
      {data && (
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          <div className="manuscript-frame rounded-xl bg-card p-4">
            <p className="font-latin text-2xl font-bold text-emerald-deep">{data.counters.SENT}</p>
            <p className="font-naskh text-xs text-muted-foreground">کامیابی سے بھیجی گئیں</p>
          </div>
          <div className="manuscript-frame rounded-xl bg-card p-4">
            <p className="font-latin text-2xl font-bold text-[#a03333]">{data.counters.FAILED}</p>
            <p className="font-naskh text-xs text-muted-foreground">ناکام</p>
          </div>
          <div className="manuscript-frame rounded-xl bg-card p-4">
            <p className="font-latin text-2xl font-bold text-[#8a6d1a]">{data.counters.PENDING}</p>
            <p className="font-naskh text-xs text-muted-foreground">قطار میں</p>
          </div>
        </div>
      )}

      {/* log table */}
      <section className="rounded-xl border border-gold/25 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-nastaliq-tight text-xl text-primary">اطلاعات کا ریکارڈ</h2>
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5 border-gold/40 font-naskh">
            <RefreshCw className="h-3.5 w-3.5" /> تازہ کریں
          </Button>
        </div>
        {!data ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : data.logs.length === 0 ? (
          <p className="py-10 text-center font-naskh text-sm text-muted-foreground">ابھی کوئی ای میل ریکارڈ نہیں ہوئی۔</p>
        ) : (
          <div className="max-h-[520px] overflow-auto nice-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-naskh">حیثیت</TableHead>
                  <TableHead className="font-naskh">وصول کنندہ</TableHead>
                  <TableHead className="font-naskh">موضوع</TableHead>
                  <TableHead className="font-naskh">قسم</TableHead>
                  <TableHead className="font-naskh">وقت</TableHead>
                  <TableHead className="font-naskh">کارروائی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((l) => {
                  const st = STATUS_UI[l.status] ?? STATUS_UI.PENDING;
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-naskh ${st.cls}`}>
                          {st.icon} {st.label}
                        </span>
                        {l.error && <p className="mt-1 max-w-56 truncate text-[10px] font-latin text-destructive" dir="ltr" title={l.error}>{l.error}</p>}
                      </TableCell>
                      <TableCell className="font-latin text-xs" dir="ltr">{l.toEmail}</TableCell>
                      <TableCell className="max-w-72 truncate font-nastaliq-tight text-sm" title={l.subject}>{l.subject}</TableCell>
                      <TableCell className="font-naskh text-xs">{KIND_URDU[l.kind] ?? l.kind}</TableCell>
                      <TableCell className="font-latin text-[11px]" dir="ltr">{new Date(l.createdAt).toLocaleString("en-GB")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 gap-1 border-gold/40 px-2 font-naskh text-xs" disabled={previewLoading} onClick={() => openPreview(l.id)}>
                            {previewLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />} دیکھیں
                          </Button>
                          {l.status !== "SENT" && (
                            <Button size="sm" variant="outline" className="h-7 gap-1 border-gold/40 px-2 font-naskh text-xs" disabled={resending === l.id} onClick={() => resend(l.id)}>
                              {resending === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} دوبارہ
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 border-destructive/30 px-2 text-destructive hover:bg-[#fbe4e4]" onClick={() => remove(l.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* mail preview dialog */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-naskh text-lg text-primary">{preview?.subject}</DialogTitle>
            <p className="font-latin text-xs text-muted-foreground" dir="ltr">To: {preview?.toEmail}</p>
          </DialogHeader>
          <iframe
            title="ای میل پیش منظر"
            srcDoc={preview?.bodyHtml ?? ""}
            sandbox=""
            className="h-[480px] w-full rounded-lg border border-gold/30 bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
