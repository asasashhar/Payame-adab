import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SectionHeading, Divider } from "@/components/site/section-heading";
import { LogoMark } from "@/components/site/logo";
import { BookOpen, Feather, Library, Newspaper, Sparkles, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "ہمارا تعارف" };

const GOALS = [
  { icon: Feather, title: "فروغِ اردو", text: "اردو زبان و ادب کو ڈیجیٹل دور میں زندہ رکھنا اور نئی نسل تک اس کی رسائی آسان بنانا۔" },
  { icon: Library, title: "ڈیجیٹل کتب خانہ", text: "کلاسیکی اور معاصر کتب کا آن لائن ذخیرہ — مطالعہ کے لیے ہر جگہ، ہر وقت دستیاب۔" },
  { icon: Users, title: "نئے لکھنے والوں کی حوصلہ افزائی", text: "نئے شاعروں اور ادیبوں کو معیاری اشاعت کا پلیٹ فارم اور ادارتی رہنمائی فراہم کرنا۔" },
  { icon: Newspaper, title: "ڈیجیٹل اشاعت", text: "ہفتہ وار اخبار، ادبی شمارے اور تحقیقی مواد کی جدید اور محفوظ اشاعت۔" },
  { icon: BookOpen, title: "ادبی ذخیرہ", text: "شاعری، مضامین، تنقید اور تحقیق کا منظم آرکائیو — تلاش کے قابل، محفوظ اور مستقل۔" },
  { icon: Sparkles, title: "عروض و لسانیات", text: "قافیہ تلاش اور تقطیع کے اوزار — اردو عروض کی تکنیکی مدد نئے شاعروں کے لیے۔" },
];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 paper-bg">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="manuscript-frame relative overflow-hidden rounded-xl bg-[#fffdf7] p-8 sm:p-12">
            <div className="flex flex-col items-center text-center">
              <LogoMark size={96} className="mb-4 shadow-md" />
              <h1 className="font-nastaliq-tight text-4xl leading-[1.9] text-emerald-ink">ہمارا تعارف</h1>
              <p className="mt-1 font-naskh text-gold">{settings.tagline}</p>
            </div>
            <div className="mx-auto mt-6 max-w-2xl">
              {settings.aboutText.split(/\n{2,}|\n/).filter(Boolean).map((para, i) => (
                <p key={i} className="literary-content text-justify text-[17px]">{para.trim()}</p>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <SectionHeading title="ہمارے مقاصد" center />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GOALS.map((g) => (
                <div key={g.title} className="manuscript-frame rounded-xl bg-card p-5">
                  <g.icon className="mb-2 h-7 w-7 text-gold" />
                  <h3 className="font-nastaliq-tight text-lg leading-8 text-primary">{g.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-foreground/75 font-naskh">{g.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div className="manuscript-frame rounded-xl bg-card p-6 text-center">
            <h3 className="font-nastaliq-tight text-xl text-primary">ادارتی پالیسی</h3>
            <p className="mx-auto mt-2 max-w-2xl font-naskh text-sm leading-8 text-foreground/80">
              پیامِ ادب پر شائع ہونے والی ہر تحریر ادارتی معائنے سے گزرتی ہے۔ قاری کی بھیجی ہوئی تحریریں
              خودکار طور پر شائع نہیں ہوتیں؛ ایڈیٹر معیار، اصالت اور حقوقِ اشاعت کی جانچ کے بعد منظوری دیتے ہیں۔
              مقامی سانچے اور نقل شدہ مواد رد کر دیا جاتا ہے۔
            </p>
          </div>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
