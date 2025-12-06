import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, Lock, PlayCircle, BookOpen, Video, Users, Clock, BrainCircuit } from "lucide-react";
import { Link } from "wouter";

export default function Roadmap() {
  const quests = [
    {
      id: 1,
      title: "Tasarım Sistemleri Ustalığı",
      description: "Figma'da ölçeklenebilir tasarım sistemleri oluşturmayı ve sürdürmeyi öğrenin.",
      level: "Orta Seviye",
      xp: 500,
      status: "active",
      progress: 35,
      tasks: [
        { id: 101, title: "Kurs: Atomik Tasarım Prensipleri", type: "video", duration: "45 dk", completed: true },
        { id: 102, title: "Atölye: Bileşen Kütüphaneleri Oluşturma", type: "atölye", duration: "2 saat", completed: false },
        { id: 103, title: "Proje: Bir Buton Sistemi Oluştur", type: "proje", duration: "1 saat", completed: false },
      ]
    },
    {
      id: 2,
      title: "Kullanıcı Araştırması Temelleri",
      description: "Nitel ve nicel araştırma yöntemleriyle kullanıcı ihtiyaçlarını anlayın.",
      level: "Başlangıç",
      xp: 350,
      status: "locked",
      progress: 0,
      tasks: [
        { id: 201, title: "Okuma: The Mom Test", type: "kitap", duration: "3 saat", completed: false },
        { id: 202, title: "Test: Araştırma Metodolojileri", type: "test", duration: "15 dk", completed: false },
      ]
    },
    {
      id: 3,
      title: "Tasarımcılar için Liderlik",
      description: "Tasarım kararlarını paydaşlara iletmek için sosyal beceri eğitimi.",
      level: "İleri Seviye",
      xp: 800,
      status: "locked",
      progress: 0,
      tasks: []
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Gelişim Yol Haritanız</h1>
          <p className="text-muted-foreground">Beceri açıklarınıza göre özelleştirilmiş oyunlaştırılmış öğrenme yolu.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/assessment">
            <Button variant="outline" className="gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
              <BrainCircuit className="size-4" />
              Sosyal Beceri Testini Çöz
            </Button>
          </Link>
          <Card className="px-4 py-2 border-accent/20 bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Toplam XP</p>
                <p className="font-bold text-accent text-lg">4,250</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Seri</p>
                <p className="font-bold text-foreground text-lg">🔥 3 Gün</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Quest List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider mb-2">Mevcut Görevler</h3>
          {quests.map((quest) => (
            <div 
              key={quest.id} 
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                quest.status === 'active' 
                  ? 'bg-card border-primary/50 shadow-md ring-1 ring-primary/20' 
                  : 'bg-muted/30 border-transparent hover:bg-muted/50 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant={quest.status === 'active' ? 'default' : 'secondary'} className={quest.status === 'active' ? 'bg-primary' : ''}>
                  {quest.status === 'active' ? 'Devam Ediyor' : 'Kilitli'}
                </Badge>
                <span className="text-xs font-bold text-accent">+{quest.xp} XP</span>
              </div>
              <h4 className="font-bold mb-1">{quest.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{quest.description}</p>
              
              {quest.status === 'active' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>%{quest.progress} Tamamlandı</span>
                  </div>
                  <Progress value={quest.progress} className="h-1.5" />
                </div>
              )}
              {quest.status === 'locked' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Lock className="size-3" />
                  Seviye 4 Gerektirir
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content: Active Quest Details */}
        <div className="lg:col-span-2">
          <Card className="h-full border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">Mevcut Görev</Badge>
                  <CardTitle className="text-2xl">Tasarım Sistemleri Ustalığı</CardTitle>
                  <CardDescription className="mt-2">
                    Ölçeklenebilir UI kütüphaneleri oluşturma sanatında ustalaşın. Bu görev, son iş taramanızda belirlenen "Tasarım Sistemleri" beceri açığını hedefler.
                  </CardDescription>
                </div>
                <div className="hidden md:block">
                  <div className="size-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                    %35
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Circle className="size-2 fill-current text-primary" />
                Görev Adımları
              </h3>
              
              <div className="space-y-4">
                {quests[0].tasks.map((task) => (
                  <div key={task.id} className="group flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="mt-1">
                      {task.completed ? (
                        <CheckCircle2 className="size-6 text-green-500" />
                      ) : (
                        <Circle className="size-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {task.duration}
                        </span>
                        {!task.completed && (
                          <span className="text-primary font-medium group-hover:underline cursor-pointer">Görevi Başlat →</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-accent/5 rounded-lg border border-accent/10">
                <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                  <Users className="size-4" />
                  Topluluk İpucu
                </h4>
                <p className="text-sm text-muted-foreground">
                  "'Atomik Tasarım Prensipleri' videosu oyunun kurallarını değiştiriyor. Molekül yapısı hakkında not almayı unutmayın!" — Sarah J., Ürün Tasarımcısı
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
