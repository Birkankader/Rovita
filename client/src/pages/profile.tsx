import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Link as LinkIcon, Github, Linkedin, Edit2, Download, GraduationCap, Briefcase } from "lucide-react";

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="size-24 md:size-32 border-4 border-background shadow-xl">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-heading font-bold">Alex Designer</h1>
                  <p className="text-muted-foreground font-medium">Kıdemli Ürün Tasarımcısı</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 size-4" />
                    CV İndir
                  </Button>
                  <Button size="sm">
                    <Edit2 className="mr-2 size-4" />
                    Profili Düzenle
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  San Francisco, CA
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="size-4" />
                  alex@example.com
                </div>
                <div className="flex items-center gap-1">
                  <LinkIcon className="size-4" />
                  alex.design
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Github className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Linkedin className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beceriler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Figma</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Kullanıcı Araştırması</Badge>
                <Badge variant="secondary">Prototipleme</Badge>
                <Badge variant="secondary">Tasarım Sistemleri</Badge>
                <Badge variant="secondary">HTML/CSS</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Diller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>İngilizce</span>
                <span className="text-muted-foreground">Anadil</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>İspanyolca</span>
                <span className="text-muted-foreground">Orta Seviye</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="experience" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
              <TabsTrigger value="experience" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1">Deneyim</TabsTrigger>
              <TabsTrigger value="education" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1">Eğitim</TabsTrigger>
              <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1">Projeler</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="experience" className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                    <Briefcase className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">Kıdemli Ürün Tasarımcısı</h3>
                      <span className="text-sm text-muted-foreground">2021 - Günümüz</span>
                    </div>
                    <p className="text-primary font-medium">TechCorp A.Ş.</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Temel ürün panelinin yeniden tasarımını yönettim, kullanıcı etkileşiminde %20 artış sağladım. 3 kıdemli olmayan tasarımcıdan oluşan bir ekibi yönettim ve şirketin ilk tasarım sistemini kurdum.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <div className="mt-1 bg-muted p-2 rounded-lg h-fit">
                    <Briefcase className="size-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">UI/UX Tasarımcısı</h3>
                      <span className="text-sm text-muted-foreground">2019 - 2021</span>
                    </div>
                    <p className="text-foreground font-medium">Yaratıcı Ajans</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Yüksek kaliteli prototipler ve mobil uygulamalar sunmak için çeşitli müşterilerle çalıştım. Kullanıcı testi oturumları düzenledim ve geri bildirimlere göre yinelemeler yaptım.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg h-fit">
                    <GraduationCap className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">Etkileşim Tasarımı Lisans Derecesi</h3>
                      <span className="text-sm text-muted-foreground">2015 - 2019</span>
                    </div>
                    <p className="text-primary font-medium">Tasarım Sanatları Üniversitesi</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
