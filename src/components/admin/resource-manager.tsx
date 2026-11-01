"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, UploadCloud } from "lucide-react";
import {
  ADMIN_RESOURCES, SPECIAL_RESOURCES, STATUS_URDU_ADMIN,
  type ResourceConfig, type FieldDef,
} from "@/lib/admin-resources";

type Row = Record<string, unknown> & { id: string };

export function ResourceManager({ resource }: { resource: string }) {
  const config: ResourceConfig | undefined = ADMIN_RESOURCES[resource] ?? SPECIAL_RESOURCES[resource];
  const special = SPECIAL_RESOURCES[resource];

  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    const url = special ? `/api/${special.api}?all=1&limit=200` : `/api/${resource}?all=1&limit=200`;
    const res = await fetch(url);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }, [resource, special]);

  useEffect(() => { load(); }, [load]);

  if (!config) return <p className="p-8 font-naskh">نامعلوم خانہ</p>;

  const filtered = (rows ?? []).filter((r) => {
    if (!q.trim()) return true;
    return config.fields.some((f) => {
      const v = r[f.key];
      return typeof v === "string" && v.includes(q.trim());
    });
  });

  const openCreate = () => {
    const init: Record<string, unknown> = {};
    for (const f of config.fields) {
      init[f.key] = f.type === "bool" ? false : f.type === "number" ? 0 : "";
    }
    setForm(init);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (row: Row) => {
    const init: Record<string, unknown> = {};
    for (const f of config.fields) {
      let v = row[f.key];
      if (f.type === "date" && v) v = new Date(v as string).toISOString().slice(0, 10);
      init[f.key] = v ?? (f.type === "bool" ? false : "");
    }
    setForm(init);
    setEditing(row);
    setCreating(false);
  };

  const upload = async (file: File, key: string, kind: "image" | "pdf") => {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "اپلوڈ ناکام", description: data.error, variant: "destructive" });
        return;
      }
      setForm((f) => ({ ...f, [key]: data.url }));
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of config.fields) {
        const v = form[f.key];
        if (f.type === "bool") payload[f.key] = Boolean(v);
        else payload[f.key] = v === "" ? null : v;
      }
      // never blank a required pdf/image silently
      let url: string;
      let method: string;
      if (special) {
        url = `/api/${special.api}`;
        method = editing ? "PATCH" : "POST";
        if (editing) payload.id = editing.id;
      } else {
        url = editing ? `/api/${resource}/${editing.id}` : `/api/${resource}`;
        method = editing ? "PATCH" : "POST";
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "محفوظ نہیں ہوا", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: editing ? "اپ ڈیٹ ہو گیا" : "محفوظ ہو گیا" });
      setEditing(null);
      setCreating(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: Row) => {
    setBusy(true);
    try {
      const url = special ? `/api/${special.api}?id=${row.id}` : `/api/${resource}/${row.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "حذف نہیں ہوا", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "حذف ہو گیا" });
      setConfirmDelete(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const renderField = (f: FieldDef) => {
    const v = form[f.key];
    switch (f.type) {
      case "textarea":
        return (
          <Textarea
            value={(v as string) ?? ""}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            rows={f.key === "content" || f.key === "rhymes" ? 8 : 4}
            className="font-nastaliq text-base leading-[2.4]"
          />
        );
      case "bool":
        return (
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={Boolean(v)} onCheckedChange={(c) => setForm({ ...form, [f.key]: c })} />
            <span className="text-sm font-naskh text-muted-foreground">{v ? "ہاں" : "نہیں"}</span>
          </div>
        );
      case "select":
        return (
          <Select value={(v as string) ?? ""} onValueChange={(val) => setForm({ ...form, [f.key]: val })}>
            <SelectTrigger className="font-naskh"><SelectValue placeholder="منتخب کریں" /></SelectTrigger>
            <SelectContent className="max-h-72 font-naskh">
              {(f.options ?? []).map((o) => (
                <SelectItem key={o} value={o}>
                  {f.key === "status" ? STATUS_URDU_ADMIN[o] ?? o : o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            dir="ltr"
            value={(v as string) ?? ""}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            className="font-latin"
          />
        );
      case "number":
        return (
          <Input
            type="number"
            dir="ltr"
            value={(v as string | number) ?? 0}
            onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
            className="font-latin"
          />
        );
      case "image":
      case "pdf":
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept={f.type === "image" ? "image/*" : "application/pdf"}
              className="hidden"
              id={`up-${f.key}`}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], f.key, f.type === "pdf" ? "pdf" : "image")}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`up-${f.key}`)?.click()}
                className="gap-2 border-gold/40 font-naskh"
              >
                {uploading === f.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {f.type === "image" ? "تصویر اپلوڈ کریں" : "PDF اپلوڈ کریں"}
              </Button>
              <Input
                dir="ltr"
                value={(v as string) ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder="/uploads/…"
                className="flex-1 font-latin text-xs"
              />
            </div>
            {f.type === "image" && typeof v === "string" && v && (
               
              <img src={v} alt="پیش منظر" className="h-24 rounded-lg border border-gold/30 object-cover" />
            )}
          </div>
        );
      default:
        return (
          <Input
            value={(v as string) ?? ""}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            className="font-naskh"
          />
        );
    }
  };

  const cellValue = (row: Row, colKey: string, colType?: string) => {
    const v = row[colKey];
    if (colType === "image") {
      return typeof v === "string" && v ? (
         
        <img src={v} alt="" className="h-10 w-14 rounded border border-gold/30 object-cover" />
      ) : <span className="text-muted-foreground">—</span>;
    }
    if (colType === "bool") return v ? "✓" : "—";
    if (colType === "badge") {
      const text = colKey === "status" ? STATUS_URDU_ADMIN[String(v)] ?? String(v) : String(v ?? "—");
      return <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-naskh text-primary">{text}</span>;
    }
    if (v == null || v === "") return <span className="text-muted-foreground">—</span>;
    const s = String(v);
    return s.length > 60 ? s.slice(0, 60) + "…" : s;
  };

  return (
    <div>
      <AdminPageHeader
        title={config.title}
        subtitle={config.subtitle}
        action={
          <Button onClick={openCreate} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
            <Plus className="h-4 w-4" /> نیا اندراج
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={config.searchHint} className="bg-card pe-8 font-naskh" />
      </div>

      {rows === null ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gold/40 bg-card p-10 text-center font-naskh text-sm text-muted-foreground">
          کوئی اندراج موجود نہیں — «نیا اندراج» سے آغاز کریں۔
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gold/25 bg-card nice-scroll">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60">
                  {config.columns.map((c) => (
                    <TableHead key={c.key} className="font-naskh text-primary">{c.label}</TableHead>
                  ))}
                  <TableHead className="font-naskh text-primary">کارروائی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className="font-naskh text-sm">
                        {cellValue(row, c.key, c.type)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="تبدیلی" className="h-8 w-8 text-primary hover:bg-accent">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(row)} aria-label="حذف" className="h-8 w-8 text-destructive hover:bg-[#fbe4e4]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* create/edit dialog */}
      <Dialog open={creating || editing !== null} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-h-[88vh] overflow-y-auto nice-scroll sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-primary">
              {editing ? "تبدیلی کریں" : "نیا اندراج"} — {config.title}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            {config.fields.map((f) => (
              <div key={f.key} className={`space-y-2 ${f.full ? "sm:col-span-2" : ""}`}>
                <Label className="font-naskh">
                  {f.label}
                  {f.type === "pdf" && " *"}
                </Label>
                {renderField(f)}
                {f.hint && <p className="text-[11px] leading-5 font-naskh text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }} className="font-naskh">منسوخ</Button>
            <Button onClick={save} disabled={busy} className="gap-2 bg-primary font-naskh hover:bg-emerald-deep">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} محفوظ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-nastaliq-tight text-xl text-destructive">حذف کی تصدیق</DialogTitle>
          </DialogHeader>
          <p className="font-naskh text-sm leading-7 text-foreground/80">
            کیا آپ واقعی «{confirmDelete ? String(confirmDelete.title ?? confirmDelete.word ?? confirmDelete.name ?? "یہ اندراج") : ""}» حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="font-naskh">منسوخ</Button>
            <Button onClick={() => confirmDelete && remove(confirmDelete)} disabled={busy} className="bg-destructive font-naskh hover:bg-destructive/90">حذف کریں</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
