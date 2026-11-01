import Link from "next/link";
import { LogoMark } from "@/components/site/logo";

export const metadata = { title: "صفحہ نہیں ملا" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center paper-bg px-4 text-center">
      <LogoMark size={88} className="mb-6 shadow-md" />
      <p className="font-latin text-7xl font-bold text-gold">404</p>
      <h1 className="mt-3 font-nastaliq-tight text-3xl leading-[1.9] text-emerald-ink">
        یہ صفحہ کتابوں کی کسی الماری میں کہیں کھو گیا ہے
      </h1>
      <p className="mt-2 max-w-md font-naskh text-sm leading-8 text-muted-foreground">
        آپ جو صفحہ تلاش کر رہے ہیں وہ موجود نہیں یا منتقل کر دیا گیا ہے۔
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-primary px-6 py-2.5 font-naskh text-sm font-semibold text-primary-foreground hover:bg-emerald-deep">
          ہوم پیج پر واپس
        </Link>
        <Link href="/poetry" className="rounded-lg border border-gold/40 bg-card px-6 py-2.5 font-naskh text-sm font-semibold text-primary hover:bg-accent">
          شاعری پڑھیں
        </Link>
      </div>
    </div>
  );
}
