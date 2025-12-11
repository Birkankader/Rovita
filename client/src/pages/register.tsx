import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { Briefcase, Linkedin, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import authImage from "@assets/generated_images/auth_illustration.png";

type Step = "email" | "verification" | "details";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingCode(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-verification", { email });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Kod gönderilemedi");
      }
      setCodeSent(true);
      setStep("verification");
      toast({ title: "Kod Gönderildi", description: `${email} adresine doğrulama kodu gönderildi.` });
    } catch (error: any) {
      toast({ 
        title: "Hata", 
        description: error.message || "Doğrulama kodu gönderilemedi", 
        variant: "destructive" 
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      setStep("details");
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
        verificationCode,
      });

      toast({ title: "Kayıt başarılı!", description: "Hoş geldiniz." });
      setLocation("/onboarding");
    } catch (error: any) {
      const message = error?.message?.includes("400") 
        ? "Doğrulama kodu hatalı veya süresi dolmuş" 
        : "Kayıt sırasında bir hata oluştu";
      toast({ title: "Hata", description: message, variant: "destructive" });
    }
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);
    try {
      const res = await apiRequest("POST", "/api/auth/send-verification", { email });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Kod gönderilemedi");
      }
      toast({ title: "Kod Tekrar Gönderildi", description: `${email} adresine yeni doğrulama kodu gönderildi.` });
    } catch (error: any) {
      toast({ 
        title: "Hata", 
        description: error.message || "Doğrulama kodu gönderilemedi", 
        variant: "destructive" 
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-2xl mb-8 text-primary">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Briefcase className="size-5" />
              </div>
              Rotiva
            </Link>
            <h1 className="text-3xl font-heading font-bold">
              {step === "email" && "Hesap Oluşturun"}
              {step === "verification" && "E-postanızı Doğrulayın"}
              {step === "details" && "Bilgilerinizi Tamamlayın"}
            </h1>
            <p className="text-muted-foreground">
              {step === "email" && "Kariyer hedeflerinize ulaşmak için ilk adımı atın."}
              {step === "verification" && `${email} adresine gönderilen 6 haneli kodu girin.`}
              {step === "details" && "Hesabınızı tamamlamak için bilgilerinizi girin."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {["email", "verification", "details"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s 
                    ? "bg-primary text-primary-foreground" 
                    : (["email", "verification", "details"].indexOf(step) > i 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground")
                }`}>
                  {["email", "verification", "details"].indexOf(step) > i ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${["email", "verification", "details"].indexOf(step) > i ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Bu adrese doğrulama kodu göndereceğiz.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={isSendingCode} data-testid="button-send-code">
                {isSendingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kod Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Doğrulama Kodu Gönder
                  </>
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

              <Button variant="outline" type="button" className="h-11 w-full" disabled data-testid="button-linkedin">
                <Linkedin className="mr-2 size-4 text-[#0077b5]" />
                LinkedIn ile Kayıt Ol (Yakında)
              </Button>
            </form>
          )}

          {step === "verification" && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Kod 10 dakika içinde geçerliliğini yitirecektir.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={verificationCode.length !== 6}
                data-testid="button-verify"
              >
                Doğrula ve Devam Et
              </Button>

              <div className="flex items-center justify-between">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep("email")}
                  data-testid="button-back-email"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  data-testid="button-resend"
                >
                  {isSendingCode ? "Gönderiliyor..." : "Kodu Tekrar Gönder"}
                </Button>
              </div>
            </form>
          )}

          {step === "details" && (
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

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep("verification")}
                data-testid="button-back-verification"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>

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
