import Link from "next/link";
import { Mail, Phone, Globe, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

type SocialLink = { platform: string; url: string };

export function SiteFooter({
  settings,
}: {
  settings?: {
    contactEmail?: string; contactPhone?: string; footerNote?: string;
    tagline?: string; socialLinks?: string;
  };
}) {
  let social: SocialLink[] = [];
  try { social = JSON.parse(settings?.socialLinks ?? "[]"); } catch { /* ignore */ }

  const socialIcon = (p: string) => {
    const cls = "h-4 w-4";
    if (/facebook/i.test(p)) return <Facebook className={cls} />;
    if (/twitter|x\.com/i.test(p)) return <Twitter className={cls} />;
    if (/instagram/i.test(p)) return <Instagram className={cls} />;
    if (/youtube/i.test(p)) return <Youtube className={cls} />;
    return <Globe className={cls} />;
  };

  return (
    <footer className="mt-auto pattern-emerald text-[#eee9d8]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="inline-block rounded-lg bg-[#f3ead2] p-1.5">
            {/* official horizontal logo on light plate */}
            { }
            <img
              src="/brand/logo-horizontal.png"
              alt="پیامِ ادب — Payam-e-Adab"
              className="h-24 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 text-sm leading-7 text-[#e5dfc9]/85 font-naskh">
            اردو زبان و ادب کے فروغ، تحفظ اور ڈیجیٹل اشاعت کا ادبی ادارہ۔
          </p>
        </div>

        <nav aria-label="اعداد و شمار">
          <h3 className="mb-4 font-nastaliq-tight text-lg text-[#d9bc6a]">ادبی سرحدیں</h3>
          <ul className="space-y-2 text-sm font-naskh">
            {[
              ["شاعری", "/poetry"],
              ["مضامین", "/articles"],
              ["کتب خانہ", "/books"],
              ["شعرا و ادبا", "/poets"],
              ["ادبی خبریں", "/news"],
              ["ڈیجیٹل اخبار", "/newspaper"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-[#e5dfc9]/85 hover:text-[#d9bc6a] transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="اوزار و خدمات">
          <h3 className="mb-4 font-nastaliq-tight text-lg text-[#d9bc6a]">اوزار و خدمات</h3>
          <ul className="space-y-2 text-sm font-naskh">
            {[
              ["قافیہ تلاش", "/qafiya"],
              ["تقطیع و بحر", "/taqti"],
              ["لغت", "/dictionary"],
              ["اپنی تحریر بھیجیں", "/submit"],
              ["ہمارا تعارف", "/about"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-[#e5dfc9]/85 hover:text-[#d9bc6a] transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 font-nastaliq-tight text-lg text-[#d9bc6a]">رابطہ</h3>
          <ul className="space-y-3 text-sm font-latin" dir="ltr">
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-[#d9bc6a]" />
              <a href={`mailto:${settings?.contactEmail ?? "payameadab@gmail.com"}`} className="text-[#e5dfc9]/85 hover:text-[#d9bc6a] break-all">
                {settings?.contactEmail ?? "payameadab@gmail.com"}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-[#d9bc6a]" />
              <a href={`tel:+91${settings?.contactPhone ?? "9199258187"}`} className="text-[#e5dfc9]/85 hover:text-[#d9bc6a]">
                +91 {settings?.contactPhone ?? "9199258187"}
              </a>
            </li>
          </ul>
          {social.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              {social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9bc6a]/40 text-[#e5dfc9]/85 transition-colors hover:bg-[#d9bc6a]/20 hover:text-[#f3ead2]"
                >
                  {socialIcon(s.platform)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#d9bc6a]/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[#e5dfc9]/70 sm:flex-row">
          <p className="font-naskh">{settings?.footerNote ?? "© پیامِ ادب — تمام حقوق محفوظ ہیں"}</p>
          <p className="font-latin tracking-widest">URDU LITERATURE · DIGITALLY PRESERVED</p>
        </div>
      </div>
    </footer>
  );
}
