import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { Briefcase, Github, Linkedin, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import authImage from "@assets/generated_images/auth_illustration.png";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, firstName, lastName });
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
