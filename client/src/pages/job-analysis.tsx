import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, Link as LinkIcon, Info, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface JobAnalysis {
  id: string;
  jobTitle: string;
  jobDescription: string;
  matchScore: number;
  skillsMatch: string[];
  skillsGap: string[];
  recommendations: string;
}

export default function JobAnalysis() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [result, setResult] = useState<JobAnalysis | null>(null);
  const [showUrlWarning, setShowUrlWarning] = useState(false);

  const isJobUrl = (text: string) => {
    const urlPatterns = [
      /linkedin\.com\/jobs/i,
      /kariyer\.net/i,
      /indeed\.com/i,
      /glassdoor\.com/i,
      /secretcv\.com/i,
      /yenibiris\.com/i,
      /eleman\.net/i,
    ];
    return urlPatterns.some(pattern => pattern.test(text));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJobDescription(value);
    
    if (isJobUrl(value) && value.trim().split('\n').length <= 3) {
      setShowUrlWarning(true);
    } else {
      setShowUrlWarning(false);
    }
  };

  const fetchUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/job-analysis/fetch-url", { url });
      return res.json() as Promise<{ jobTitle: string; jobDescription: string; message: string }>;
    },
    onSuccess: (data) => {
      if (data.jobTitle) {
        setJobTitle(data.jobTitle);
      }
      setJobDescription(data.jobDescription);
      setShowUrlWarning(false);
      toast({ title: "Başarılı!", description: data.message });
    },
    onError: (error: any) => {
      toast({ 
        title: "İçerik alınamadı", 
        description: "Bu site otomatik çekmeyi desteklemiyor. Lütfen ilanı manuel olarak kopyalayıp yapıştırın.", 
        variant: "destructive" 
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { jobTitle: string; jobDescription: string; jobUrl?: string }) => {
      const res = await apiRequest("POST", "/api/job-analysis", data);
      return res.json() as Promise<JobAnalysis>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-analysis"] });
      toast({ title: "Analiz tamamlandı!", description: "Sonuçlarınız hazır." });
    },
    onError: (error: any) => {
      const message = error?.message?.includes("400") 
        ? "Lütfen tüm alanları doldurun" 
        : "Analiz sırasında bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    },
  });

  const { data: previousAnalyses = [] } = useQuery<JobAnalysis[]>({
    queryKey: ["/api/job-analysis"],
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

  const handleAnalyze = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast({ title: "Hata", description: "Lütfen iş unvanı ve açıklama girin", variant: "destructive" });
      return;
    }
    analyzeMutation.mutate({ jobTitle, jobDescription, jobUrl: jobUrl || undefined });
  };

  const criticalGaps = result?.skillsGap?.slice(0, 3) || [];
  const hasResult = result !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">İş Tanımı Analizi</h1>
        <p className="text-muted-foreground">Beceri açıklarını belirlemek ve size özel bir çalışma planı almak için iş ilanını aşağıya yapıştırın.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                İş İlanı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">İş Unvanı</Label>
                <Input 
                  id="jobTitle"
                  placeholder="ör. Kıdemli Ürün Tasarımcısı"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  data-testid="input-jobtitle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobUrl">İlan Linki</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      id="jobUrl"
                      className="pl-9"
                      placeholder="ör. https://kariyer.net/is-ilani/..."
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      data-testid="input-joburl"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!jobUrl.trim()) {
                        toast({ title: "Hata", description: "Lütfen bir URL girin", variant: "destructive" });
                        return;
                      }
                      fetchUrlMutation.mutate(jobUrl);
                    }}
                    disabled={fetchUrlMutation.isPending || !jobUrl.trim()}
                    data-testid="button-fetch-url"
                  >
                    {fetchUrlMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="size-4 mr-1" />
                        Getir
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  İlan linkini girin ve "Getir" butonuna tıklayarak içeriği otomatik çekin.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Açıklama</Label>
                <Textarea 
                  id="jobDescription"
                  className="min-h-[300px] font-mono text-sm leading-relaxed" 
                  placeholder="Tam iş tanımını buraya yapıştırın..." 
                  value={jobDescription}
                  onChange={handleDescriptionChange}
                  data-testid="input-jobdescription"
                />
                {showUrlWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <Info className="size-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Link algılandı!</p>
                      <p className="text-amber-700 mt-1">
                        LinkedIn, KariyerNet gibi sitelerin linki yerine, iş ilanının tam metnini kopyalayıp yapıştırın. 
                        İlan sayfasını açın ve iş tanımı, gereksinimler ve nitelikler bölümlerini seçip kopyalayın.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleAnalyze} 
                className="w-full" 
                size="lg"
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  "Uyumu Analiz Et"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!hasResult ? (
            <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/20">
              <Briefcase className="size-12 mb-4 opacity-20" />
              <p>Analiz sonuçları burada görünecek</p>
              {previousAnalyses.length > 0 && (
                <div className="mt-6 w-full text-sm">
                  <p className="font-medium text-foreground mb-3">Son Analizler:</p>
                  <div className="space-y-2">
                    {previousAnalyses.slice(0, 3).map((analysis) => (
                      <button
                        key={analysis.id}
                        onClick={() => setResult(analysis)}
                        className="group block w-full text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                        data-testid={`button-previous-analysis-${analysis.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">{analysis.jobTitle}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={analysis.matchScore >= 70 ? "default" : analysis.matchScore >= 40 ? "secondary" : "destructive"} className="text-xs">
                              %{analysis.matchScore}
                            </Badge>
                            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
              {/* Score Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uyum Skoru</p>
                    <h2 className="text-4xl font-bold text-primary" data-testid="text-match-score">%{result.matchScore}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Eksik Beceriler</p>
                    <h2 className="text-2xl font-bold text-destructive" data-testid="text-gap-count">
                      {criticalGaps.length} {criticalGaps.length > 0 ? "Kritik" : ""}
                    </h2>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Beceri Açığı Analizi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="size-4" />
                      Sahip Olduklarınız
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.skillsMatch && result.skillsMatch.length > 0 ? (
                        result.skillsMatch.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 max-w-full break-words" data-testid={`badge-match-${i}`}>
                            <span className="truncate max-w-[200px]">{skill}</span>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Eşleşen beceri bulunamadı. Profilinize beceri ekleyin.</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                      <XCircle className="size-4" />
                      Eksik / Geliştirilmesi Gereken
                    </h4>
                    <div className="space-y-3">
                      {result.skillsGap && result.skillsGap.length > 0 ? (
                        result.skillsGap.map((skill, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/10" data-testid={`item-gap-${i}`}>
                            <span className="font-medium text-sm break-words min-w-0 flex-1">{skill}</span>
                            <Badge variant="outline" className="border-destructive text-destructive">
                              {i < 3 ? "Kritik" : "Önemli"}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-green-600">Tebrikler! Tüm gerekli becerilere sahipsiniz.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="bg-accent/10 border-accent/20">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent font-semibold">Öneri</AlertTitle>
                <AlertDescription className="text-muted-foreground mt-2">
                  {result.recommendations}
                </AlertDescription>
                <div className="mt-4">
                  <Link href="/roadmap">
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" data-testid="button-view-roadmap">
                      Öğrenme Planını Görüntüle
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </Alert>

              <Button 
                variant="outline" 
                onClick={() => setResult(null)} 
                className="w-full"
                data-testid="button-new-analysis"
              >
                Yeni Analiz Yap
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
