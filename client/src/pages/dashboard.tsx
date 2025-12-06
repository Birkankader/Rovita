import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Award, ArrowRight, Star, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import badgeImage from "@assets/generated_images/gamification_achievement_badge.png";

interface UserProgress {
  id: string;
  userId: string;
  currentLevel: number;
  totalXp: number;
  streakDays: number;
  lastActivityDate: string | null;
  achievements: string[];
}

interface Profile {
  id: string;
  userId: string;
  jobTitle: string | null;
  skills: string[];
}

interface LearningQuest {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  status: string;
  progress: number;
  xp: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: quests = [] } = useQuery<LearningQuest[]>({
    queryKey: ["/api/quests"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userName = user?.firstName || "Kullanıcı";
  const currentLevel = progress?.currentLevel || 1;
  const totalXp = progress?.totalXp || 0;
  const streakDays = progress?.streakDays || 0;
  const xpForNextLevel = ((currentLevel) * 500) - totalXp;
  const xpProgress = ((totalXp % 500) / 500) * 100;

  const skills = profile?.skills || [];
  const skillsData = [
    { name: "Teknik", value: Math.min(skills.length * 10, 100), color: "hsl(var(--chart-1))" },
    { name: "Sosyal Beceriler", value: 45, color: "hsl(var(--chart-2))" },
    { name: "Liderlik", value: 30, color: "hsl(var(--chart-3))" },
  ];

  const activeQuest = quests.find(q => q.status === "active" || q.status === "in_progress");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold" data-testid="text-welcome">Tekrar hoş geldin, {userName}!</h1>
          <p className="text-muted-foreground">{streakDays} günlük öğrenme serisindesin. Aynen devam!</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 flex items-center gap-3 border-primary/20 bg-primary/5">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Star className="size-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mevcut Seviye</p>
              <p className="font-bold text-primary" data-testid="text-level">Seviye {currentLevel}</p>
            </div>
          </Card>
          <Link href="/job-analysis">
            <Button className="gap-2 shadow-md shadow-primary/20" data-testid="button-analyze-job">
              <Target className="size-4" />
              Yeni İş Analiz Et
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Progress & Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
             <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">İş Hazırlık Skoru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground" data-testid="text-readiness-score">%{Math.min(skills.length * 10 + 20, 100)}</div>
                <Progress value={Math.min(skills.length * 10 + 20, 100)} className="h-2 mt-3" />
                <p className="text-xs text-muted-foreground mt-2">Profil bilgilerinize göre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam XP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent" data-testid="text-total-xp">{totalXp.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-3">
                   <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                     <div className="h-full bg-accent" style={{ width: `${xpProgress}%` }}></div>
                   </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Seviye {currentLevel + 1} için {xpForNextLevel} XP kaldı</p>
              </CardContent>
            </Card>
          </div>

          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Beceri Profili Analizi</CardTitle>
              <CardDescription>Son iş taramalarına dayalı yetkinlik dağılımınız.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={skillsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {skillsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-[-20px]">
                {skillsData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Quests & Badges */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-accent" />
                Aktif Görev
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeQuest ? (
                <>
                  <div className="space-y-2">
                    <h4 className="font-semibold" data-testid="text-quest-title">{activeQuest.title}</h4>
                    <p className="text-sm text-muted-foreground">{activeQuest.description}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>İlerleme</span>
                      <span>{activeQuest.progress}%</span>
                    </div>
                    <Progress value={activeQuest.progress} className="h-2 bg-accent/10" indicatorClassName="bg-accent" />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-semibold">Henüz aktif görev yok</h4>
                  <p className="text-sm text-muted-foreground">Yol haritanızdan bir görev başlatın.</p>
                </div>
              )}
              <Link href="/roadmap">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 mt-2" data-testid="button-continue-quest">
                  {activeQuest ? "Göreve Devam Et" : "Görevleri Gör"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-primary" />
                Son Başarılar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress?.achievements && progress.achievements.length > 0 ? (
                progress.achievements.slice(0, 2).map((achievement, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <img src={badgeImage} alt="Rozet" className="size-10 object-contain drop-shadow-md" />
                    <div>
                      <p className="font-semibold text-sm">{achievement}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <img src={badgeImage} alt="Rozet" className="size-10 object-contain drop-shadow-md" />
                    <div>
                      <p className="font-semibold text-sm">Yeni Başlangıç</p>
                      <p className="text-xs text-muted-foreground">CareerAscend'e hoş geldiniz!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50 opacity-50">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Hızlı Öğrenen</p>
                      <p className="text-xs text-muted-foreground">Bir haftada 3 kurs tamamla</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
