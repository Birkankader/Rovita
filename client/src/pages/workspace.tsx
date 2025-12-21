import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, FileText, Link as LinkIcon, Briefcase, Target, CheckCircle2, 
  Loader2, Download, ArrowRight, AlertCircle, X, ChevronRight, Star
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ParsedCV {
  jobTitle: string | null;
  bio: string | null;
  skills: string[];
  experience: Array<{ title: string; company: string; description: string }>;
  education: Array<{ degree: string; school: string }>;
  warnings?: string[];
}

interface JobAnalysis {
  id: string;
  jobTitle: string;
  jobDescription: string;
  matchScore: number;
  skillsMatch: string[];
  skillsGap: string[];
  recommendations: string;
}

interface LearningQuest {
  id: string;
  title: string;
  description: string | null;
  targetSkill: string;
  status: string;
  progress: number;
  xp: number;
  tasks: Array<{ id: string; title: string; completed: boolean }>;
}

const SkillNode = ({ data }: { data: any }) => {
  const isCompleted = data.status === "completed";
  const isActive = data.status === "active" || data.status === "in_progress";
  
  return (
    <div 
      className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[180px] max-w-[220px] transition-all ${
        isCompleted 
          ? "bg-green-50 border-green-500 dark:bg-green-950/50" 
          : isActive
          ? "bg-primary/10 border-primary"
          : "bg-card border-muted"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-start gap-2">
        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
          isCompleted ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted"
        }`}>
          {isCompleted ? (
            <CheckCircle2 className="size-4 text-white" />
          ) : (
            <Target className="size-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{data.label}</h4>
          <p className="text-xs text-muted-foreground truncate">{data.skill}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={data.progress} className="h-1 flex-1" />
            <span className="text-xs font-medium text-primary">+{data.xp}XP</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
};

const nodeTypes = { skillNode: SkillNode };

export default function Workspace() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const roadmapRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<"input" | "analyzing" | "result">("input");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState<JobAnalysis | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: quests = [] } = useQuery<LearningQuest[]>({
    queryKey: ["/api/quests"],
    enabled: isAuthenticated && step === "result",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const parseCvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/profile/import-cv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("CV parse failed");
      return res.json() as Promise<ParsedCV>;
    },
    onSuccess: (data) => {
      setParsedCV(data);
      toast({ title: "CV Analiz Edildi", description: `${data.skills.length} beceri tespit edildi.` });
    },
    onError: () => {
      toast({ title: "Hata", description: "CV okunamadı. Lütfen farklı bir dosya deneyin.", variant: "destructive" });
    },
  });

  const fetchUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/job-analysis/fetch-url", { url });
      return res.json() as Promise<{ jobTitle: string; jobDescription: string; message: string }>;
    },
    onSuccess: (data) => {
      if (data.jobTitle) setJobTitle(data.jobTitle);
      setJobDescription(data.jobDescription);
      toast({ title: "İlan Alındı", description: data.message });
    },
    onError: () => {
      toast({ title: "Uyarı", description: "İlan otomatik alınamadı. Lütfen manuel girin.", variant: "destructive" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { jobTitle: string; jobDescription: string; jobUrl?: string }) => {
      const res = await apiRequest("POST", "/api/job-analysis", data);
      return res.json() as Promise<JobAnalysis>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      toast({ title: "Analiz Tamamlandı", description: "Yol haritanız hazır!" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Analiz yapılamadı.", variant: "destructive" });
      setStep("input");
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setCvFile(file);
      parseCvMutation.mutate(file);
    } else {
      toast({ title: "Hata", description: "Sadece PDF dosyaları kabul edilir.", variant: "destructive" });
    }
  }, [parseCvMutation, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      parseCvMutation.mutate(file);
    }
  };

  const handleFetchUrl = () => {
    if (jobUrl.trim()) {
      fetchUrlMutation.mutate(jobUrl);
    }
  };

  const handleAnalyze = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({ title: "Eksik Bilgi", description: "İş unvanı ve açıklama gerekli.", variant: "destructive" });
      return;
    }
    setStep("analyzing");
    analyzeMutation.mutate({ jobTitle, jobDescription, jobUrl: jobUrl || undefined });
  };

  const handleExportPdf = async () => {
    if (!roadmapRef.current) return;
    
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(roadmapRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const headerHeight = 30;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - headerHeight - margin;
      
      pdf.setFontSize(18);
      pdf.text(`${jobTitle} - Kariyer Yol Haritası`, margin, 15);
      pdf.setFontSize(11);
      pdf.text(`Uyum Skoru: %${analysisResult?.matchScore || 0} | ${quests.length} Görev`, margin, 23);
      
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const scaledHeight = Math.min(imgHeight, availableHeight);
      const scaledWidth = imgHeight > availableHeight 
        ? (canvas.width * scaledHeight) / canvas.height 
        : imgWidth;
      
      pdf.addImage(imgData, "PNG", margin, headerHeight, scaledWidth, scaledHeight);
      
      if (quests.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("Görev Detayları", margin, 20);
        
        let yPos = 35;
        quests.forEach((quest, index) => {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${quest.title}`, margin, yPos);
          pdf.setFontSize(9);
          pdf.text(`   ${quest.targetSkill} | +${quest.xp} XP`, margin, yPos + 5);
          yPos += 15;
        });
      }
      
      pdf.save(`rotiva-roadmap-${Date.now()}.pdf`);
      toast({ title: "PDF İndirildi", description: "Yol haritanız başarıyla indirildi." });
    } catch (error) {
      toast({ title: "Hata", description: "PDF oluşturulamadı.", variant: "destructive" });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const generateNodes = (): Node[] => {
    if (!quests.length) return [];
    
    const nodes: Node[] = [];
    const cols = 3;
    const xSpacing = 280;
    const ySpacing = 140;
    
    quests.forEach((quest, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * xSpacing + 50;
      const y = row * ySpacing + 50;
      
      nodes.push({
        id: quest.id,
        type: "skillNode",
        position: { x, y },
        data: {
          label: quest.title,
          skill: quest.targetSkill,
          progress: quest.progress,
          xp: quest.xp,
          status: quest.status,
        },
      });
    });
    
    return nodes;
  };

  const generateEdges = (): Edge[] => {
    if (quests.length < 2) return [];
    
    const edges: Edge[] = [];
    const cols = 3;
    
    quests.forEach((quest, index) => {
      const nextInRow = index + 1;
      const nextRow = index + cols;
      
      if (nextInRow < quests.length && nextInRow % cols !== 0) {
        edges.push({
          id: `e${quest.id}-${quests[nextInRow].id}`,
          source: quest.id,
          target: quests[nextInRow].id,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        });
      }
      
      if (nextRow < quests.length) {
        edges.push({
          id: `e${quest.id}-${quests[nextRow].id}-down`,
          source: quest.id,
          target: quests[nextRow].id,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "5,5" },
        });
      }
    });
    
    return edges;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Kariyer Yol Haritanız
        </h1>
        <p className="text-muted-foreground text-lg">
          CV'nizi yükleyin, hedef ilanı ekleyin, kişiselleştirilmiş öğrenme planınızı alın
        </p>
      </div>

      {step === "input" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                CV Yükle
              </CardTitle>
              <CardDescription>PDF formatında CV'nizi sürükleyin veya seçin</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-testid="cv-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-cv-file"
                />
                
                {parseCvMutation.isPending ? (
                  <div className="space-y-3">
                    <Loader2 className="size-12 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">CV analiz ediliyor...</p>
                  </div>
                ) : cvFile ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="size-12 mx-auto text-green-500" />
                    <div>
                      <p className="font-medium">{cvFile.name}</p>
                      {parsedCV && (
                        <p className="text-sm text-green-600 mt-1">
                          {parsedCV.skills.length} beceri tespit edildi
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="size-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">CV'nizi buraya sürükleyin</p>
                      <p className="text-sm text-muted-foreground">veya tıklayarak seçin (PDF)</p>
                    </div>
                  </div>
                )}
              </div>

              {parsedCV && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Tespit Edilen Beceriler:</h4>
                  <div className="flex flex-wrap gap-1">
                    {parsedCV.skills.slice(0, 10).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {parsedCV.skills.length > 10 && (
                      <Badge variant="outline" className="text-xs">+{parsedCV.skills.length - 10}</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                Hedef İş İlanı
              </CardTitle>
              <CardDescription>Hedeflediğiniz iş ilanının bilgilerini girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>İlan Linki (Opsiyonel)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="https://kariyer.net/..."
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      data-testid="input-job-url"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFetchUrl}
                    disabled={!jobUrl.trim() || fetchUrlMutation.isPending}
                    data-testid="button-fetch-url"
                  >
                    {fetchUrlMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Al"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">İş Unvanı *</Label>
                <Input
                  id="jobTitle"
                  placeholder="ör. Kıdemli Frontend Geliştirici"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  data-testid="input-job-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDesc">İş Açıklaması *</Label>
                <Textarea
                  id="jobDesc"
                  placeholder="İş ilanındaki gereksinimleri ve açıklamayı buraya yapıştırın..."
                  className="min-h-[150px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  data-testid="input-job-description"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "input" && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!jobTitle.trim() || !jobDescription.trim() || analyzeMutation.isPending}
            className="px-12"
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                Analiz Et ve Yol Haritası Oluştur
                <ArrowRight className="ml-2 size-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {step === "analyzing" && (
        <Card className="p-12 text-center">
          <Loader2 className="size-16 mx-auto animate-spin text-primary mb-6" />
          <h3 className="text-2xl font-bold mb-2">Analiz Ediliyor</h3>
          <p className="text-muted-foreground">CV ve iş ilanı karşılaştırılıyor, yol haritanız hazırlanıyor...</p>
        </Card>
      )}

      {step === "result" && analysisResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{analysisResult.jobTitle}</h2>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={analysisResult.matchScore >= 70 ? "default" : "secondary"} className="text-lg px-4 py-1">
                  %{analysisResult.matchScore} Uyum
                </Badge>
                <span className="text-muted-foreground">
                  {analysisResult.skillsMatch.length} eşleşen • {analysisResult.skillsGap.length} eksik beceri
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("input")} data-testid="button-new-analysis">
                Yeni Analiz
              </Button>
              <Button onClick={handleExportPdf} disabled={isExportingPdf} data-testid="button-export-pdf">
                {isExportingPdf ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                PDF İndir
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Eşleşen Beceriler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.skillsMatch.map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-green-100 border-green-300 text-green-800">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  Geliştirmeniz Gereken Beceriler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.skillsGap.map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-orange-100 border-orange-300 text-orange-800">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  Öğrenme Yol Haritanız
                </span>
                <Badge variant="secondary">{quests.length} Görev</Badge>
              </CardTitle>
              <CardDescription>
                Bu interaktif harita, hedefinize ulaşmak için izlemeniz gereken öğrenme yolunu gösteriyor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={roadmapRef} className="rounded-xl border bg-gradient-to-br from-background to-muted/30" style={{ height: `${Math.max(400, Math.ceil(quests.length / 3) * 140 + 100)}px` }} data-testid="roadmap-container">
                {quests.length > 0 ? (
                  <ReactFlow
                    nodes={generateNodes()}
                    edges={generateEdges()}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background />
                    <Controls />
                  </ReactFlow>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="size-8 mx-auto animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Görevler yükleniyor...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {quests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-5 text-yellow-500" />
                  Görev Detayları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quests.map((quest, index) => (
                    <div 
                      key={quest.id} 
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      data-testid={`quest-detail-${quest.id}`}
                    >
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                        quest.status === "completed" ? "bg-green-500" : "bg-primary"
                      }`}>
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{quest.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">{quest.targetSkill}</Badge>
                          <span className="text-sm text-primary font-medium">+{quest.xp} XP</span>
                          {quest.tasks?.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {quest.tasks.filter(t => t.completed).length}/{quest.tasks.length} adım
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
