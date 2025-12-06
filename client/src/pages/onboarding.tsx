import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Linkedin, FileText, User, ArrowRight, Loader2, X } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

interface ParsedCV {
  jobTitle: string | null;
  bio: string | null;
  skills: string[];
  experience: Array<{ title: string; company: string; description: string }>;
  education: Array<{ degree: string; school: string }>;
  warnings?: string[];
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    // If we have parsed CV data, save it to the profile first
    if (parsedCV) {
      setIsSaving(true);
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jobTitle: parsedCV.jobTitle,
            bio: parsedCV.bio,
            skills: parsedCV.skills,
            experience: parsedCV.experience,
            education: parsedCV.education,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Profil kaydedilemedi");
        }
      } catch (error: any) {
        toast({
          title: "Hata",
          description: error.message || "Profil kaydedilirken bir hata oluştu",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    toast({
      title: "Profil Oluşturuldu!",
      description: "CareerAscend'e hoş geldiniz. İlk işinizi analiz edelim.",
    });
    setLocation("/dashboard");
  };

  const handleCVUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Hata", description: "Sadece PDF dosyaları kabul edilir", variant: "destructive" });
      return;
    }

    setCvFile(file);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const response = await fetch("/api/cv/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.status === 503) {
        toast({ title: "Servis Kullanılamıyor", description: data.message || "AI servisi şu an kullanılamıyor", variant: "destructive" });
        setCvFile(null);
        setParsedCV(null);
        return;
      }

      if (response.status === 429) {
        toast({ title: "Yoğunluk", description: data.message || "Servis yoğun, lütfen birkaç dakika sonra tekrar deneyin", variant: "destructive" });
        setCvFile(null);
        setParsedCV(null);
        return;
      }

      if (response.status === 502) {
        toast({ title: "Servis Hatası", description: data.message || "AI servisi geçici olarak kullanılamıyor", variant: "destructive" });
        setCvFile(null);
        setParsedCV(null);
        return;
      }

      if (response.status === 422) {
        toast({ title: "Geçersiz CV", description: data.message || "CV dosyasından yeterli bilgi çıkarılamadı", variant: "destructive" });
        setCvFile(null);
        setParsedCV(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "CV işlenemedi");
      }

      const parsedData = data as ParsedCV;
      
      if (parsedData.warnings && parsedData.warnings.length > 0) {
        const warningMessage = parsedData.warnings.slice(0, 3).join(". ");
        toast({ 
          title: "Uyarılar", 
          description: warningMessage,
        });
      }

      setParsedCV(parsedData);
      toast({ title: "CV Yüklendi", description: "Bilgileriniz başarıyla işlendi" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "CV işlenirken bir hata oluştu", variant: "destructive" });
      setCvFile(null);
      setParsedCV(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleCVUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeCVFile = () => {
    setCvFile(null);
    setParsedCV(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold">Profilinizi Oluşturun</h1>
        <p className="text-muted-foreground">Profesyonel verilerinizi nasıl içe aktarmak istediğinizi seçin.</p>
      </div>

      <Tabs defaultValue="linkedin" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="linkedin" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <Linkedin className="size-4" />
            LinkedIn İçe Aktar
          </TabsTrigger>
          <TabsTrigger value="resume" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <FileText className="size-4" />
            CV Yükle
          </TabsTrigger>
          <TabsTrigger value="manual" className="py-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
            <User className="size-4" />
            Manuel Giriş
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="linkedin">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn ile Bağlan</CardTitle>
                <CardDescription>
                  Deneyiminizi, eğitiminizi ve becerilerinizi doğrudan LinkedIn profilinizden içe aktaracağız.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="size-16 bg-[#0077b5]/10 rounded-full flex items-center justify-center text-[#0077b5]">
                  <Linkedin className="size-8" />
                </div>
                <Button onClick={handleComplete} size="lg" className="bg-[#0077b5] hover:bg-[#0077b5]/90 text-white w-full max-w-xs">
                  LinkedIn ile Giriş Yap
                </Button>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  Bağlanarak, CareerAscend'in herkese açık profil verilerinize erişmesine izin vermiş olursunuz.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Özgeçmiş Yükle</CardTitle>
                <CardDescription>
                  PDF formatındaki özgeçmişinizi yükleyin, yapay zekamız onu yapılandırılmış bir profile dönüştürsün.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCVUpload(file);
                  }}
                  className="hidden"
                  data-testid="input-cv-file-onboarding"
                />
                {!cvFile ? (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 transition-colors cursor-pointer ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    data-testid="cv-dropzone"
                  >
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      {isParsing ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {isParsing ? "CV İşleniyor..." : "Yüklemek için tıklayın veya sürükleyip bırakın"}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF (maksimum 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <FileText className="size-5" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[250px]">{cvFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {parsedCV ? "İşlendi" : isParsing ? "İşleniyor..." : "Yüklendi"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeCVFile}
                        disabled={isParsing}
                        data-testid="button-remove-cv-onboarding"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    {parsedCV && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                        {parsedCV.jobTitle && (
                          <p><span className="font-medium">Unvan:</span> {parsedCV.jobTitle}</p>
                        )}
                        {parsedCV.skills.length > 0 && (
                          <p><span className="font-medium">Beceriler:</span> {parsedCV.skills.slice(0, 5).join(", ")}{parsedCV.skills.length > 5 && ` +${parsedCV.skills.length - 5} daha`}</p>
                        )}
                        {parsedCV.experience.length > 0 && (
                          <p><span className="font-medium">Deneyim:</span> {parsedCV.experience.length} pozisyon</p>
                        )}
                        {parsedCV.education.length > 0 && (
                          <p><span className="font-medium">Eğitim:</span> {parsedCV.education.length} kayıt</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleComplete} 
                  className="w-full"
                  disabled={isParsing || isSaving || !parsedCV}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Profili Oluştur ve Devam Et"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manuel Profil Girişi</CardTitle>
                <CardDescription>
                  Profilinizi oluşturmak için bilgilerinizi manuel olarak girin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input id="firstName" placeholder="Adınız" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input id="lastName" placeholder="Soyadınız" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Mevcut İş Unvanı</Label>
                  <Input id="title" placeholder="ör. Frontend Geliştirici" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Profesyonel Özet</Label>
                  <Textarea id="bio" placeholder="Deneyiminizi kısaca açıklayın..." />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleComplete} className="w-full gap-2">
                  Profil Oluştur
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
