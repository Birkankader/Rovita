import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { Briefcase, Github, Linkedin, Loader2, Upload, FileText, X } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import authImage from "@assets/generated_images/auth_illustration.png";

interface ParsedCV {
  jobTitle: string | null;
  bio: string | null;
  skills: string[];
  experience: Array<{ title: string; company: string; description: string }>;
  education: Array<{ degree: string; school: string }>;
  warnings?: string[];
  degraded?: boolean;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [parsedCV, setParsedCV] = useState<ParsedCV | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Handle specific error codes - clear both file and parsed data on errors
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

      // Handle 206 Partial Content - degraded result
      if (response.status === 206) {
        const parsedData = data as ParsedCV;
        // Display warnings if any
        if (parsedData.warnings && parsedData.warnings.length > 0) {
          const warningMessage = parsedData.warnings.slice(0, 3).join(". ");
          toast({ 
            title: "Uyarılar", 
            description: warningMessage,
          });
        }
        toast({ 
          title: "Kısmi Sonuç", 
          description: data.message || "CV'den yeterli bilgi çıkarılamadı. Kayıt sonrası manuel düzenleyebilirsiniz.",
        });
        // Clear both file and parsed data to prevent stale auto-fill
        setCvFile(null);
        setParsedCV(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "CV işlenemedi");
      }

      const parsedData = data as ParsedCV;
      
      // Display warnings if any
      if (parsedData.warnings && parsedData.warnings.length > 0) {
        const warningMessage = parsedData.warnings.slice(0, 3).join(". ");
        toast({ 
          title: "Uyarılar", 
          description: warningMessage,
        });
      }

      setParsedCV(parsedData);
      toast({ title: "CV Yüklendi", description: "Bilgileriniz otomatik olarak dolduruldu" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "CV işlenirken bir hata oluştu", variant: "destructive" });
      setCvFile(null);
      setParsedCV(null);
    } finally {
      setIsParsing(false);
    }
  };

  const removeCVFile = () => {
    setCvFile(null);
    setParsedCV(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ 
        email, 
        password, 
        firstName, 
        lastName,
        cvData: parsedCV ? {
          jobTitle: parsedCV.jobTitle,
          bio: parsedCV.bio,
          skills: parsedCV.skills,
          experience: parsedCV.experience,
          education: parsedCV.education,
        } : undefined,
      });

      toast({ title: "Kayıt başarılı!", description: "Hoş geldiniz." });
      setLocation("/onboarding");
    } catch (error: any) {
      const message = error?.message?.includes("400") 
        ? "Bu email adresi zaten kayıtlı" 
        : "Kayıt sırasında bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-2xl mb-8 text-primary">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              CareerAscend
            </Link>
            <h1 className="text-3xl font-heading font-bold">Hesap Oluşturun</h1>
            <p className="text-muted-foreground">Kariyer hedeflerinize ulaşmak için ilk adımı atın.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Ahmet" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    data-testid="input-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Yılmaz" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    data-testid="input-lastname"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="ornek@sirket.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="En az 6 karakter" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label>CV Yükle (İsteğe Bağlı)</Label>
                <div className="text-xs text-muted-foreground mb-2">
                  PDF formatında CV yükleyerek profilinizi otomatik doldurun
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCVUpload(file);
                  }}
                  className="hidden"
                  data-testid="input-cv-file"
                />
                {!cvFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isParsing}
                    data-testid="button-upload-cv"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        CV İşleniyor...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        CV Yüklemek İçin Tıklayın
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{cvFile.name}</span>
                      {parsedCV && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          İşlendi
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCVFile}
                      data-testid="button-remove-cv"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {parsedCV && parsedCV.skills.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Bulunan beceriler:</span>{" "}
                    {parsedCV.skills.slice(0, 5).join(", ")}
                    {parsedCV.skills.length > 5 && ` +${parsedCV.skills.length - 5} daha`}
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="terms" required className="mt-1" data-testid="checkbox-terms" />
                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-tight">
                  <Link href="/terms" className="text-primary hover:underline">Kullanım Koşulları</Link> ve <Link href="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>'nı kabul ediyorum.
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isRegistering} data-testid="button-register">
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hesap Oluşturuluyor...
                </>
              ) : (
                "Kayıt Ol"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Veya şununla kayıt olun
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button" className="h-11" data-testid="button-linkedin">
                <Linkedin className="mr-2 size-4 text-[#0077b5]" />
                LinkedIn
              </Button>
              <Button variant="outline" type="button" className="h-11" data-testid="button-github">
                <Github className="mr-2 size-4" />
                GitHub
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Marketing */}
      <div className="hidden lg:block relative bg-muted">
        <img 
          src={authImage} 
          alt="Kariyer Gelişimi" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/80 to-transparent text-white">
          <div className="max-w-lg">
            <h2 className="text-3xl font-heading font-bold mb-4">Potansiyelinizi Keşfedin</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Yapay zeka destekli analizler, kişiselleştirilmiş yol haritaları ve oyunlaştırılmış öğrenme deneyimi ile kariyer basamaklarını hızla tırmanın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
