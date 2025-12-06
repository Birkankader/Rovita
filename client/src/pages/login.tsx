import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { Briefcase, Github, Linkedin, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import authImage from "@assets/generated_images/auth_illustration.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast({ title: "Giriş başarılı!", description: "Hoş geldiniz." });
      setLocation("/dashboard");
    } catch (error: any) {
      const message = error?.message?.includes("401") 
        ? "Email veya şifre hatalı" 
        : "Giriş sırasında bir hata oluştu";
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
              Rotiva
            </Link>
            <h1 className="text-3xl font-heading font-bold">Tekrar Hoş Geldiniz</h1>
            <p className="text-muted-foreground">Kariyer yolculuğunuza devam etmek için giriş yapın.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Şifremi unuttum?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" data-testid="checkbox-remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Beni hatırla
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoggingIn} data-testid="button-login">
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Veya şununla devam et
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
            Hesabınız yok mu?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Hemen kayıt olun
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
            <h2 className="text-3xl font-heading font-bold mb-4">Kariyerinizi Şansa Bırakmayın</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              "CareerAscend sayesinde eksik becerilerimi 3 ayda tamamlayıp hayalimdeki Senior Product Designer rolüne kabul aldım."
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                AD
              </div>
              <div>
                <p className="font-semibold">Alex Designer</p>
                <p className="text-sm text-white/60">Kıdemli Ürün Tasarımcısı</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
