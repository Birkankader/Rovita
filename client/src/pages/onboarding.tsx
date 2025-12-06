import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Linkedin, FileText, User, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = () => {
    toast({
      title: "Profil Oluşturuldu!",
      description: "CareerAscend'e hoş geldiniz. İlk işinizi analiz edelim.",
    });
    setLocation("/dashboard");
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
                  PDF veya DOCX formatındaki özgeçmişinizi yükleyin, yapay zekamız onu yapılandırılmış bir profile dönüştürsün.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={handleComplete}>
                  <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Yüklemek için tıklayın veya sürükleyip bırakın</p>
                    <p className="text-sm text-muted-foreground">PDF, DOCX (maksimum 10MB)</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleComplete} className="w-full">
                  Özgeçmişi İşle
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
