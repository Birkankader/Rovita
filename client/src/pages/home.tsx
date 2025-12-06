import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Target, Trophy, Upload } from "lucide-react";
import heroImage from "@assets/generated_images/abstract_career_growth_visualization.png";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16 pt-8 md:pt-16">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-primary bg-primary/5">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Yapay Zeka Destekli Kariyer Gelişimi
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold leading-[1.1] text-foreground">
            Hayalinizdeki İşe Giden <span className="text-primary">Köprüyü Kurun</span>
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl max-w-[600px] leading-relaxed">
            Becerilerinizi gerçek iş tanımlarıyla karşılaştırın, eksiklerinizi belirleyin ve kariyer başarısı için oyunlaştırılmış bir yol haritasını takip edin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/onboarding">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                Hemen Başla
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Demoyu İncele
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-muted/20">
             <img 
            src={heroImage} 
            alt="Kariyer Gelişim Görselleştirmesi" 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: Upload,
            title: "Akıllı Profil İçe Aktarma",
            desc: "LinkedIn'den veya mevcut özgeçmişinizi yükleyerek profilinizi anında oluşturun."
          },
          {
            icon: Target,
            title: "Beceri Açığı Analizi",
            desc: "Eksik becerilerinizi ve bunları nasıl kazanacağınızı görmek için herhangi bir iş ilanını yapıştırın."
          },
          {
            icon: Trophy,
            title: "Oyunlaştırılmış Yol Haritası",
            desc: "Kariyer gelişimini XP, seviyeler ve günlük öğrenme görevleriyle bir oyuna dönüştürün."
          }
        ].map((feature, i) => (
          <div key={i} className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <feature.icon className="size-6" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

    </div>
  );
}
