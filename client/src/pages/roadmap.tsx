import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, Clock, BrainCircuit, Plus, Loader2, Target } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LearningQuest {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetSkill: string;
  status: string;
  progress: number;
  xp: number;
  createdAt: string;
}

interface UserProgress {
  totalXp: number;
  streakDays: number;
}

export default function Roadmap() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    targetSkill: "",
    xp: 100,
  });

  const { data: quests = [], isLoading: questsLoading } = useQuery<LearningQuest[]>({
    queryKey: ["/api/quests"],
    enabled: isAuthenticated,
  });

  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const createQuestMutation = useMutation({
    mutationFn: async (quest: typeof newQuest) => {
      const res = await apiRequest("POST", "/api/quests", {
        ...quest,
        status: "active",
        progress: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      setIsDialogOpen(false);
      setNewQuest({ title: "", description: "", targetSkill: "", xp: 100 });
      toast({ title: "Başarılı", description: "Yeni görev oluşturuldu." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Görev oluşturulurken hata oluştu.", variant: "destructive" });
    },
  });

  const updateQuestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LearningQuest> }) => {
      const res = await apiRequest("PUT", `/api/quests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      toast({ title: "Başarılı", description: "Görev güncellendi." });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || questsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const activeQuest = quests.find(q => q.status === "active" || q.status === "in_progress");
  const completedQuests = quests.filter(q => q.status === "completed");
  const pendingQuests = quests.filter(q => q.status !== "completed" && q.status !== "active" && q.status !== "in_progress");

  const handleCompleteQuest = (quest: LearningQuest) => {
    updateQuestMutation.mutate({
      id: quest.id,
      data: { status: "completed", progress: 100 },
    });
  };

  const handleStartQuest = (quest: LearningQuest) => {
    updateQuestMutation.mutate({
      id: quest.id,
      data: { status: "active" },
    });
  };

  const handleUpdateProgress = (quest: LearningQuest, newProgress: number) => {
    updateQuestMutation.mutate({
      id: quest.id,
      data: { progress: newProgress },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Gelişim Yol Haritanız</h1>
          <p className="text-muted-foreground">Beceri açıklarınıza göre özelleştirilmiş öğrenme görevleri.</p>
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
                <p className="font-bold text-accent text-lg">{progress?.totalXp?.toLocaleString() || 0}</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Seri</p>
                <p className="font-bold text-foreground text-lg">🔥 {progress?.streakDays || 0} Gün</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Quest List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Görevleriniz</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1" data-testid="button-add-quest">
                  <Plus className="size-4" />
                  Yeni Görev
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Görev Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Görev Başlığı</Label>
                    <Input
                      id="title"
                      value={newQuest.title}
                      onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                      placeholder="React Hooks Öğren"
                      data-testid="input-quest-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetSkill">Hedef Beceri</Label>
                    <Input
                      id="targetSkill"
                      value={newQuest.targetSkill}
                      onChange={(e) => setNewQuest({ ...newQuest, targetSkill: e.target.value })}
                      placeholder="React"
                      data-testid="input-quest-skill"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={newQuest.description}
                      onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                      placeholder="Bu görevi tamamlayarak ne öğreneceğinizi açıklayın..."
                      data-testid="input-quest-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xp">XP Ödülü</Label>
                    <Input
                      id="xp"
                      type="number"
                      value={newQuest.xp}
                      onChange={(e) => setNewQuest({ ...newQuest, xp: parseInt(e.target.value) || 0 })}
                      min={10}
                      max={1000}
                      data-testid="input-quest-xp"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createQuestMutation.mutate(newQuest)}
                    disabled={!newQuest.title || !newQuest.targetSkill || createQuestMutation.isPending}
                    data-testid="button-create-quest"
                  >
                    {createQuestMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Görevi Oluştur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {quests.length === 0 ? (
            <Card className="p-6 text-center">
              <Target className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h4 className="font-semibold mb-2">Henüz görev yok</h4>
              <p className="text-sm text-muted-foreground mb-4">
                İlk görevinizi oluşturarak öğrenme yolculuğunuza başlayın.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-quest">
                <Plus className="mr-2 size-4" />
                İlk Görevi Oluştur
              </Button>
            </Card>
          ) : (
            quests.map((quest) => (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  quest.status === "active" || quest.status === "in_progress"
                    ? "bg-card border-primary/50 shadow-md ring-1 ring-primary/20"
                    : quest.status === "completed"
                    ? "bg-green-50/50 border-green-200/50 opacity-80"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                }`}
                data-testid={`quest-card-${quest.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge
                    variant={quest.status === "completed" ? "secondary" : quest.status === "active" ? "default" : "outline"}
                    className={
                      quest.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : quest.status === "active"
                        ? "bg-primary"
                        : ""
                    }
                  >
                    {quest.status === "completed" ? "Tamamlandı" : quest.status === "active" ? "Devam Ediyor" : "Bekliyor"}
                  </Badge>
                  <span className="text-xs font-bold text-accent">+{quest.xp} XP</span>
                </div>
                <h4 className="font-bold mb-1">{quest.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {quest.description || `${quest.targetSkill} becerisini geliştir`}
                </p>

                {(quest.status === "active" || quest.status === "in_progress") && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>%{quest.progress} Tamamlandı</span>
                    </div>
                    <Progress value={quest.progress} className="h-1.5" />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleUpdateProgress(quest, Math.min(quest.progress + 25, 100))}
                        data-testid={`button-progress-${quest.id}`}
                      >
                        +25%
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleCompleteQuest(quest)}
                        data-testid={`button-complete-${quest.id}`}
                      >
                        Tamamla
                      </Button>
                    </div>
                  </div>
                )}
                {quest.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleStartQuest(quest)}
                    data-testid={`button-start-${quest.id}`}
                  >
                    Başla
                  </Button>
                )}
                {quest.status === "completed" && (
                  <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                    <CheckCircle2 className="size-4" />
                    Tamamlandı
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Main Content: Active Quest Details */}
        <div className="lg:col-span-2">
          {activeQuest ? (
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">
                      Aktif Görev
                    </Badge>
                    <CardTitle className="text-2xl">{activeQuest.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {activeQuest.description || `${activeQuest.targetSkill} becerisini geliştirmek için çalışıyorsunuz.`}
                    </CardDescription>
                  </div>
                  <div className="hidden md:block">
                    <div className="size-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                      %{activeQuest.progress}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Hedef Beceri</h3>
                    <Badge variant="secondary" className="text-sm">
                      {activeQuest.targetSkill}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">İlerleme</h3>
                    <Progress value={activeQuest.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Tamamladığınızda <span className="font-bold text-accent">+{activeQuest.xp} XP</span> kazanacaksınız.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateProgress(activeQuest, Math.min(activeQuest.progress + 25, 100))}
                      disabled={updateQuestMutation.isPending}
                      data-testid="button-update-progress"
                    >
                      İlerleme Kaydet (+25%)
                    </Button>
                    <Button
                      onClick={() => handleCompleteQuest(activeQuest)}
                      disabled={updateQuestMutation.isPending}
                      data-testid="button-complete-active"
                    >
                      {updateQuestMutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 size-4" />
                      )}
                      Görevi Tamamla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border-dashed flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <Target className="size-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold mb-2">Aktif görev yok</h3>
                <p className="text-muted-foreground mb-4">
                  Sol taraftan bir görev seçin veya yeni bir görev oluşturun.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-quest-empty">
                  <Plus className="mr-2 size-4" />
                  Yeni Görev Oluştur
                </Button>
              </div>
            </Card>
          )}

          {completedQuests.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  Tamamlanan Görevler ({completedQuests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedQuests.slice(0, 5).map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                      <div>
                        <h4 className="font-medium text-sm">{quest.title}</h4>
                        <p className="text-xs text-muted-foreground">{quest.targetSkill}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        +{quest.xp} XP
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
