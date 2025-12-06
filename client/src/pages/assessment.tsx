import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MessageSquare, ChevronRight, CheckCircle2, Award, RefreshCw, Users } from "lucide-react";
import { Link } from "wouter";
import assessmentImage from "@assets/generated_images/soft_skills_visualization.png";

export default function Assessment() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const questions = [
    {
      id: 1,
      scenario: "Bir projeyi yönetiyorsunuz, ancak kilit bir ekip üyesi sürekli teslim tarihlerini kaçırıyor ve zaman çizelgesini etkiliyor. Bunu nasıl ele alırsınız?",
      options: [
        { id: "a", text: "Sorunu belgelemek için durumu hemen yönetime bildiririm." },
        { id: "b", text: "Engellerini anlamak ve planı ayarlamak için bire bir görüşme yaparım." },
        { id: "c", text: "Projenin zamanında bitmesi için görevlerini kendim üstlenirim." },
        { id: "d", text: "Akran baskısı uygulamak için konuyu bir sonraki ekip toplantısında gündeme getiririm." }
      ]
    },
    {
      id: 2,
      scenario: "Bir paydaş, haftalarca üzerinde çalıştığınız bir özellik hakkında olumsuz geri bildirim veriyor. Değerlendirmelerine katılmıyorsunuz.",
      options: [
        { id: "a", text: "İlgili teknik karmaşıklığı açıklayarak çalışmamı savunurum." },
        { id: "b", text: "Geri bildirimlerinin arkasındaki 'nedeni' anlamak için netleştirici sorular sorarım." },
        { id: "c", text: "Geri bildirimi sessizce kabul ederim ama özelliği olduğu gibi bırakırım." },
        { id: "d", text: "Kullanıcı gereksinimlerini anlamadıklarını söylerim." }
      ]
    },
    {
      id: 3,
      scenario: "Kıdemli olmayan bir geliştiricinin bir görevde zorlandığını ama yardım istemediğini fark ettiniz.",
      options: [
        { id: "a", text: "Kendi başlarına çözmelerine izin veririm; bu öğrenmenin en iyi yoludur." },
        { id: "b", text: "Bana gelmelerini beklerim." },
        { id: "c", text: "Proaktif olarak kontrol ederim ve ihtiyaçları varsa eşli programlama (pairing) teklif ederim." },
        { id: "d", text: "Görevi başka birine atarım." }
      ]
    }
  ];

  const handleStart = () => setStarted(true);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
    } else {
      setCompleted(true);
    }
  };

  const progress = ((currentQuestion + (completed ? 1 : 0)) / questions.length) * 100;

  if (!started) {
    return (
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center py-12">
        <div className="space-y-6">
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 px-3 py-1 text-sm">
            Sosyal Beceriler
          </Badge>
          <h1 className="text-4xl font-heading font-bold leading-tight">
            <span className="text-orange-600">Liderlik</span> Sanatında Ustalaşın
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Teknik beceriler size mülakatı kazandırır, ancak sosyal beceriler işi almanızı sağlar. Liderlik, iletişim ve empati yeteneklerinizi değerlendirmek için interaktif senaryo tabanlı değerlendirmemizi yapın.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>15 dakikalık uyarlanabilir test</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Gerçek dünya iş yeri senaryoları</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Anında kişiselleştirilmiş geri bildirim</span>
            </div>
          </div>
          <Button size="lg" onClick={handleStart} className="mt-4 h-12 px-8 text-base">
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
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="size-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold">Değerlendirme Tamamlandı!</h2>
          <p className="text-muted-foreground">İşte kişiselleştirilmiş liderlik profiliniz.</p>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Liderlik Skoru</span>
              <span className="text-2xl font-bold text-green-700">85/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={85} className="h-3 bg-green-200" indicatorClassName="bg-green-600" />
            <p className="text-sm text-green-800 leading-relaxed">
              Güçlü <strong>Empati</strong> ve <strong>Aktif Dinleme</strong> becerileri sergiliyorsunuz. Ekip refahını ve fikir birliğini önceliklendirme eğilimindesiniz. Bir sonraki seviyeye ulaşmak için, yüksek baskı altındaki durumlarda <strong>Kararlılık</strong> üzerine odaklanın.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Önerilen Kaynaklar</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Crucial Conversations</h4>
                  <p className="text-xs text-muted-foreground">Kitap • Riskler yüksek olduğunda konuşmak için araçlar</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Users className="size-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Radical Candor</h4>
                  <p className="text-xs text-muted-foreground">Atölye • İnsanlığınızı kaybetmeden harika bir patron nasıl olunur</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button variant="outline">Panele Dön</Button>
          </Link>
          <Button onClick={() => {
            setCompleted(false);
            setCurrentQuestion(0);
            setStarted(false);
          }}>
            <RefreshCw className="mr-2 size-4" />
            Testi Tekrarla
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
          <span>Soru {currentQuestion + 1} / {questions.length}</span>
          <span>%{Math.round(progress)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed font-heading">
            {questions[currentQuestion].scenario}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <RadioGroup 
            value={answers[currentQuestion]} 
            onValueChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion]: val }))}
            className="space-y-3"
          >
            {questions[currentQuestion].options.map((option) => (
              <div key={option.id} className={`flex items-center space-x-3 border rounded-lg p-4 transition-all ${
                answers[currentQuestion] === option.id 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'hover:bg-muted/50 hover:border-primary/30'
              }`}>
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer font-normal text-base">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="justify-between border-t p-6 bg-muted/10">
          <Button variant="ghost" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(c => c - 1)}>
            Önceki
          </Button>
          <Button onClick={handleNext} disabled={!answers[currentQuestion]}>
            {currentQuestion === questions.length - 1 ? "Bitir" : "Sonraki Soru"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
