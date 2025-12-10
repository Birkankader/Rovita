import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { MessageSquare, ChevronRight, CheckCircle2, Award, RefreshCw, Users, Brain, Lightbulb, HeartHandshake, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import assessmentImage from "@assets/generated_images/soft_skills_visualization.png";

interface AssessmentType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  duration: string;
  questions: Question[];
}

interface Question {
  id: number;
  scenario: string;
  options: { id: string; text: string; score: number }[];
}

interface AssessmentResult {
  id: string;
  assessmentType: string;
  score: number;
  feedback: string | null;
  completedAt: string;
}

const assessmentTypes: AssessmentType[] = [
  {
    id: "leadership",
    title: "Liderlik",
    description: "Ekip yönetimi, karar verme ve motivasyon yeteneklerinizi ölçün.",
    icon: <Users className="size-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    duration: "10 dk",
    questions: [
      {
        id: 1,
        scenario: "Bir projeyi yönetiyorsunuz, ancak kilit bir ekip üyesi sürekli teslim tarihlerini kaçırıyor ve zaman çizelgesini etkiliyor. Bunu nasıl ele alırsınız?",
        options: [
          { id: "a", text: "Sorunu belgelemek için durumu hemen yönetime bildiririm.", score: 40 },
          { id: "b", text: "Engellerini anlamak ve planı ayarlamak için bire bir görüşme yaparım.", score: 100 },
          { id: "c", text: "Projenin zamanında bitmesi için görevlerini kendim üstlenirim.", score: 60 },
          { id: "d", text: "Akran baskısı uygulamak için konuyu bir sonraki ekip toplantısında gündeme getiririm.", score: 30 }
        ]
      },
      {
        id: 2,
        scenario: "Ekibinizde iki kişi arasında ciddi bir anlaşmazlık var ve bu durum projeyi olumsuz etkiliyor.",
        options: [
          { id: "a", text: "İki tarafı da ayrı ayrı dinler, sonra birlikte bir çözüm toplantısı düzenlerim.", score: 100 },
          { id: "b", text: "Onları kendi başlarına çözmelerine bırakırım.", score: 20 },
          { id: "c", text: "Birini başka bir projeye transfer ederim.", score: 40 },
          { id: "d", text: "Her ikisine de profesyonel davranmalarını söylerim ve konuyu kapatırım.", score: 50 }
        ]
      },
      {
        id: 3,
        scenario: "Yeni bir strateji uygulamak istiyorsunuz ama ekibinizin çoğunluğu buna karşı çıkıyor.",
        options: [
          { id: "a", text: "Endişelerini dinler, gerekirse stratejiyi revize ederim.", score: 100 },
          { id: "b", text: "Lider olarak kararımı uygularım.", score: 40 },
          { id: "c", text: "Stratejiden vazgeçerim.", score: 20 },
          { id: "d", text: "Küçük bir pilot grup ile test ederim.", score: 80 }
        ]
      }
    ]
  },
  {
    id: "communication",
    title: "İletişim",
    description: "Etkili iletişim, sunum ve ikna kabiliyetlerinizi değerlendirin.",
    icon: <MessageSquare className="size-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    duration: "10 dk",
    questions: [
      {
        id: 1,
        scenario: "Bir paydaş, haftalarca üzerinde çalıştığınız bir özellik hakkında olumsuz geri bildirim veriyor. Değerlendirmelerine katılmıyorsunuz.",
        options: [
          { id: "a", text: "İlgili teknik karmaşıklığı açıklayarak çalışmamı savunurum.", score: 50 },
          { id: "b", text: "Geri bildirimlerinin arkasındaki 'nedeni' anlamak için netleştirici sorular sorarım.", score: 100 },
          { id: "c", text: "Geri bildirimi sessizce kabul ederim ama özelliği olduğu gibi bırakırım.", score: 30 },
          { id: "d", text: "Kullanıcı gereksinimlerini anlamadıklarını söylerim.", score: 20 }
        ]
      },
      {
        id: 2,
        scenario: "Teknik bir konuyu teknik olmayan bir kitleye sunmanız gerekiyor.",
        options: [
          { id: "a", text: "Basit analogiler ve görsel öğeler kullanarak anlaşılır hale getiririm.", score: 100 },
          { id: "b", text: "Teknik terimleri olduğu gibi kullanırım, öğrenmeleri gerekir.", score: 20 },
          { id: "c", text: "Sadece sonuçları gösteririm, detaylara girmem.", score: 60 },
          { id: "d", text: "Sunum yerine yazılı doküman hazırlarım.", score: 40 }
        ]
      },
      {
        id: 3,
        scenario: "Bir e-posta yanlış anlaşılmış ve karşı taraf kızgın. Ne yaparsınız?",
        options: [
          { id: "a", text: "Hemen telefon veya yüz yüze görüşme talep ederim.", score: 100 },
          { id: "b", text: "Uzun bir açıklama e-postası yazarım.", score: 50 },
          { id: "c", text: "Sakinleşmelerini beklerim.", score: 30 },
          { id: "d", text: "Yöneticimi bilgilendiririm.", score: 40 }
        ]
      }
    ]
  },
  {
    id: "problem_solving",
    title: "Problem Çözme",
    description: "Analitik düşünme ve yaratıcı çözüm üretme becerilerinizi test edin.",
    icon: <Lightbulb className="size-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    duration: "12 dk",
    questions: [
      {
        id: 1,
        scenario: "Üretimde kritik bir hata var ve müşteriler etkileniyor. Hata kaynağı belirsiz.",
        options: [
          { id: "a", text: "Sistematik olarak logları inceler, değişiklikleri kontrol ederim.", score: 100 },
          { id: "b", text: "En son değişikliği geri alırım.", score: 60 },
          { id: "c", text: "Ekipten yardım isterim ve beraber araştırırız.", score: 80 },
          { id: "d", text: "Panik yapmadan müşterilere bilgilendirme yaparım.", score: 50 }
        ]
      },
      {
        id: 2,
        scenario: "Bir projenin deadline'ı geldi ama tamamlanması imkansız görünüyor.",
        options: [
          { id: "a", text: "Öncelikleri belirler, en kritik özelliklere odaklanırım.", score: 100 },
          { id: "b", text: "Ekstra mesai yaparak yetiştirime çalışırım.", score: 40 },
          { id: "c", text: "Deadline uzatma talep ederim.", score: 70 },
          { id: "d", text: "Kaliteden ödün vererek hızlı bitiririm.", score: 30 }
        ]
      },
      {
        id: 3,
        scenario: "Müşteri istediği özellik teknik olarak çok zor ve bütçeyi aşıyor.",
        options: [
          { id: "a", text: "Alternatif çözümler sunarak benzer faydayı daha az maliyetle sağlarım.", score: 100 },
          { id: "b", text: "Yapılamayacağını söylerim.", score: 30 },
          { id: "c", text: "Ne olursa olsun yapmayı kabul ederim.", score: 20 },
          { id: "d", text: "Farklı bir teknoloji veya yaklaşım araştırırım.", score: 80 }
        ]
      }
    ]
  },
  {
    id: "empathy",
    title: "Empati",
    description: "Duygusal zeka ve başkalarını anlama yeteneğinizi ölçün.",
    icon: <HeartHandshake className="size-5" />,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    duration: "8 dk",
    questions: [
      {
        id: 1,
        scenario: "Kıdemli olmayan bir geliştiricinin bir görevde zorlandığını ama yardım istemediğini fark ettiniz.",
        options: [
          { id: "a", text: "Kendi başlarına çözmelerine izin veririm; bu öğrenmenin en iyi yoludur.", score: 30 },
          { id: "b", text: "Bana gelmelerini beklerim.", score: 20 },
          { id: "c", text: "Proaktif olarak kontrol ederim ve ihtiyaçları varsa eşli programlama teklif ederim.", score: 100 },
          { id: "d", text: "Görevi başka birine atarım.", score: 40 }
        ]
      },
      {
        id: 2,
        scenario: "Bir iş arkadaşınız son zamanlarda çok stresli görünüyor ve performansı düşüyor.",
        options: [
          { id: "a", text: "Özel bir sohbet için davet eder, dinlerim.", score: 100 },
          { id: "b", text: "Performans sorununu yöneticiye bildiririm.", score: 30 },
          { id: "c", text: "Kendi işime odaklanırım.", score: 20 },
          { id: "d", text: "İş yükünü hafifletmek için yardım teklif ederim.", score: 80 }
        ]
      },
      {
        id: 3,
        scenario: "Bir toplantıda sessiz kalan birinin fikirlerinin değerli olabileceğini düşünüyorsunuz.",
        options: [
          { id: "a", text: "Toplantıdan sonra özel olarak fikirlerini sorarım.", score: 80 },
          { id: "b", text: "Toplantıda doğrudan görüşlerini isterim.", score: 60 },
          { id: "c", text: "Konuşmak istemiyorlarsa saygı gösteririm.", score: 40 },
          { id: "d", text: "Toplantı formatını herkesin katkı sağlayacağı şekilde değiştiririm.", score: 100 }
        ]
      }
    ]
  },
  {
    id: "adaptability",
    title: "Uyum Yeteneği",
    description: "Değişime uyum sağlama ve esneklik becerilerinizi değerlendirin.",
    icon: <Zap className="size-5" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    duration: "8 dk",
    questions: [
      {
        id: 1,
        scenario: "Projenin ortasında gereksinimler tamamen değişti.",
        options: [
          { id: "a", text: "Yeni gereksinimleri değerlendirir ve planı güncelleririm.", score: 100 },
          { id: "b", text: "Değişikliğe itiraz ederim.", score: 30 },
          { id: "c", text: "Eski planla devam ederim.", score: 20 },
          { id: "d", text: "Durumu üst yönetime escale ederim.", score: 50 }
        ]
      },
      {
        id: 2,
        scenario: "Yeni bir teknoloji öğrenmeniz gerekiyor ama zaman kısıtlı.",
        options: [
          { id: "a", text: "En kritik konulara odaklanır, öğrenirken uygularım.", score: 100 },
          { id: "b", text: "Tam öğrenene kadar başlamam.", score: 30 },
          { id: "c", text: "Bilen birinden yardım isterim.", score: 70 },
          { id: "d", text: "Bildiğim teknolojiyle yapmayı önerirm.", score: 40 }
        ]
      },
      {
        id: 3,
        scenario: "Uzaktan çalışmaya geçiş yapıldı ve ekip koordinasyonu zorlaştı.",
        options: [
          { id: "a", text: "Yeni iletişim araçları ve rutinleri oluştururum.", score: 100 },
          { id: "b", text: "Ofise dönüş için baskı yaparım.", score: 30 },
          { id: "c", text: "Mevcut durumu kabullenirim.", score: 40 },
          { id: "d", text: "Daha sık video toplantılar düzenlerim.", score: 70 }
        ]
      }
    ]
  }
];

export default function Assessment() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedType, setSelectedType] = useState<AssessmentType | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);

  const { data: previousResults = [] } = useQuery<AssessmentResult[]>({
    queryKey: ["/api/assessments"],
    enabled: isAuthenticated,
  });

  const [createdQuestTitle, setCreatedQuestTitle] = useState<string | null>(null);

  const saveResultMutation = useMutation({
    mutationFn: async (data: { assessmentType: string; score: number; feedback: string }) => {
      const res = await apiRequest("POST", "/api/assessments", data);
      return res.json() as Promise<{ createdQuestTitle?: string | null }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      if (data.createdQuestTitle) {
        setCreatedQuestTitle(data.createdQuestTitle);
      }
    },
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

  const handleSelectType = (type: AssessmentType) => {
    setSelectedType(type);
    setStarted(false);
    setCurrentQuestion(0);
    setCompleted(false);
    setAnswers({});
    setScore(0);
  };

  const handleStart = () => setStarted(true);

  const handleNext = () => {
    if (!selectedType) return;
    
    if (currentQuestion < selectedType.questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
    } else {
      let totalScore = 0;
      selectedType.questions.forEach((q, idx) => {
        const answerId = answers[idx];
        const option = q.options.find(o => o.id === answerId);
        if (option) {
          totalScore += option.score;
        }
      });
      const avgScore = Math.round(totalScore / selectedType.questions.length);
      setScore(avgScore);
      setCompleted(true);
      
      const feedback = avgScore >= 80 
        ? "Mükemmel performans! Bu alanda güçlü bir profile sahipsiniz."
        : avgScore >= 60
        ? "İyi bir seviyedesiniz. Bazı alanlarda gelişim fırsatları mevcut."
        : "Gelişim potansiyeliniz yüksek. Önerilen kaynaklara göz atın.";
      
      saveResultMutation.mutate({
        assessmentType: selectedType.id,
        score: avgScore,
        feedback,
      });
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setStarted(false);
    setCurrentQuestion(0);
    setCompleted(false);
    setAnswers({});
  };

  const progress = selectedType 
    ? ((currentQuestion + (completed ? 1 : 0)) / selectedType.questions.length) * 100 
    : 0;

  const getResultForType = (typeId: string) => {
    return previousResults.find(r => r.assessmentType === typeId);
  };

  if (!selectedType) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-heading font-bold">Sosyal Beceri Değerlendirmeleri</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Kariyer başarısı için teknik beceriler kadar sosyal beceriler de önemlidir. 
            Aşağıdaki değerlendirmelerle güçlü yönlerinizi keşfedin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentTypes.map((type) => {
            const result = getResultForType(type.id);
            return (
              <Card 
                key={type.id} 
                className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 ${result ? 'border-green-200 bg-green-50/30' : ''}`}
                onClick={() => handleSelectType(type)}
                data-testid={`assessment-card-${type.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`size-10 rounded-lg ${type.bgColor} ${type.color} flex items-center justify-center`}>
                      {type.icon}
                    </div>
                    {result && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        %{result.score}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                    <span>{type.questions.length} soru</span>
                    <span>~{type.duration}</span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {previousResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-primary" />
                Geçmiş Sonuçlarınız
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previousResults.slice(0, 6).map((result) => {
                  const type = assessmentTypes.find(t => t.id === result.assessmentType);
                  return (
                    <div key={result.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`size-8 rounded-lg ${type?.bgColor || 'bg-gray-100'} ${type?.color || 'text-gray-600'} flex items-center justify-center`}>
                        {type?.icon || <Brain className="size-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{type?.title || result.assessmentType}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.completedAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Badge variant={result.score >= 80 ? "default" : "secondary"}>
                        %{result.score}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center py-12">
        <div className="space-y-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4" data-testid="button-back">
            <ArrowLeft className="mr-2 size-4" />
            Geri
          </Button>
          <Badge className={`${selectedType.bgColor} ${selectedType.color} hover:${selectedType.bgColor} border-0 px-3 py-1 text-sm`}>
            {selectedType.title}
          </Badge>
          <h1 className="text-4xl font-heading font-bold leading-tight">
            <span className={selectedType.color}>{selectedType.title}</span> Değerlendirmesi
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {selectedType.description} Bu değerlendirme senaryo tabanlı sorularla yeteneklerinizi ölçer.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>{selectedType.questions.length} senaryo tabanlı soru</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Yaklaşık {selectedType.duration} sürer</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Anında kişiselleştirilmiş geri bildirim</span>
            </div>
          </div>
          <Button size="lg" onClick={handleStart} className="mt-4 h-12 px-8 text-base" data-testid="button-start">
            Değerlendirmeyi Başlat
            <ChevronRight className="ml-2 size-5" />
          </Button>
        </div>
        <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50">
          <img 
            src={assessmentImage} 
            alt="Sosyal Beceriler" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/20 to-transparent pointer-events-none" />
        </div>
      </div>
    );
  }

  if (completed) {
    const scoreColor = score >= 80 ? "green" : score >= 60 ? "yellow" : "orange";
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className={`size-20 bg-${scoreColor}-100 text-${scoreColor}-600 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Award className="size-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold">Değerlendirme Tamamlandı!</h2>
          <p className="text-muted-foreground">{selectedType.title} alanındaki profiliniz.</p>
        </div>

        <Card className={`border-${scoreColor}-200 bg-${scoreColor}-50/50`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{selectedType.title} Skoru</span>
              <span className={`text-2xl font-bold text-${scoreColor}-700`}>{score}/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={score} className="h-3" />
            <p className="text-sm leading-relaxed">
              {score >= 80 
                ? `Mükemmel! ${selectedType.title} alanında güçlü bir profile sahipsiniz. Bu becerilerinizi liderlik pozisyonlarında kullanabilirsiniz.`
                : score >= 60
                ? `İyi bir seviyedesiniz. ${selectedType.title} alanında bazı gelişim fırsatları mevcut. Önerilen kaynaklara göz atın.`
                : `Gelişim potansiyeliniz yüksek. ${selectedType.title} becerilerinizi geliştirmek için aşağıdaki kaynaklara göz atın.`
              }
            </p>
          </CardContent>
        </Card>

        {createdQuestTitle && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                  <Zap className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Yeni Eğitim Eklendi!</p>
                  <p className="text-sm text-muted-foreground">{createdQuestTitle}</p>
                </div>
              </div>
              <Link href="/roadmap">
                <Button className="w-full" data-testid="button-go-roadmap">
                  Yol Haritasına Git
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={handleBack} data-testid="button-all-tests">
            Tüm Testler
          </Button>
          {!createdQuestTitle && (
            <Link href="/dashboard">
              <Button variant="outline">Panele Dön</Button>
            </Link>
          )}
          <Button onClick={() => {
            setCompleted(false);
            setCurrentQuestion(0);
            setStarted(false);
            setAnswers({});
            setCreatedQuestTitle(null);
          }} data-testid="button-retry">
            <RefreshCw className="mr-2 size-4" />
            Tekrarla
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = selectedType.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <Button variant="ghost" onClick={handleBack} className="mb-4" data-testid="button-back-quiz">
        <ArrowLeft className="mr-2 size-4" />
        Çık
      </Button>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
          <span>Soru {currentQuestion + 1} / {selectedType.questions.length}</span>
          <span>%{Math.round(progress)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed font-heading">
            {currentQ.scenario}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <RadioGroup 
            key={currentQuestion}
            value={answers[currentQuestion] || ""} 
            onValueChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion]: val }))}
            className="space-y-3"
          >
            {currentQ.options.map((option) => (
              <div key={option.id} className={`flex items-center space-x-3 border rounded-lg p-4 transition-all ${
                answers[currentQuestion] === option.id 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'hover:bg-muted/50 hover:border-primary/30'
              }`}>
                <RadioGroupItem value={option.id} id={`${currentQuestion}-${option.id}`} />
                <Label htmlFor={`${currentQuestion}-${option.id}`} className="flex-1 cursor-pointer font-normal text-base">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="justify-between border-t p-6 bg-muted/10">
          <Button variant="ghost" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(c => c - 1)} data-testid="button-prev">
            Önceki
          </Button>
          <Button onClick={handleNext} disabled={!answers[currentQuestion]} data-testid="button-next">
            {currentQuestion === selectedType.questions.length - 1 ? "Bitir" : "Sonraki Soru"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
