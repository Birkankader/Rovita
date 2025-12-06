import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, BrainCircuit, Loader2, Target, X, Briefcase } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuestTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface LearningQuest {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetSkill: string;
  status: string;
  progress: number;
  xp: number;
  tasks: QuestTask[];
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
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  const { data: quests = [], isLoading: questsLoading } = useQuery<LearningQuest[]>({
    queryKey: ["/api/quests"],
    enabled: isAuthenticated,
  });

  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const updateQuestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LearningQuest> }) => {
      const res = await apiRequest("PUT", `/api/quests/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      if (variables.data.status === "completed" && variables.id === selectedQuestId) {
        setSelectedQuestId(null);
      }
      toast({ title: "Başarılı", description: "Görev güncellendi." });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ questId, taskId, completed }: { questId: string; taskId: string; completed: boolean }) => {
      const res = await apiRequest("PUT", `/api/quests/${questId}/tasks/${taskId}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
  });

  const rejectQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const res = await apiRequest("DELETE", `/api/quests/${questId}`);
      return res.json();
    },
    onSuccess: (_, questId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      if (questId === selectedQuestId) {
        setSelectedQuestId(null);
      }
      toast({ title: "Görev reddedildi", description: "Görev listenizden kaldırıldı." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Görev reddedilirken hata oluştu.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    const currentSelected = selectedQuestId ? quests.find(q => q.id === selectedQuestId) : null;
    const needsNewSelection = !selectedQuestId || (currentSelected && currentSelected.status === "completed");
    
    if (quests.length > 0 && needsNewSelection) {
      const activeQuest = quests.find(q => q.status === "active" || q.status === "in_progress");
      const firstNonCompleted = quests.find(q => q.status !== "completed");
      const nextQuestId = activeQuest?.id || firstNonCompleted?.id || null;
      if (nextQuestId !== selectedQuestId) {
        setSelectedQuestId(nextQuestId);
      }
    }
  }, [quests, selectedQuestId]);

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

  const completedQuests = quests.filter(q => q.status === "completed");
  const activeQuests = quests.filter(q => q.status !== "completed");
  const selectedQuest = selectedQuestId ? quests.find(q => q.id === selectedQuestId) : null;

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
          </div>

          {activeQuests.length === 0 ? (
            <Card className="p-6 text-center">
              <Target className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h4 className="font-semibold mb-2">Henüz görev yok</h4>
              <p className="text-sm text-muted-foreground mb-4">
                İş ilanı analiz ederek veya sosyal beceri testi çözerek görevler kazanabilirsiniz.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/analyze">
                  <Button className="w-full" data-testid="button-go-analyze">
                    <Briefcase className="mr-2 size-4" />
                    İş İlanı Analiz Et
                  </Button>
                </Link>
                <Link href="/assessment">
                  <Button variant="outline" className="w-full" data-testid="button-go-assessment">
                    <BrainCircuit className="mr-2 size-4" />
                    Sosyal Beceri Testi
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            activeQuests.map((quest) => {
              const isSelected = selectedQuestId === quest.id;
              const tasks = quest.tasks || [];
              const completedTasks = tasks.filter(t => t.completed).length;
              const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : quest.progress;
              
              return (
                <div
                  key={quest.id}
                  className={`rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-card border-primary shadow-md ring-2 ring-primary/30"
                      : quest.status === "active" || quest.status === "in_progress"
                      ? "bg-card border-primary/30 hover:border-primary/50"
                      : "bg-muted/30 border-transparent hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedQuestId(quest.id)}
                  data-testid={`quest-card-${quest.id}`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant={quest.status === "active" ? "default" : "outline"}
                        className={quest.status === "active" ? "bg-primary" : ""}
                      >
                        {quest.status === "active" ? "Devam Ediyor" : "Bekliyor"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent">+{quest.xp} XP</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rejectQuestMutation.mutate(quest.id);
                          }}
                          disabled={rejectQuestMutation.isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
                          title="Görevi Reddet"
                          data-testid={`button-reject-quest-${quest.id}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold mb-1">{quest.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {quest.description || `${quest.targetSkill} becerisini geliştir`}
                    </p>
                    {tasks.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Progress value={taskProgress} className="h-1.5 flex-1" />
                        <span>{completedTasks}/{tasks.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Main Content: Selected Quest Details */}
        <div className="lg:col-span-2">
          {selectedQuest ? (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 border-primary/30 text-primary bg-primary/5">
                      {selectedQuest.status === "active" ? "Aktif Görev" : "Bekleyen Görev"}
                    </Badge>
                    <CardTitle className="text-2xl">{selectedQuest.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {selectedQuest.description || `${selectedQuest.targetSkill} becerisini geliştirmek için çalışıyorsunuz.`}
                    </CardDescription>
                  </div>
                  <div className="hidden md:block">
                    <div className="size-16 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                      %{selectedQuest.progress}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold mb-1 text-sm text-muted-foreground">Hedef Beceri</h3>
                    <Badge variant="secondary" className="text-sm">
                      {selectedQuest.targetSkill}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-sm text-muted-foreground">İlerleme</h3>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedQuest.tasks?.length > 0 ? Math.round((selectedQuest.tasks.filter(t => t.completed).length / selectedQuest.tasks.length) * 100) : selectedQuest.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium">
                        {selectedQuest.tasks?.length > 0 
                          ? `${selectedQuest.tasks.filter(t => t.completed).length}/${selectedQuest.tasks.length}`
                          : `${selectedQuest.progress}%`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {selectedQuest.tasks && selectedQuest.tasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Alt Görevler</h3>
                    {selectedQuest.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`p-4 rounded-lg border ${task.completed ? 'bg-green-50/50 border-green-200/50' : 'bg-background border-border'}`}
                        data-testid={`task-item-${selectedQuest.id}-${task.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`task-${selectedQuest.id}-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={(checked) => {
                              toggleTaskMutation.mutate({
                                questId: selectedQuest.id,
                                taskId: task.id,
                                completed: !!checked,
                              });
                            }}
                            disabled={toggleTaskMutation.isPending || selectedQuest.status === "completed"}
                            data-testid={`checkbox-task-${selectedQuest.id}-${task.id}`}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`task-${selectedQuest.id}-${task.id}`}
                              className={`text-sm font-medium cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {task.title}
                            </label>
                            <p className={`text-xs mt-1 ${task.completed ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'}`}>
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  {selectedQuest.status === "pending" && (
                    <Button
                      className="flex-1"
                      onClick={() => handleStartQuest(selectedQuest)}
                      disabled={updateQuestMutation.isPending}
                      data-testid={`button-start-${selectedQuest.id}`}
                    >
                      {updateQuestMutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Göreve Başla
                    </Button>
                  )}
                  {(selectedQuest.status === "active" || selectedQuest.status === "in_progress") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateProgress(selectedQuest, Math.min(selectedQuest.progress + 25, 100))}
                        disabled={updateQuestMutation.isPending}
                        data-testid="button-update-progress"
                      >
                        İlerleme Kaydet (+25%)
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleCompleteQuest(selectedQuest)}
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
                    </>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Tamamladığınızda <span className="font-bold text-accent">+{selectedQuest.xp} XP</span> kazanacaksınız.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border-dashed flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8">
                <Target className="size-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold mb-2">Bir görev seçin</h3>
                <p className="text-muted-foreground mb-4">
                  Sol taraftan bir görev seçin veya iş ilanı analizi yaparak yeni görevler kazanın.
                </p>
                <Link href="/analyze">
                  <Button data-testid="button-go-analyze-empty">
                    <Briefcase className="mr-2 size-4" />
                    İş İlanı Analiz Et
                  </Button>
                </Link>
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
