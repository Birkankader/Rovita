import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { MessageSquare, ChevronRight, CheckCircle2, Award, RefreshCw, Users, Brain, Lightbulb, HeartHandshake, Zap, ArrowLeft, Loader2, Lock, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import assessmentImage from "@assets/generated_images/soft_skills_visualization.png";

interface Question {
  id: number;
  scenario: string;
  options: { id: string; text: string; score: number }[];
}

interface LevelData {
  level: number;
  title: string;
  description: string;
  questions: Question[];
}

interface AssessmentType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  levels: LevelData[];
}

interface AssessmentResult {
  id: string;
  assessmentType: string;
  level: number;
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
    levels: [
      {
        level: 1,
        title: "Başlangıç",
        description: "Temel liderlik kavramları ve ekip dinamikleri",
        questions: [
          { id: 1, scenario: "Bir ekip toplantısında herkesin fikrini almak istiyorsunuz. Ne yaparsınız?", options: [{ id: "a", text: "Sadece en kıdemli kişilere söz hakkı veririm.", score: 30 }, { id: "b", text: "Herkese sırayla söz hakkı veririm.", score: 100 }, { id: "c", text: "Konuşmak isteyenlerin el kaldırmasını beklerim.", score: 60 }, { id: "d", text: "Toplantıyı kısa tutup e-posta ile görüş alırım.", score: 50 }] },
          { id: 2, scenario: "Yeni bir ekip üyesi ilk gününde. Onu nasıl karşılarsınız?", options: [{ id: "a", text: "İK'nın oryantasyon yapmasını beklerim.", score: 30 }, { id: "b", text: "Ona mentör atarım ve ilk hafta boyunca düzenli kontrol ederim.", score: 100 }, { id: "c", text: "Gerekli dokümanları gönderirim.", score: 50 }, { id: "d", text: "Kendi başına öğrenmesine izin veririm.", score: 20 }] },
          { id: 3, scenario: "Ekipte motivasyon düşük görünüyor. Ne yaparsınız?", options: [{ id: "a", text: "Bireysel görüşmeler yaparak nedenleri anlarım.", score: 100 }, { id: "b", text: "Ekstra görevler vererek meşgul ederim.", score: 30 }, { id: "c", text: "Yönetimi bilgilendiririm.", score: 50 }, { id: "d", text: "Kendiliğinden düzelmesini beklerim.", score: 20 }] },
          { id: 4, scenario: "Bir karar vermek zorundasınız ama tüm bilgiye sahip değilsiniz.", options: [{ id: "a", text: "Mevcut bilgiyle en iyi kararı veririm ve gerekirse revize ederim.", score: 100 }, { id: "b", text: "Tüm bilgi gelene kadar beklerim.", score: 40 }, { id: "c", text: "Kararı üstlere bırakırım.", score: 30 }, { id: "d", text: "Rastgele seçerim.", score: 10 }] },
          { id: 5, scenario: "Bir ekip üyesi sürekli toplantılara geç kalıyor.", options: [{ id: "a", text: "Herkesin önünde uyarırım.", score: 20 }, { id: "b", text: "Özel bir görüşme yapıp nedeni anlarım.", score: 100 }, { id: "c", text: "Görmezden gelirim.", score: 30 }, { id: "d", text: "Toplantı saatlerini değiştiririm.", score: 50 }] },
          { id: 6, scenario: "Proje deadline'ı yaklaşıyor ve ekip stresli.", options: [{ id: "a", text: "Gerçekçi öncelikler belirler ve ekibi rahatlatırım.", score: 100 }, { id: "b", text: "Daha fazla baskı uygularım.", score: 30 }, { id: "c", text: "Deadline uzatma talep ederim.", score: 60 }, { id: "d", text: "Ekstra eleman talep ederim.", score: 50 }] },
          { id: 7, scenario: "İki ekip üyesi arasında gerilim var.", options: [{ id: "a", text: "Kendileri çözmelerini beklerim.", score: 30 }, { id: "b", text: "Her ikisiyle ayrı ayrı konuşup durumu anlarım.", score: 100 }, { id: "c", text: "Birini başka takıma transfer ederim.", score: 40 }, { id: "d", text: "Yönetimi bilgilendiririm.", score: 50 }] },
          { id: 8, scenario: "Ekibinize yeni bir araç kullanmayı öğretmeniz gerekiyor.", options: [{ id: "a", text: "Dokümantasyon paylaşırım.", score: 50 }, { id: "b", text: "Hands-on eğitim düzenlerim ve pratik yaptırırım.", score: 100 }, { id: "c", text: "Herkesin kendi başına öğrenmesini beklerim.", score: 30 }, { id: "d", text: "Uzman birini çağırırım.", score: 60 }] },
          { id: 9, scenario: "Ekipten biri sürekli negatif yorumlar yapıyor.", options: [{ id: "a", text: "Onu görmezden gelirim.", score: 30 }, { id: "b", text: "Özel görüşme yapıp endişelerini dinlerim.", score: 100 }, { id: "c", text: "Diğerlerinin önünde uyarırım.", score: 20 }, { id: "d", text: "Yöneticiye raporlarım.", score: 50 }] },
          { id: 10, scenario: "Bir başarıyı kutlamak istiyorsunuz.", options: [{ id: "a", text: "Tüm ekibi dahil eden bir kutlama organize ederim.", score: 100 }, { id: "b", text: "Sadece ana katkıda bulunanları ödüllendiririm.", score: 50 }, { id: "c", text: "E-posta ile tebrik ederim.", score: 60 }, { id: "d", text: "Bir sonraki projeye odaklanırım.", score: 30 }] }
        ]
      },
      {
        level: 2,
        title: "Orta Seviye",
        description: "Karmaşık liderlik durumları ve stratejik düşünme",
        questions: [
          { id: 1, scenario: "Ekibiniz büyük bir reorganizasyondan geçiyor ve belirsizlik yüksek.", options: [{ id: "a", text: "Bildiklerimi açıkça paylaşır, belirsizlikleri kabul ederim.", score: 100 }, { id: "b", text: "Her şey netleşene kadar sessiz kalırım.", score: 30 }, { id: "c", text: "Söylentilere göre hareket ederim.", score: 20 }, { id: "d", text: "Sadece soranlara cevap veririm.", score: 50 }] },
          { id: 2, scenario: "Bir ekip üyesi terfi bekliyor ama henüz hazır değil.", options: [{ id: "a", text: "Açık geri bildirim verir, gelişim planı oluştururum.", score: 100 }, { id: "b", text: "Terfi veririm, yolda öğrenir.", score: 30 }, { id: "c", text: "Konuyu erteleri ve net bir cevap vermem.", score: 40 }, { id: "d", text: "Başka birini terfi ettiririm.", score: 20 }] },
          { id: 3, scenario: "Üst yönetimden gelen bir karar ekibinizi olumsuz etkileyecek.", options: [{ id: "a", text: "Ekibi bilgilendirir, endişelerini yukarı taşırım.", score: 100 }, { id: "b", text: "Kararı olduğu gibi uygularım.", score: 40 }, { id: "c", text: "Karara karşı gelir, uygulamayı reddederim.", score: 20 }, { id: "d", text: "Ekibe söylemem, kendim hallederim.", score: 30 }] },
          { id: 4, scenario: "Yüksek performanslı bir çalışan ayrılmak istiyor.", options: [{ id: "a", text: "Nedenlerini anlayıp, mümkünse çözüm üretirim.", score: 100 }, { id: "b", text: "Hemen karşı teklifle giderim.", score: 50 }, { id: "c", text: "Gitmesine izin veririm.", score: 30 }, { id: "d", text: "Yönetimi bilgilendirip onların karar vermesini beklerim.", score: 40 }] },
          { id: 5, scenario: "Ekibiniz çapraz fonksiyonel bir projede diğer ekiplerle çalışacak.", options: [{ id: "a", text: "Rolleri ve iletişim kanallarını baştan netleştiririm.", score: 100 }, { id: "b", text: "Herkesin kendi yolunu bulmasını beklerim.", score: 30 }, { id: "c", text: "Sadece kendi ekibime odaklanırım.", score: 40 }, { id: "d", text: "Tüm kontrolü elimde tutarım.", score: 20 }] },
          { id: 6, scenario: "Bir ekip üyesi sizi yönetim toplantısında eleştirdi.", options: [{ id: "a", text: "Toplantı sonrası özel görüşme talep ederim.", score: 100 }, { id: "b", text: "Orada karşılık veririm.", score: 20 }, { id: "c", text: "Görmezden gelirim.", score: 40 }, { id: "d", text: "İK'ya şikayet ederim.", score: 30 }] },
          { id: 7, scenario: "Ekibin teknoloji yığınını değiştirmeniz gerekiyor.", options: [{ id: "a", text: "Değişimin nedenlerini açıklar, eğitim planı yaparım.", score: 100 }, { id: "b", text: "Direkt değişikliği duyururum.", score: 30 }, { id: "c", text: "Gönüllüleri pilot grup olarak kullanırım.", score: 80 }, { id: "d", text: "Değişikliği ertelerim.", score: 40 }] },
          { id: 8, scenario: "Uzaktan çalışan ekibi motive etmeniz gerekiyor.", options: [{ id: "a", text: "Düzenli 1-1'ler ve sanal aktiviteler organize ederim.", score: 100 }, { id: "b", text: "Daha fazla toplantı düzenlerim.", score: 40 }, { id: "c", text: "Kamera zorunluluğu getiririm.", score: 30 }, { id: "d", text: "Ofise dönüş için baskı yaparım.", score: 20 }] },
          { id: 9, scenario: "Ekipte bir mikro yönetici olarak algılanıyorsunuz.", options: [{ id: "a", text: "Geri bildirim alır, delegasyon ve özerklik alanlarını artırırım.", score: 100 }, { id: "b", text: "Stilimi değiştirmem, ben böyleyim.", score: 20 }, { id: "c", text: "Tamamen geri çekilirim.", score: 40 }, { id: "d", text: "Algının yanlış olduğunu savunurum.", score: 30 }] },
          { id: 10, scenario: "Stratejik bir hedef belirlerken ekibi dahil etmek istiyorsunuz.", options: [{ id: "a", text: "Beyin fırtınası oturumları düzenler, tüm fikirleri değerlendiririm.", score: 100 }, { id: "b", text: "Hedefi kendim belirler, ekibe sunarım.", score: 40 }, { id: "c", text: "Üst yönetimin belirlediği hedefleri paylaşırım.", score: 50 }, { id: "d", text: "Herkesin kendi hedefini belirlemesine izin veririm.", score: 30 }] }
        ]
      },
      {
        level: 3,
        title: "İleri Seviye",
        description: "Dönüşümsel liderlik ve organizasyonel etki",
        questions: [
          { id: 1, scenario: "Şirket kültürünü değiştirmek için bir inisiyatif başlatmanız isteniyor.", options: [{ id: "a", text: "Mevcut kültürü analiz eder, paydaşlarla birlikte vizyon oluştururum.", score: 100 }, { id: "b", text: "Yukarıdan aşağı yeni kurallar belirlerim.", score: 30 }, { id: "c", text: "Pilot gruplarla başlar, sonuçları ölçerim.", score: 80 }, { id: "d", text: "Kültür değişikliğinin zor olduğunu söylerim.", score: 20 }] },
          { id: 2, scenario: "Birden fazla ekibi koordine eden bir program yönetiyorsunuz ve çatışmalar var.", options: [{ id: "a", text: "Ortak hedefleri netleştirir, düzenli alignment toplantıları yaparım.", score: 100 }, { id: "b", text: "Her ekibin kendi yoluna gitmesine izin veririm.", score: 30 }, { id: "c", text: "Çatışmaları üst yönetime taşırım.", score: 50 }, { id: "d", text: "En güçlü ekibin liderlik etmesini sağlarım.", score: 40 }] },
          { id: 3, scenario: "Yönetim kuruluna stratejik bir öneri sunacaksınız.", options: [{ id: "a", text: "Veri destekli, risk analizi içeren kapsamlı bir sunum hazırlarım.", score: 100 }, { id: "b", text: "Sadece ana noktaları özetlerim.", score: 50 }, { id: "c", text: "Teknik detaylara odaklanırım.", score: 40 }, { id: "d", text: "Başka birinin sunmasını öneririm.", score: 20 }] },
          { id: 4, scenario: "Kriz anında şirketin itibarı risk altında.", options: [{ id: "a", text: "Şeffaf iletişim stratejisi oluşturur, hızlı aksiyon alırım.", score: 100 }, { id: "b", text: "Hukuk departmanının yönlendirmesini beklerim.", score: 50 }, { id: "c", text: "Sessiz kalır, fırtınanın geçmesini beklerim.", score: 20 }, { id: "d", text: "Sosyal medyada savunmaya geçerim.", score: 30 }] },
          { id: 5, scenario: "Yeni bir iş birimi kurmanız isteniyor.", options: [{ id: "a", text: "Vizyon, strateji, kaynak planı ve başarı metrikleri oluştururum.", score: 100 }, { id: "b", text: "Mevcut ekipten insanları transfer ederim.", score: 50 }, { id: "c", text: "Dış danışman tutarım.", score: 60 }, { id: "d", text: "Başka bir liderin bu işi almasını öneririm.", score: 30 }] },
          { id: 6, scenario: "Organizasyonda silolaşma problemi var.", options: [{ id: "a", text: "Çapraz fonksiyonel projeler ve ortak hedefler tanımlarım.", score: 100 }, { id: "b", text: "Her birimin kendi işine odaklanmasını sağlarım.", score: 30 }, { id: "c", text: "Sadece üst düzey liderlerle iletişim kurarım.", score: 40 }, { id: "d", text: "Organizasyon yapısını tamamen değiştiririm.", score: 50 }] },
          { id: 7, scenario: "Büyük bir dijital dönüşüm projesinin sponsorusunuz.", options: [{ id: "a", text: "Değişim yönetimi planı yapar, tüm paydaşları dahil ederim.", score: 100 }, { id: "b", text: "Teknik ekibe bırakırım.", score: 40 }, { id: "c", text: "Dış tedarikçiye devrederim.", score: 50 }, { id: "d", text: "Pilot uygulamayla başlarım.", score: 70 }] },
          { id: 8, scenario: "Yetenek havuzunuzu uzun vadeli geliştirmek istiyorsunuz.", options: [{ id: "a", text: "Yetenek yönetimi stratejisi, mentorluk programı ve kariyer yolları oluştururum.", score: 100 }, { id: "b", text: "Sadece yüksek performanslılara odaklanırım.", score: 50 }, { id: "c", text: "Dışarıdan işe alıma yatırım yaparım.", score: 40 }, { id: "d", text: "İK'nın halletmesini beklerim.", score: 30 }] },
          { id: 9, scenario: "Şirketin ESG hedeflerini liderlik etmeniz isteniyor.", options: [{ id: "a", text: "Ölçülebilir hedefler belirler, tüm departmanları dahil ederim.", score: 100 }, { id: "b", text: "PR amaçlı aksiyonlara odaklanırım.", score: 40 }, { id: "c", text: "Dış danışmanlık firmasına devrederim.", score: 50 }, { id: "d", text: "Yasal zorunlulukları karşılarım.", score: 30 }] },
          { id: 10, scenario: "Şirketin geleceğini şekillendirecek bir strateji belirliyorsunuz.", options: [{ id: "a", text: "Trend analizi, rekabet analizi ve senaryo planlaması yaparım.", score: 100 }, { id: "b", text: "Geçmiş başarıları referans alırım.", score: 50 }, { id: "c", text: "Sektör liderlerini taklit ederim.", score: 40 }, { id: "d", text: "Yönetim kurulunun vizyonuna uyarım.", score: 60 }] }
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
    levels: [
      {
        level: 1,
        title: "Başlangıç",
        description: "Temel iletişim becerileri",
        questions: [
          { id: 1, scenario: "Bir e-posta yazarken en önemli şey nedir?", options: [{ id: "a", text: "Konu satırının açık ve net olması.", score: 100 }, { id: "b", text: "Mümkün olduğunca uzun yazılması.", score: 20 }, { id: "c", text: "Resmi dil kullanılması.", score: 50 }, { id: "d", text: "Emoji kullanılması.", score: 30 }] },
          { id: 2, scenario: "Biri sizinle konuşurken telefonunuz çaldı.", options: [{ id: "a", text: "Telefonu hemen açarım.", score: 20 }, { id: "b", text: "Telefonu sessize alır, konuşmaya devam ederim.", score: 100 }, { id: "c", text: "Kimin aradığına bakarım.", score: 50 }, { id: "d", text: "Konuşmayı keser, telefonu açarım.", score: 30 }] },
          { id: 3, scenario: "Toplantıda birinin sözünü kestiniz.", options: [{ id: "a", text: "Devam ederim, önemli bir noktam vardı.", score: 30 }, { id: "b", text: "Özür diler, sözü geri veririm.", score: 100 }, { id: "c", text: "Fark etmezden gelirim.", score: 20 }, { id: "d", text: "Toplantıdan sonra özür dilerim.", score: 60 }] },
          { id: 4, scenario: "Bir fikrinizi açıklamak istiyorsunuz.", options: [{ id: "a", text: "Örneklerle ve basit bir dille açıklarım.", score: 100 }, { id: "b", text: "Teknik jargon kullanırım.", score: 30 }, { id: "c", text: "Hızlıca geçerim.", score: 40 }, { id: "d", text: "Yazılı doküman paylaşırım.", score: 60 }] },
          { id: 5, scenario: "Karşınızdaki kişi bir şey söyledi ama tam anlamadınız.", options: [{ id: "a", text: "Anlamış gibi yaparım.", score: 20 }, { id: "b", text: "Nazikçe tekrar etmesini isterim.", score: 100 }, { id: "c", text: "Konuyu değiştiririm.", score: 30 }, { id: "d", text: "Sonra başka birine sorarım.", score: 50 }] },
          { id: 6, scenario: "Geri bildirim vermeniz gerekiyor.", options: [{ id: "a", text: "Yapıcı ve spesifik geri bildirim veririm.", score: 100 }, { id: "b", text: "Sadece olumlu şeyler söylerim.", score: 50 }, { id: "c", text: "E-posta ile yazarım.", score: 60 }, { id: "d", text: "Geri bildirim vermekten kaçınırım.", score: 20 }] },
          { id: 7, scenario: "Zor bir konuyu açıklamak zorundasınız.", options: [{ id: "a", text: "Adım adım, basit terimlerle açıklarım.", score: 100 }, { id: "b", text: "Hızlıca geçer, soru beklerim.", score: 40 }, { id: "c", text: "Sadece sonucu söylerim.", score: 50 }, { id: "d", text: "Başka birinin açıklamasını isterim.", score: 30 }] },
          { id: 8, scenario: "Birisi size eleştiri yöneltti.", options: [{ id: "a", text: "Dinler ve anlamaya çalışırım.", score: 100 }, { id: "b", text: "Hemen savunmaya geçerim.", score: 30 }, { id: "c", text: "Susarım.", score: 40 }, { id: "d", text: "Konuyu değiştiririm.", score: 20 }] },
          { id: 9, scenario: "Birden fazla kişiye mesaj göndereceksiniz.", options: [{ id: "a", text: "Her birinin ihtiyacına göre özelleştiririm.", score: 100 }, { id: "b", text: "Aynı mesajı herkese gönderirim.", score: 50 }, { id: "c", text: "Sadece en önemli kişilere yazarım.", score: 40 }, { id: "d", text: "Genel bir duyuru yaparım.", score: 60 }] },
          { id: 10, scenario: "Video konferansta bağlantı sorunları var.", options: [{ id: "a", text: "Durumu bildirip alternatif çözümler öneririm.", score: 100 }, { id: "b", text: "Toplantıdan çıkarım.", score: 30 }, { id: "c", text: "Bağlantı düzelene kadar beklerim.", score: 50 }, { id: "d", text: "Sadece yazarak iletişim kurarım.", score: 60 }] }
        ]
      },
      {
        level: 2,
        title: "Orta Seviye",
        description: "İkna ve etkili sunum becerileri",
        questions: [
          { id: 1, scenario: "Bir paydaşı fikrinize ikna etmeniz gerekiyor.", options: [{ id: "a", text: "Onun önceliklerini anlar, ona göre argüman sunarım.", score: 100 }, { id: "b", text: "Verilerle bombardıman yaparım.", score: 40 }, { id: "c", text: "Üst yönetim desteğini kullanırım.", score: 50 }, { id: "d", text: "Israr ederim.", score: 30 }] },
          { id: 2, scenario: "Sunumunuz sırasında zor sorular geldi.", options: [{ id: "a", text: "Bilmiyorsam dürüstçe söyler, sonra döneceğimi belirtirim.", score: 100 }, { id: "b", text: "Cevap uydurmaya çalışırım.", score: 20 }, { id: "c", text: "Soruyu geçiştiririm.", score: 30 }, { id: "d", text: "Başka birine yönlendiririm.", score: 50 }] },
          { id: 3, scenario: "Çatışan iki grup arasında arabuluculuk yapıyorsunuz.", options: [{ id: "a", text: "Her iki tarafı da dinler, ortak zemin bulurum.", score: 100 }, { id: "b", text: "Bir tarafı tutarım.", score: 20 }, { id: "c", text: "Üst yönetime bırakırım.", score: 40 }, { id: "d", text: "Tarafsız kalır, karışmam.", score: 50 }] },
          { id: 4, scenario: "Teknik bir konuyu üst yönetime anlatacaksınız.", options: [{ id: "a", text: "İş etkisi ve sonuçlara odaklanır, teknik detayları sadeleştiririm.", score: 100 }, { id: "b", text: "Tüm teknik detayları anlatırım.", score: 30 }, { id: "c", text: "Sadece slide paylaşırım.", score: 40 }, { id: "d", text: "Teknik ekipten birinin sunmasını isterim.", score: 50 }] },
          { id: 5, scenario: "Olumsuz haberi iletmeniz gerekiyor.", options: [{ id: "a", text: "Dürüst, empatik ve çözüm odaklı bir şekilde iletirim.", score: 100 }, { id: "b", text: "Pozitif şeylere odaklanırım.", score: 40 }, { id: "c", text: "E-posta ile gönderirim.", score: 50 }, { id: "d", text: "Başkasının iletmesini sağlarım.", score: 30 }] },
          { id: 6, scenario: "Bir müzakerede karşı taraf çok sert.", options: [{ id: "a", text: "Sakin kalır, ortak çıkarları bulmaya çalışırım.", score: 100 }, { id: "b", text: "Aynı sertlikle karşılık veririm.", score: 20 }, { id: "c", text: "Görüşmeden çekilirim.", score: 40 }, { id: "d", text: "Tüm taleplerini kabul ederim.", score: 30 }] },
          { id: 7, scenario: "Yazılı ve sözlü mesajınız çelişti.", options: [{ id: "a", text: "Düzeltme yapar, tutarlılığı sağlarım.", score: 100 }, { id: "b", text: "Fark edilmemiştir diye düşünürüm.", score: 20 }, { id: "c", text: "Sözlü olanı geçerli sayarım.", score: 40 }, { id: "d", text: "İkisinin de doğru olduğunu savunurum.", score: 30 }] },
          { id: 8, scenario: "Farklı kültürden biriyle iletişim kuruyorsunuz.", options: [{ id: "a", text: "Kültürel farklılıklara saygı gösterir, uyum sağlarım.", score: 100 }, { id: "b", text: "Kendi stilimle devam ederim.", score: 30 }, { id: "c", text: "Çevirmen kullanırım.", score: 50 }, { id: "d", text: "Yazılı iletişimi tercih ederim.", score: 60 }] },
          { id: 9, scenario: "Büyük bir toplantıyı yönetiyorsunuz.", options: [{ id: "a", text: "Gündem hazırlar, zamanı yönetir, herkesin katılımını sağlarım.", score: 100 }, { id: "b", text: "Serbest tartışmaya izin veririm.", score: 40 }, { id: "c", text: "Sadece ana konulara odaklanırım.", score: 60 }, { id: "d", text: "Başkasının yönetmesini isterim.", score: 30 }] },
          { id: 10, scenario: "Mesajınız yanlış anlaşıldı.", options: [{ id: "a", text: "Hemen açıklama yapar, yanlış anlaşılmayı düzeltirim.", score: 100 }, { id: "b", text: "Karşı tarafın anlamamasını eleştiririm.", score: 20 }, { id: "c", text: "Düzeltmem, kendi kendine anlarlar.", score: 30 }, { id: "d", text: "Üzgünüm der geçerim.", score: 50 }] }
        ]
      },
      {
        level: 3,
        title: "İleri Seviye",
        description: "Stratejik iletişim ve kriz yönetimi",
        questions: [
          { id: 1, scenario: "Şirket çapında bir kriz iletişimi yönetiyorsunuz.", options: [{ id: "a", text: "Tutarlı, şeffaf ve zamanında iletişim stratejisi uygularım.", score: 100 }, { id: "b", text: "Hukuk onay beklerim.", score: 50 }, { id: "c", text: "Minimum bilgi paylaşırım.", score: 30 }, { id: "d", text: "PR ajansına devrederim.", score: 60 }] },
          { id: 2, scenario: "CEO'ya kötü haberler içeren bir rapor sunacaksınız.", options: [{ id: "a", text: "Veri destekli, çözüm önerileri ile birlikte sunarım.", score: 100 }, { id: "b", text: "Sadece verileri paylaşırım.", score: 50 }, { id: "c", text: "Olumlu noktaları ön plana çıkarırım.", score: 40 }, { id: "d", text: "Başkasının sunmasını öneririm.", score: 30 }] },
          { id: 3, scenario: "Şirketin hikayesini medyaya anlatacaksınız.", options: [{ id: "a", text: "Özgün, tutarlı ve hedef kitleye uygun mesajlar hazırlarım.", score: 100 }, { id: "b", text: "Standart basın bülteni gönderirim.", score: 50 }, { id: "c", text: "Sadece sorulara cevap veririm.", score: 40 }, { id: "d", text: "PR ekibine bırakırım.", score: 60 }] },
          { id: 4, scenario: "Şirket içi söylentiler yayılıyor.", options: [{ id: "a", text: "Proaktif olarak doğru bilgileri paylaşırım.", score: 100 }, { id: "b", text: "Söylentilerin yayılmasını izlerim.", score: 30 }, { id: "c", text: "Söylenti çıkaranları bulmaya çalışırım.", score: 40 }, { id: "d", text: "Resmi bir açıklama beklerim.", score: 50 }] },
          { id: 5, scenario: "Yönetim kuruluna önemli bir strateji değişikliği sunuyorsunuz.", options: [{ id: "a", text: "Hikaye anlatımı, veri ve vizyon ile bütünsel bir sunum yaparım.", score: 100 }, { id: "b", text: "Sadece sayısal verilere odaklanırım.", score: 50 }, { id: "c", text: "Kısa ve öz tutarım.", score: 60 }, { id: "d", text: "Yazılı rapor gönderirim.", score: 40 }] },
          { id: 6, scenario: "Global bir ekiple çalışıyorsunuz ve zaman dilimleri sorun.", options: [{ id: "a", text: "Asenkron iletişim araçları ve dönüşümlü toplantı saatleri kullanırım.", score: 100 }, { id: "b", text: "Herkesi aynı saatte toplarım.", score: 30 }, { id: "c", text: "Sadece kendi saat dilimimde çalışırım.", score: 20 }, { id: "d", text: "Yazılı iletişime geçerim.", score: 60 }] },
          { id: 7, scenario: "Şirketin değerlerini çalışanlara aktarmak istiyorsunuz.", options: [{ id: "a", text: "Hikayeler, örnekler ve liderlik davranışlarıyla pekiştiririm.", score: 100 }, { id: "b", text: "Değerleri duvara asarım.", score: 30 }, { id: "c", text: "E-posta ile duyururum.", score: 40 }, { id: "d", text: "Oryantasyonda anlattırırım.", score: 60 }] },
          { id: 8, scenario: "Bir yatırımcı sunumu hazırlıyorsunuz.", options: [{ id: "a", text: "Finansal veriler, büyüme hikayesi ve vizyon ile dengeli bir sunum yaparım.", score: 100 }, { id: "b", text: "Sadece finansallara odaklanırım.", score: 50 }, { id: "c", text: "Ürün demosuna odaklanırım.", score: 40 }, { id: "d", text: "CFO'nun sunmasını isterim.", score: 60 }] },
          { id: 9, scenario: "Çok farklı görüşleri olan bir grubu ortak karara yönlendiriyorsunuz.", options: [{ id: "a", text: "Yapılandırılmış bir karar alma süreci tasarlarım.", score: 100 }, { id: "b", text: "Çoğunluk oylamasına giderim.", score: 50 }, { id: "c", text: "En güçlü sesi takip ederim.", score: 30 }, { id: "d", text: "Kararı ertelerim.", score: 40 }] },
          { id: 10, scenario: "Şirketin itibarını etkileyen bir sosyal medya krizi var.", options: [{ id: "a", text: "Hızlı, şeffaf ve empatik bir yanıt stratejisi uygularım.", score: 100 }, { id: "b", text: "Tüm hesapları kapatırım.", score: 20 }, { id: "c", text: "Hukuk danışmanını beklerim.", score: 50 }, { id: "d", text: "Yanıt vermem.", score: 30 }] }
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
    levels: [
      {
        level: 1,
        title: "Başlangıç",
        description: "Temel problem çözme teknikleri",
        questions: [
          { id: 1, scenario: "Bir problem karşısında ilk ne yaparsınız?", options: [{ id: "a", text: "Problemi net bir şekilde tanımlarım.", score: 100 }, { id: "b", text: "Hemen çözüm önermeye başlarım.", score: 40 }, { id: "c", text: "Başkalarına sorarım.", score: 60 }, { id: "d", text: "Bekler, kendi kendine çözülmesini umarım.", score: 20 }] },
          { id: 2, scenario: "İki çözüm seçeneği arasında karar veremiyorsunuz.", options: [{ id: "a", text: "Artı ve eksileri listeleyerek karşılaştırırım.", score: 100 }, { id: "b", text: "İlkini seçerim.", score: 40 }, { id: "c", text: "Başkasına sorarak karar veririm.", score: 60 }, { id: "d", text: "Hiçbirini seçmem.", score: 20 }] },
          { id: 3, scenario: "Bir hata yaptınız ve sonucu olumsuz etkiledi.", options: [{ id: "a", text: "Hatayı analiz eder, tekrarlamamak için önlem alırım.", score: 100 }, { id: "b", text: "Hatayı kabul etmem.", score: 20 }, { id: "c", text: "Başkalarını suçlarım.", score: 30 }, { id: "d", text: "Görmezden gelirim.", score: 40 }] },
          { id: 4, scenario: "Bir süreç yavaş işliyor.", options: [{ id: "a", text: "Darboğazları tespit ederim.", score: 100 }, { id: "b", text: "Daha fazla kaynak talep ederim.", score: 50 }, { id: "c", text: "Olduğu gibi kabullenirim.", score: 30 }, { id: "d", text: "Başka bir sürece geçerim.", score: 40 }] },
          { id: 5, scenario: "Beklenmedik bir sorunla karşılaştınız.", options: [{ id: "a", text: "Sakin kalır, bilgi toplar ve plan yaparım.", score: 100 }, { id: "b", text: "Panik yaparım.", score: 20 }, { id: "c", text: "Sorunu başkasına devrederim.", score: 50 }, { id: "d", text: "Hemen ilk aklıma geleni yaparım.", score: 40 }] },
          { id: 6, scenario: "Bir görev için yeterli zamanınız yok.", options: [{ id: "a", text: "Önceliklendirme yapıp en kritik kısımlara odaklanırım.", score: 100 }, { id: "b", text: "Kaliteden ödün veririm.", score: 40 }, { id: "c", text: "Zaman uzatma isterim.", score: 60 }, { id: "d", text: "Görevi reddederim.", score: 30 }] },
          { id: 7, scenario: "Bir veri setinde tutarsızlık fark ettiniz.", options: [{ id: "a", text: "Kaynağa inerek tutarsızlığın nedenini araştırırım.", score: 100 }, { id: "b", text: "Düzelterek devam ederim.", score: 50 }, { id: "c", text: "Görmezden gelirim.", score: 30 }, { id: "d", text: "Başka veri kaynağı bulurum.", score: 60 }] },
          { id: 8, scenario: "Bir müşteri şikayeti aldınız.", options: [{ id: "a", text: "Kök nedeni araştırır, çözüm üretirim.", score: 100 }, { id: "b", text: "Özür dilerim.", score: 50 }, { id: "c", text: "Müşteriyi yatıştırmaya çalışırım.", score: 60 }, { id: "d", text: "İlgili departmana yönlendiririm.", score: 40 }] },
          { id: 9, scenario: "Birden fazla problem aynı anda ortaya çıktı.", options: [{ id: "a", text: "Aciliyet ve önem sırasına göre önceliklendiririm.", score: 100 }, { id: "b", text: "Hepsine aynı anda el atarım.", score: 30 }, { id: "c", text: "En kolay olanla başlarım.", score: 50 }, { id: "d", text: "Yardım isterim.", score: 60 }] },
          { id: 10, scenario: "Çözümünüz işe yaramadı.", options: [{ id: "a", text: "Neden çalışmadığını analiz eder, alternatif denerim.", score: 100 }, { id: "b", text: "Aynı çözümü tekrar denerim.", score: 30 }, { id: "c", text: "Vazgeçerim.", score: 20 }, { id: "d", text: "Başkasından çözüm beklerim.", score: 40 }] }
        ]
      },
      {
        level: 2,
        title: "Orta Seviye",
        description: "Karmaşık problem analizi",
        questions: [
          { id: 1, scenario: "Çok sayıda değişkeni olan karmaşık bir problem var.", options: [{ id: "a", text: "Problemi parçalara ayırır, sistematik analiz yaparım.", score: 100 }, { id: "b", text: "En önemli değişkene odaklanırım.", score: 60 }, { id: "c", text: "Uzman yardımı alırım.", score: 50 }, { id: "d", text: "Sezgilerimle karar veririm.", score: 40 }] },
          { id: 2, scenario: "Veriler çelişkili sonuçlar gösteriyor.", options: [{ id: "a", text: "Veri kaynaklarını doğrular, metodolojileri incelerim.", score: 100 }, { id: "b", text: "En güncel veriyi kullanırım.", score: 50 }, { id: "c", text: "Ortalamasını alırım.", score: 40 }, { id: "d", text: "Başka veri kaynağı ararım.", score: 60 }] },
          { id: 3, scenario: "Bir çözüm bulmak için sınırlı bilginiz var.", options: [{ id: "a", text: "Varsayımlarımı belirler, hipotezler oluşturup test ederim.", score: 100 }, { id: "b", text: "En iyi tahmini yaparım.", score: 50 }, { id: "c", text: "Daha fazla bilgi gelene kadar beklerim.", score: 40 }, { id: "d", text: "Başkalarına danışırım.", score: 60 }] },
          { id: 4, scenario: "İki departman arasında çıkar çatışması var.", options: [{ id: "a", text: "Her iki tarafın ihtiyaçlarını anlar, kazan-kazan çözümü ararım.", score: 100 }, { id: "b", text: "Bir tarafı tutarım.", score: 30 }, { id: "c", text: "Üst yönetime bırakırım.", score: 50 }, { id: "d", text: "Çatışmadan uzak dururum.", score: 40 }] },
          { id: 5, scenario: "Mevcut süreç verimsiz ama herkes alışmış.", options: [{ id: "a", text: "Değişimin faydalarını gösterir, geçiş planı yaparım.", score: 100 }, { id: "b", text: "Direktif ile değiştiririm.", score: 40 }, { id: "c", text: "Olduğu gibi bırakırım.", score: 30 }, { id: "d", text: "Gönüllülerle pilot yaparım.", score: 70 }] },
          { id: 6, scenario: "Risk ve fırsat arasında denge kurmanız gerekiyor.", options: [{ id: "a", text: "Risk-fayda analizi yapar, bilinçli karar veririm.", score: 100 }, { id: "b", text: "Riski minimize ederim.", score: 50 }, { id: "c", text: "Fırsata odaklanırım.", score: 40 }, { id: "d", text: "Başkalarının kararını beklerim.", score: 30 }] },
          { id: 7, scenario: "Bir projede beklenmedik maliyet artışı var.", options: [{ id: "a", text: "Kök neden analizi yapar, kapsamı veya bütçeyi revize ederim.", score: 100 }, { id: "b", text: "Ek bütçe talep ederim.", score: 50 }, { id: "c", text: "Kaliteden keserim.", score: 40 }, { id: "d", text: "Projeyi durdurmayı öneririm.", score: 30 }] },
          { id: 8, scenario: "Çözümünüzün yan etkileri olabileceğinden endişelisiniz.", options: [{ id: "a", text: "Olası yan etkileri listeler, azaltma planları yaparım.", score: 100 }, { id: "b", text: "Yan etkileri göze alırım.", score: 40 }, { id: "c", text: "Başka çözüm ararım.", score: 60 }, { id: "d", text: "Karar vermekten kaçınırım.", score: 30 }] },
          { id: 9, scenario: "Teknoloji problemi mi yoksa insan faktörü mü belirsiz.", options: [{ id: "a", text: "Her iki boyutu da araştırır, verilere dayanarak karar veririm.", score: 100 }, { id: "b", text: "Teknolojiye odaklanırım.", score: 40 }, { id: "c", text: "İnsan faktörüne odaklanırım.", score: 50 }, { id: "d", text: "Tedarikçiyi sorarım.", score: 60 }] },
          { id: 10, scenario: "Geçmişte benzer bir problem çözülmüştü.", options: [{ id: "a", text: "Eski çözümü inceler, güncel duruma uyarlarım.", score: 100 }, { id: "b", text: "Aynı çözümü uygularım.", score: 50 }, { id: "c", text: "Sıfırdan başlarım.", score: 40 }, { id: "d", text: "O çözümü bulanı sorarım.", score: 60 }] }
        ]
      },
      {
        level: 3,
        title: "İleri Seviye",
        description: "Stratejik ve inovatif problem çözme",
        questions: [
          { id: 1, scenario: "Şirketin en büyük stratejik zorluğunu çözmeniz isteniyor.", options: [{ id: "a", text: "Kapsamlı analiz, paydaş görüşleri ve senaryo planlaması yaparım.", score: 100 }, { id: "b", text: "Rakiplerin ne yaptığına bakarım.", score: 50 }, { id: "c", text: "Danışmanlık firması tutarım.", score: 60 }, { id: "d", text: "Hızlı aksiyonlara odaklanırım.", score: 40 }] },
          { id: 2, scenario: "Sektörde disruptive bir değişiklik yaşanıyor.", options: [{ id: "a", text: "Değişimi fırsata çevirecek inovasyon stratejisi geliştiririm.", score: 100 }, { id: "b", text: "Mevcut işi korumaya odaklanırım.", score: 40 }, { id: "c", text: "Bekle-gör yaklaşımı uygularım.", score: 50 }, { id: "d", text: "Sektör liderleriyle işbirliği ararım.", score: 60 }] },
          { id: 3, scenario: "Birden fazla stratejik seçenek arasında karar vermeniz gerekiyor.", options: [{ id: "a", text: "Çok kriterli karar analizi ve simülasyonlar yaparım.", score: 100 }, { id: "b", text: "En düşük riskli seçeneği seçerim.", score: 50 }, { id: "c", text: "CEO'nun tercihini sorarım.", score: 40 }, { id: "d", text: "Pilot projelerle test ederim.", score: 70 }] },
          { id: 4, scenario: "Şirketin inovasyon kapasitesi yetersiz.", options: [{ id: "a", text: "İnovasyon kültürü, süreçleri ve teşvik sistemleri tasarlarım.", score: 100 }, { id: "b", text: "R&D bütçesini artırırım.", score: 50 }, { id: "c", text: "Startup satın alırım.", score: 60 }, { id: "d", text: "Dış inovasyon ortakları bulurum.", score: 70 }] },
          { id: 5, scenario: "Uzun vadeli ve kısa vadeli hedefler çatışıyor.", options: [{ id: "a", text: "Dengeli bir strateji oluşturur, tradeoff'ları netleştiririm.", score: 100 }, { id: "b", text: "Kısa vadeye öncelik veririm.", score: 40 }, { id: "c", text: "Uzun vadeye öncelik veririm.", score: 50 }, { id: "d", text: "Yönetim kuruluna danışırım.", score: 60 }] },
          { id: 6, scenario: "Sistemik bir problem organizasyonun birçok alanını etkiliyor.", options: [{ id: "a", text: "Sistemik analiz yapar, bağımlılıkları haritalandırırım.", score: 100 }, { id: "b", text: "En görünür sorunu çözerim.", score: 40 }, { id: "c", text: "Her departmana kendi alanını çözdürürüm.", score: 50 }, { id: "d", text: "Dış danışman tutarım.", score: 60 }] },
          { id: 7, scenario: "Gelecekteki belirsizlikler için hazırlık yapmanız gerekiyor.", options: [{ id: "a", text: "Senaryo planlaması ve esneklik yapıları oluştururum.", score: 100 }, { id: "b", text: "En olası senaryoya hazırlanırım.", score: 50 }, { id: "c", text: "Belirsizlik azalana kadar beklerim.", score: 30 }, { id: "d", text: "Risk sigortası alırım.", score: 40 }] },
          { id: 8, scenario: "Karar verirken etik bir ikilemle karşılaştınız.", options: [{ id: "a", text: "Etik çerçeve uygular, paydaş etkilerini değerlendiririm.", score: 100 }, { id: "b", text: "Yasal olanı yaparım.", score: 50 }, { id: "c", text: "Şirket çıkarına öncelik veririm.", score: 40 }, { id: "d", text: "Hukuk danışmanına sorarım.", score: 60 }] },
          { id: 9, scenario: "Şirket ölçeğinde bir problem kültürel kökenlere sahip.", options: [{ id: "a", text: "Kültür değişim programı tasarlar, uzun vadeli yaklaşım benimserim.", score: 100 }, { id: "b", text: "Yeni kurallar koyarım.", score: 40 }, { id: "c", text: "Liderlik ekibini değiştiririm.", score: 50 }, { id: "d", text: "Dış eğitim programı satın alırım.", score: 60 }] },
          { id: 10, scenario: "Çözümünüz işe yaramazsa ciddi sonuçları olacak.", options: [{ id: "a", text: "Kapsamlı test, pilot ve B planı ile ilerlerim.", score: 100 }, { id: "b", text: "En iyi çözümle devam ederim.", score: 40 }, { id: "c", text: "Kararı üst yönetime bırakırım.", score: 50 }, { id: "d", text: "Risk almaktan kaçınırım.", score: 30 }] }
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
    levels: [
      {
        level: 1,
        title: "Başlangıç",
        description: "Temel empati becerileri",
        questions: [
          { id: 1, scenario: "Bir iş arkadaşınız üzgün görünüyor.", options: [{ id: "a", text: "Nasıl olduğunu sorar, dinlerim.", score: 100 }, { id: "b", text: "Kendi işime odaklanırım.", score: 30 }, { id: "c", text: "Başkalarına söylerim.", score: 20 }, { id: "d", text: "Şaka yaparak neşelendirmeye çalışırım.", score: 50 }] },
          { id: 2, scenario: "Birisi size derdini anlatıyor.", options: [{ id: "a", text: "Aktif dinler, anladığımı gösteririm.", score: 100 }, { id: "b", text: "Hemen çözüm öneririm.", score: 50 }, { id: "c", text: "Kendi benzer deneyimimi anlatırım.", score: 40 }, { id: "d", text: "Konuyu değiştiririm.", score: 20 }] },
          { id: 3, scenario: "Bir toplantıda birisi yanlış bir şey söyledi.", options: [{ id: "a", text: "Nazikçe ve özel olarak düzeltirim.", score: 100 }, { id: "b", text: "Herkesin önünde düzeltirim.", score: 30 }, { id: "c", text: "Düzeltmem.", score: 40 }, { id: "d", text: "E-posta ile düzeltirim.", score: 60 }] },
          { id: 4, scenario: "Ekip arkadaşınız bir hatadan dolayı çok kötü hissediyor.", options: [{ id: "a", text: "Herkesin hata yapabileceğini söyler, destek olurum.", score: 100 }, { id: "b", text: "Hatayı analiz ederiz.", score: 60 }, { id: "c", text: "Yalnız bırakırım.", score: 30 }, { id: "d", text: "Bunun önemli olmadığını söylerim.", score: 40 }] },
          { id: 5, scenario: "Müşteri çok sinirli bir şekilde arıyor.", options: [{ id: "a", text: "Önce sakinleştirip, endişelerini anlarım.", score: 100 }, { id: "b", text: "Hemen çözüm öneririm.", score: 50 }, { id: "c", text: "Yöneticiye aktarırım.", score: 40 }, { id: "d", text: "Savunmaya geçerim.", score: 20 }] },
          { id: 6, scenario: "Birisi sizden farklı bir görüşe sahip.", options: [{ id: "a", text: "Görüşünü anlamaya çalışır, saygı gösteririm.", score: 100 }, { id: "b", text: "Kendi görüşümü savunurum.", score: 40 }, { id: "c", text: "Tartışmaktan kaçınırım.", score: 50 }, { id: "d", text: "İkna etmeye çalışırım.", score: 60 }] },
          { id: 7, scenario: "Ekipte biri sürekli sessiz kalıyor.", options: [{ id: "a", text: "Özel olarak düşüncelerini sorarım.", score: 100 }, { id: "b", text: "Toplantıda doğrudan soru sorarım.", score: 50 }, { id: "c", text: "Kendi haline bırakırım.", score: 40 }, { id: "d", text: "Neden sessiz olduğunu başkalarına sorarım.", score: 30 }] },
          { id: 8, scenario: "Birisi size kişisel bir sorununu anlattı.", options: [{ id: "a", text: "Gizli tutar, destek olurum.", score: 100 }, { id: "b", text: "Profesyonel yardım öneririm.", score: 60 }, { id: "c", text: "Konu hakkında başkalarıyla konuşurum.", score: 20 }, { id: "d", text: "Konuyu hızlıca kapatırım.", score: 30 }] },
          { id: 9, scenario: "Ekip arkadaşınızın iş yükü çok ağır.", options: [{ id: "a", text: "Yardım teklif eder veya iş dağılımını gözden geçiririm.", score: 100 }, { id: "b", text: "Yöneticiye söylerim.", score: 50 }, { id: "c", text: "Herkesin yoğun olduğunu söylerim.", score: 30 }, { id: "d", text: "Kendi işime odaklanırım.", score: 40 }] },
          { id: 10, scenario: "Birisi size teşekkür etti.", options: [{ id: "a", text: "İçten bir şekilde karşılık veririm.", score: 100 }, { id: "b", text: "Önemsemem, geçiştiririm.", score: 40 }, { id: "c", text: "Sadece görevimi yaptığımı söylerim.", score: 60 }, { id: "d", text: "Başka konuya geçerim.", score: 30 }] }
        ]
      },
      {
        level: 2,
        title: "Orta Seviye",
        description: "Derinlemesine empati ve duygusal zeka",
        questions: [
          { id: 1, scenario: "Ekip üyesi kişisel sorunlardan dolayı performansı düştü.", options: [{ id: "a", text: "Özel görüşme yapar, esnek çözümler sunarım.", score: 100 }, { id: "b", text: "Performans değerlendirmesi yaparım.", score: 40 }, { id: "c", text: "İK'ya yönlendiririm.", score: 50 }, { id: "d", text: "Herkesin eşit davranması gerektiğini söylerim.", score: 30 }] },
          { id: 2, scenario: "Reorganizasyon sonrası ekip morali düşük.", options: [{ id: "a", text: "Endişeleri dinler, şeffaf bilgi paylaşır, destek olurum.", score: 100 }, { id: "b", text: "Değişimin iyi olduğunu vurgularım.", score: 40 }, { id: "c", text: "Normale dönmelerini beklerim.", score: 30 }, { id: "d", text: "Ekip etkinliği düzenlerim.", score: 60 }] },
          { id: 3, scenario: "Birisi sizinle çatışma yaşadıktan sonra uzak duruyor.", options: [{ id: "a", text: "İlk adımı atıp barışma girişiminde bulunurum.", score: 100 }, { id: "b", text: "Onun yaklaşmasını beklerim.", score: 40 }, { id: "c", text: "Normal davranmaya devam ederim.", score: 50 }, { id: "d", text: "Üçüncü bir kişiden aracılık isterim.", score: 60 }] },
          { id: 4, scenario: "Farklı kültürden bir meslektaşınız yanlış anlaşıldı.", options: [{ id: "a", text: "Kültürel bağlamı açıklar, köprü olurum.", score: 100 }, { id: "b", text: "Herkesin adapte olması gerektiğini söylerim.", score: 30 }, { id: "c", text: "Durumu görmezden gelirim.", score: 40 }, { id: "d", text: "İK'ya bildiririm.", score: 50 }] },
          { id: 5, scenario: "Bir çalışan sürekli negatif enerji yayıyor.", options: [{ id: "a", text: "Altında yatan nedenleri anlamaya çalışırım.", score: 100 }, { id: "b", text: "Davranışını değiştirmesini söylerim.", score: 40 }, { id: "c", text: "Takımdan uzaklaştırırım.", score: 30 }, { id: "d", text: "Yöneticiye raporlarım.", score: 50 }] },
          { id: 6, scenario: "Müşteri çok duygusal bir geri bildirim verdi.", options: [{ id: "a", text: "Duygularını kabul eder, empatiyle yaklaşırım.", score: 100 }, { id: "b", text: "Mantıklı açıklamalar yaparım.", score: 40 }, { id: "c", text: "Yazılı yanıt veririm.", score: 50 }, { id: "d", text: "Üst yönetime aktarırım.", score: 60 }] },
          { id: 7, scenario: "Terfi edememiş bir çalışan hayal kırıklığına uğramış.", options: [{ id: "a", text: "Hayal kırıklığını kabul eder, gelişim yolu sunarım.", score: 100 }, { id: "b", text: "Kararın doğru olduğunu savunurum.", score: 40 }, { id: "c", text: "Gelecek sefere odaklanmasını söylerim.", score: 50 }, { id: "d", text: "Başka fırsatlar öneririm.", score: 60 }] },
          { id: 8, scenario: "Ekip içinde görünmez hisseden bir çalışan var.", options: [{ id: "a", text: "Katkılarını fark eder, görünür kılarım.", score: 100 }, { id: "b", text: "Daha fazla inisiyatif almasını söylerim.", score: 40 }, { id: "c", text: "Performans değerlendirmesinde ele alırım.", score: 50 }, { id: "d", text: "Herkesin eşit olduğunu söylerim.", score: 30 }] },
          { id: 9, scenario: "İş-yaşam dengesinde zorlanan bir çalışan var.", options: [{ id: "a", text: "Esnek çalışma seçenekleri sunar, desteklerim.", score: 100 }, { id: "b", text: "Herkesin aynı koşullarda olduğunu söylerim.", score: 30 }, { id: "c", text: "İş yükünü azaltırım.", score: 60 }, { id: "d", text: "İK politikalarına yönlendiririm.", score: 50 }] },
          { id: 10, scenario: "Birisi size güvenerek hata itiraf etti.", options: [{ id: "a", text: "Güvenine saygı duyar, çözüme odaklanırım.", score: 100 }, { id: "b", text: "Hatanın ciddi olduğunu söylerim.", score: 40 }, { id: "c", text: "Raporlarım.", score: 30 }, { id: "d", text: "Bir daha olmamasını tembihlerim.", score: 50 }] }
        ]
      },
      {
        level: 3,
        title: "İleri Seviye",
        description: "Organizasyonel empati ve kapsayıcılık",
        questions: [
          { id: 1, scenario: "Şirket genelinde çeşitlilik ve kapsayıcılık girişimi başlatıyorsunuz.", options: [{ id: "a", text: "Farklı grupların sesini duyar, sistematik değişim yaparım.", score: 100 }, { id: "b", text: "Eğitim programları düzenlerim.", score: 60 }, { id: "c", text: "Çeşitlilik hedefleri koyarım.", score: 50 }, { id: "d", text: "D&I uzmanı işe alırım.", score: 70 }] },
          { id: 2, scenario: "Bir departman diğerleri tarafından dışlanmış hissediyor.", options: [{ id: "a", text: "Kök nedenleri araştırır, entegrasyon fırsatları yaratırım.", score: 100 }, { id: "b", text: "Ortak projeler başlatırım.", score: 70 }, { id: "c", text: "Üst yönetime raporlarım.", score: 50 }, { id: "d", text: "Durumu kabul edilebilir bulurum.", score: 30 }] },
          { id: 3, scenario: "İşten çıkarmalar yapılacak ve siz iletişimden sorumlusunuz.", options: [{ id: "a", text: "İnsan odaklı, şeffaf ve destekleyici bir süreç tasarlarım.", score: 100 }, { id: "b", text: "Hukuki gerekliliklere uyarım.", score: 50 }, { id: "c", text: "Hızlı ve acısız yaparım.", score: 40 }, { id: "d", text: "İK'ya bırakırım.", score: 60 }] },
          { id: 4, scenario: "Çalışan bağlılığı anketleri düşük sonuçlar gösteriyor.", options: [{ id: "a", text: "Derinlemesine görüşmeler yapıp, aksiyon planı oluştururum.", score: 100 }, { id: "b", text: "Daha fazla etkinlik düzenlerim.", score: 50 }, { id: "c", text: "Yöneticileri sorumlu tutarım.", score: 60 }, { id: "d", text: "Anketi revize ederim.", score: 40 }] },
          { id: 5, scenario: "Uzaktan ve ofiste çalışanlar arasında uçurum oluştu.", options: [{ id: "a", text: "Her iki grubun ihtiyaçlarını anlar, kapsayıcı pratikler geliştiririm.", score: 100 }, { id: "b", text: "Herkesi ofise çağırırım.", score: 30 }, { id: "c", text: "Daha fazla video toplantı yaparım.", score: 50 }, { id: "d", text: "Zaman içinde düzeleceğini düşünürüm.", score: 40 }] },
          { id: 6, scenario: "Yeni nesil çalışanların beklentileri farklı.", options: [{ id: "a", text: "Beklentileri anlar, çalışma modelini evrimleştiririm.", score: 100 }, { id: "b", text: "Şirket kurallarına uyum beklerim.", score: 40 }, { id: "c", text: "Ayrı programlar oluştururum.", score: 50 }, { id: "d", text: "Araştırma yaptırırım.", score: 60 }] },
          { id: 7, scenario: "Bir lider empati eksikliğiyle suçlanıyor.", options: [{ id: "a", text: "360 derece geri bildirim ve koçluk sağlarım.", score: 100 }, { id: "b", text: "Uyarı veririm.", score: 50 }, { id: "c", text: "Rol değişikliği öneririm.", score: 60 }, { id: "d", text: "Şikayetlerin temelsiz olduğunu savunurum.", score: 30 }] },
          { id: 8, scenario: "Şirket birleşmesi sonrası kültür çatışması var.", options: [{ id: "a", text: "Her iki kültürün güçlü yanlarını harmanlayan yeni kültür yaratırım.", score: 100 }, { id: "b", text: "Ana şirket kültürünü uygularım.", score: 40 }, { id: "c", text: "Zamanla karışacağını beklerim.", score: 50 }, { id: "d", text: "Kültür danışmanı tutarım.", score: 60 }] },
          { id: 9, scenario: "Toplumsal bir olaydan etkilenen çalışanlar var.", options: [{ id: "a", text: "Güvenli alan yaratır, destek kaynakları sunarım.", score: 100 }, { id: "b", text: "İş dışı konulara karışmam.", score: 30 }, { id: "c", text: "Resmi açıklama yaparım.", score: 50 }, { id: "d", text: "EAP programına yönlendiririm.", score: 60 }] },
          { id: 10, scenario: "Organizasyonda psikolojik güvenlik eksik.", options: [{ id: "a", text: "Liderlik davranışlarını değiştirir, güvenli ortam modeli oluştururum.", score: 100 }, { id: "b", text: "Anonim geri bildirim kanalları açarım.", score: 60 }, { id: "c", text: "Eğitimler düzenlerim.", score: 50 }, { id: "d", text: "Performans değerlendirmelerine eklerim.", score: 40 }] }
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
    levels: [
      {
        level: 1,
        title: "Başlangıç",
        description: "Temel uyum becerileri",
        questions: [
          { id: 1, scenario: "İş yerinizde yeni bir sistem kullanılmaya başlandı.", options: [{ id: "a", text: "Öğrenmeye açık olurum, denemeye başlarım.", score: 100 }, { id: "b", text: "Eski sistemi kullanmaya devam ederim.", score: 30 }, { id: "c", text: "Birisinin öğretmesini beklerim.", score: 50 }, { id: "d", text: "Şikayet ederim.", score: 20 }] },
          { id: 2, scenario: "Planlarınız son dakika değişti.", options: [{ id: "a", text: "Esnek olurum, yeni plana adapte olurum.", score: 100 }, { id: "b", text: "Rahatsız olurum ama uyarım.", score: 60 }, { id: "c", text: "Eski plana devam ederim.", score: 30 }, { id: "d", text: "Değişikliğe itiraz ederim.", score: 40 }] },
          { id: 3, scenario: "Yeni bir ekip üyesiyle çalışmaya başladınız.", options: [{ id: "a", text: "Çalışma tarzını öğrenir, uyum sağlarım.", score: 100 }, { id: "b", text: "Benim tarzıma uymasını beklerim.", score: 40 }, { id: "c", text: "Ayrı çalışırız.", score: 50 }, { id: "d", text: "Yöneticiden rehberlik isterim.", score: 60 }] },
          { id: 4, scenario: "Beklenmedik bir görev verildi.", options: [{ id: "a", text: "Esnek davranır, üstlenirim.", score: 100 }, { id: "b", text: "Mevcut görevlerimi öne sürerim.", score: 50 }, { id: "c", text: "Reddetmeye çalışırım.", score: 30 }, { id: "d", text: "Nasıl yapacağımı sorarım.", score: 60 }] },
          { id: 5, scenario: "Ofisten evden çalışmaya geçtiniz.", options: [{ id: "a", text: "Ev düzenimi oluşturur, adapte olurum.", score: 100 }, { id: "b", text: "Ofise dönmek isterim.", score: 40 }, { id: "c", text: "Zorlanırım ama denerim.", score: 60 }, { id: "d", text: "Verimim düşer.", score: 30 }] },
          { id: 6, scenario: "Bir projenin kapsamı genişledi.", options: [{ id: "a", text: "Yeni gereksinimleri değerlendirir, planı güncelerim.", score: 100 }, { id: "b", text: "Orijinal kapsamda kalırım.", score: 40 }, { id: "c", text: "Ek kaynak isterim.", score: 60 }, { id: "d", text: "İtiraz ederim.", score: 30 }] },
          { id: 7, scenario: "Takım lideriniz değişti.", options: [{ id: "a", text: "Yeni liderin tarzını anlamaya çalışırım.", score: 100 }, { id: "b", text: "Eski yöntemlerle devam ederim.", score: 40 }, { id: "c", text: "Karşılaştırma yaparım.", score: 30 }, { id: "d", text: "Görüşlerimi bildiririm.", score: 60 }] },
          { id: 8, scenario: "Kullanılan araç değişti.", options: [{ id: "a", text: "Yeni aracı öğrenmeye zaman ayırırım.", score: 100 }, { id: "b", text: "Eski aracı kullanmaya devam ederim.", score: 30 }, { id: "c", text: "Birinin öğretmesini beklerim.", score: 50 }, { id: "d", text: "Değişiklikten şikayet ederim.", score: 20 }] },
          { id: 9, scenario: "İş süreçleri yeniden tasarlandı.", options: [{ id: "a", text: "Yeni süreçleri takip eder, geri bildirim veririm.", score: 100 }, { id: "b", text: "Eski süreçlerle devam ederim.", score: 30 }, { id: "c", text: "Değişimin gereksiz olduğunu düşünürüm.", score: 40 }, { id: "d", text: "Uyum sağlamakta zorlanırım.", score: 50 }] },
          { id: 10, scenario: "Farklı bir projede görevlendirildiniz.", options: [{ id: "a", text: "Fırsat olarak görür, hızlıca adapte olurum.", score: 100 }, { id: "b", text: "Mevcut projeme geri dönmek isterim.", score: 40 }, { id: "c", text: "Zorlanırım ama denerim.", score: 60 }, { id: "d", text: "Neden seçildiğimi sorgularım.", score: 30 }] }
        ]
      },
      {
        level: 2,
        title: "Orta Seviye",
        description: "Proaktif değişim yönetimi",
        questions: [
          { id: 1, scenario: "Sektörde önemli bir teknolojik değişim yaşanıyor.", options: [{ id: "a", text: "Proaktif olarak öğrenir, ekibimi de hazırlarım.", score: 100 }, { id: "b", text: "Zorunlu olana kadar beklerim.", score: 40 }, { id: "c", text: "Başkalarının öncülük etmesini beklerim.", score: 50 }, { id: "d", text: "Değişimin gerekli olmadığını savunurum.", score: 30 }] },
          { id: 2, scenario: "Organizasyon yapısı değişti ve rolünüz belirsiz.", options: [{ id: "a", text: "Netlik ararım, geçici belirsizliğe uyum sağlarım.", score: 100 }, { id: "b", text: "Eski rolümü sürdürürüm.", score: 40 }, { id: "c", text: "Net bir tanım gelene kadar beklerim.", score: 50 }, { id: "d", text: "Yönetimi sorgularım.", score: 30 }] },
          { id: 3, scenario: "Müşteri beklentileri hızla değişiyor.", options: [{ id: "a", text: "Müşteri sesini dinler, hızla adapte olurum.", score: 100 }, { id: "b", text: "Mevcut ürün/hizmetle devam ederim.", score: 40 }, { id: "c", text: "Araştırma yaparım.", score: 60 }, { id: "d", text: "Satış ekibine bırakırım.", score: 50 }] },
          { id: 4, scenario: "Yeni bir metodoloji uygulanacak.", options: [{ id: "a", text: "Öğrenir, ekibe öncülük ederim.", score: 100 }, { id: "b", text: "Eskisiyle devam ederim.", score: 40 }, { id: "c", text: "Pilot olarak katılırım.", score: 70 }, { id: "d", text: "Eğitim beklerim.", score: 50 }] },
          { id: 5, scenario: "Birden fazla değişiklik aynı anda oluyor.", options: [{ id: "a", text: "Öncelik belirler, adım adım adapte olurum.", score: 100 }, { id: "b", text: "Bunalırım.", score: 40 }, { id: "c", text: "En önemli olana odaklanırım.", score: 70 }, { id: "d", text: "Değişiklikleri sorgunarım.", score: 30 }] },
          { id: 6, scenario: "Çalıştığınız departman birleştirildi.", options: [{ id: "a", text: "Yeni yapıya ve ekibe uyum sağlarım.", score: 100 }, { id: "b", text: "Eski kimliğimi korumaya çalışırım.", score: 40 }, { id: "c", text: "Başka departmana geçmeye çalışırım.", score: 50 }, { id: "d", text: "Birleşmenin kötü olduğunu düşünürüm.", score: 30 }] },
          { id: 7, scenario: "Bir başarısızlıktan sonra tekrar denemeniz gerekiyor.", options: [{ id: "a", text: "Dersleri çıkarır, farklı yaklaşımla denerim.", score: 100 }, { id: "b", text: "Aynı şekilde tekrar denerim.", score: 40 }, { id: "c", text: "Vazgeçerim.", score: 30 }, { id: "d", text: "Başkasının denemesini öneririm.", score: 50 }] },
          { id: 8, scenario: "Farklı kültürdeki bir ofisle çalışacaksınız.", options: [{ id: "a", text: "Kültürel farkları öğrenir, iletişimimi adapte ederim.", score: 100 }, { id: "b", text: "Kendi tarzımla devam ederim.", score: 30 }, { id: "c", text: "Çevirmen/arabulucu kullanırım.", score: 50 }, { id: "d", text: "Minimum etkileşimle geçiştiririm.", score: 40 }] },
          { id: 9, scenario: "Piyasa koşulları stratejinizi değiştirmenizi gerektiriyor.", options: [{ id: "a", text: "Hızlıca analiz yapar, strateji revize ederim.", score: 100 }, { id: "b", text: "Mevcut stratejiyle devam ederim.", score: 40 }, { id: "c", text: "Üst yönetimin kararını beklerim.", score: 50 }, { id: "d", text: "Rakipleri izlerim.", score: 60 }] },
          { id: 10, scenario: "Alışık olmadığınız bir alanda sorumluluk aldınız.", options: [{ id: "a", text: "Hızlıca öğrenir, uzman desteği alırım.", score: 100 }, { id: "b", text: "Bildiğim şekilde yaparım.", score: 40 }, { id: "c", text: "Görevi devretmeye çalışırım.", score: 30 }, { id: "d", text: "Başarısız olmaktan korkarım.", score: 50 }] }
        ]
      },
      {
        level: 3,
        title: "İleri Seviye",
        description: "Dönüşüm liderliği ve organizasyonel çeviklik",
        questions: [
          { id: 1, scenario: "Şirket çapında dijital dönüşüm liderlik ediyorsunuz.", options: [{ id: "a", text: "Vizyon oluşturur, değişim yönetimi ve kültür dönüşümü yaparım.", score: 100 }, { id: "b", text: "Teknoloji satın alır, uygularım.", score: 50 }, { id: "c", text: "Dış danışmanlık firmasına bırakırım.", score: 60 }, { id: "d", text: "Pilot projelerle başlarım.", score: 70 }] },
          { id: 2, scenario: "İş modeliniz geçerliliğini yitiriyor.", options: [{ id: "a", text: "Proaktif olarak yeni iş modelleri araştırır, pivot yaparım.", score: 100 }, { id: "b", text: "Mevcut modeli optimize ederim.", score: 50 }, { id: "c", text: "Pazarın değişmesini beklerim.", score: 30 }, { id: "d", text: "Stratejik danışman tutarım.", score: 60 }] },
          { id: 3, scenario: "Organizasyonu çevik (agile) yapıya dönüştürüyorsunuz.", options: [{ id: "a", text: "Kültür, süreç ve yapıyı bütünsel olarak dönüştürürüm.", score: 100 }, { id: "b", text: "Sadece IT'de uygularım.", score: 50 }, { id: "c", text: "Agile eğitimleri veririm.", score: 60 }, { id: "d", text: "Scrum master işe alırım.", score: 70 }] },
          { id: 4, scenario: "Büyük bir krizde hızlı karar vermek zorundasınız.", options: [{ id: "a", text: "Mevcut bilgiyle en iyi kararı vererek ilerlerin, esneklik korurumu.", score: 100 }, { id: "b", text: "Daha fazla bilgi beklerim.", score: 40 }, { id: "c", text: "Komite kararı beklerim.", score: 50 }, { id: "d", text: "Risk almaktan kaçınırım.", score: 30 }] },
          { id: 5, scenario: "Yeni nesil teknolojileri (AI, blockchain vb.) şirkete entegre ediyorsunuz.", options: [{ id: "a", text: "Stratejik değerlendirme, pilot ve ölçeklendirme planı yaparım.", score: 100 }, { id: "b", text: "Trend olduğu için uygularım.", score: 40 }, { id: "c", text: "Bekle-gör yaklaşımı izlerim.", score: 50 }, { id: "d", text: "Teknoloji ekibine bırakırım.", score: 60 }] },
          { id: 6, scenario: "Şirket kültürü değişime dirençli.", options: [{ id: "a", text: "Direnç noktalarını anlar, katılımcı değişim süreci tasarlarım.", score: 100 }, { id: "b", text: "Yukarıdan aşağı değişim uygularım.", score: 40 }, { id: "c", text: "Direnç gösterenleri değiştiririm.", score: 30 }, { id: "d", text: "Değişimi yavaşlatırım.", score: 50 }] },
          { id: 7, scenario: "Pandemi gibi beklenmedik bir olay iş modelinizi altüst etti.", options: [{ id: "a", text: "Hızla adapte olur, yeni fırsatlar yaratırım.", score: 100 }, { id: "b", text: "Normale dönene kadar beklerim.", score: 40 }, { id: "c", text: "Minimum değişiklikle geçiştiririm.", score: 50 }, { id: "d", text: "Devlet desteği beklerim.", score: 30 }] },
          { id: 8, scenario: "Birden fazla dönüşüm projesini aynı anda yönetiyorsunuz.", options: [{ id: "a", text: "Bağımlılıkları yönetir, sinerji yaratırım.", score: 100 }, { id: "b", text: "Her projeyi ayrı ayrı yönetirim.", score: 50 }, { id: "c", text: "Projeleri sıralı yaparım.", score: 60 }, { id: "d", text: "Program yöneticisi atarım.", score: 70 }] },
          { id: 9, scenario: "Gelecek 10 yıl için organizasyonu hazırlıyorsunuz.", options: [{ id: "a", text: "Trend analizi, senaryo planlaması ve öğrenen organizasyon yapısı kurarım.", score: 100 }, { id: "b", text: "Mevcut güçlü yönlere yatırım yaparım.", score: 50 }, { id: "c", text: "Rekabeti takip ederim.", score: 40 }, { id: "d", text: "Danışmanlık raporu hazırlattırırım.", score: 60 }] },
          { id: 10, scenario: "Değişim yorgunluğu yaşayan bir organizasyonu yönetiyorsunuz.", options: [{ id: "a", text: "Değişim hızını ayarlar, başarıları kutlar, destek sağlarım.", score: 100 }, { id: "b", text: "Değişime devam ederim.", score: 40 }, { id: "c", text: "Değişimi durdurum.", score: 50 }, { id: "d", text: "Daha fazla iletişim yaparım.", score: 60 }] }
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
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [createdQuestTitle, setCreatedQuestTitle] = useState<string | null>(null);

  const { data: previousResults = [] } = useQuery<AssessmentResult[]>({
    queryKey: ["/api/assessments"],
    enabled: isAuthenticated,
  });

  const saveResultMutation = useMutation({
    mutationFn: async (data: { assessmentType: string; level: number; score: number; feedback: string }) => {
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

  if (!isAuthenticated) return null;

  const getMaxUnlockedLevel = (typeId: string): number => {
    const typeResults = previousResults.filter(r => r.assessmentType === typeId);
    if (typeResults.length === 0) return 1;
    
    const sortedByLevel = [...typeResults].sort((a, b) => b.level - a.level);
    for (const result of sortedByLevel) {
      if (result.score >= 70) {
        return Math.min(result.level + 1, 3);
      }
    }
    return sortedByLevel[0]?.level || 1;
  };

  const getLevelResult = (typeId: string, level: number): AssessmentResult | undefined => {
    return previousResults.find(r => r.assessmentType === typeId && r.level === level);
  };

  const handleSelectType = (type: AssessmentType) => {
    setSelectedType(type);
    setSelectedLevel(1);
    setStarted(false);
    setCurrentQuestion(0);
    setCompleted(false);
    setAnswers({});
    setScore(0);
    setCreatedQuestTitle(null);
  };

  const handleSelectLevel = (level: number) => {
    if (!selectedType) return;
    const maxUnlocked = getMaxUnlockedLevel(selectedType.id);
    if (level <= maxUnlocked) {
      setSelectedLevel(level);
      setCurrentQuestion(0);
      setAnswers({});
      setScore(0);
      setCompleted(false);
      setStarted(false);
      setCreatedQuestTitle(null);
    }
  };

  const handleStart = () => setStarted(true);

  const handleNext = () => {
    if (!selectedType) return;
    const levelData = selectedType.levels.find(l => l.level === selectedLevel);
    if (!levelData) return;

    if (currentQuestion < levelData.questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
    } else {
      let totalScore = 0;
      levelData.questions.forEach((q, idx) => {
        const answerId = answers[idx];
        const option = q.options.find(o => o.id === answerId);
        if (option) totalScore += option.score;
      });
      const avgScore = Math.round(totalScore / levelData.questions.length);
      setScore(avgScore);
      setCompleted(true);

      const feedback = avgScore >= 80 
        ? "Mükemmel performans! Bu seviyeyi başarıyla tamamladınız."
        : avgScore >= 70
        ? "İyi bir seviyedesiniz. Bir sonraki seviyeye geçebilirsiniz."
        : "Bu seviyede daha fazla pratik yapmanız önerilir.";

      saveResultMutation.mutate({
        assessmentType: selectedType.id,
        level: selectedLevel,
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
    setCreatedQuestTitle(null);
  };

  const levelData = selectedType?.levels.find(l => l.level === selectedLevel);
  const progress = levelData 
    ? ((currentQuestion + (completed ? 1 : 0)) / levelData.questions.length) * 100 
    : 0;

  if (!selectedType) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-heading font-bold">Sosyal Beceri Değerlendirmeleri</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Her beceri için 3 seviye bulunmaktadır. Bir seviyeyi %70 ve üzeri tamamladığınızda bir sonraki seviye açılır.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentTypes.map((type) => {
            const maxUnlocked = getMaxUnlockedLevel(type.id);
            const completedLevels = type.levels.filter(l => {
              const result = getLevelResult(type.id, l.level);
              return result && result.score >= 70;
            }).length;

            return (
              <Card 
                key={type.id} 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/30"
                onClick={() => handleSelectType(type)}
                data-testid={`assessment-card-${type.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`size-10 rounded-lg ${type.bgColor} ${type.color} flex items-center justify-center`}>
                      {type.icon}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(level => {
                        const result = getLevelResult(type.id, level);
                        const isCompleted = result && result.score >= 70;
                        const isUnlocked = level <= maxUnlocked;
                        return (
                          <div 
                            key={level}
                            className={`size-6 rounded-full flex items-center justify-center text-xs ${
                              isCompleted 
                                ? 'bg-green-500 text-white' 
                                : isUnlocked 
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="size-3" /> : isUnlocked ? level : <Lock className="size-3" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                    <span>{completedLevels}/3 seviye tamamlandı</span>
                    <span>Her seviye 10 soru</span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (!started) {
    const maxUnlocked = getMaxUnlockedLevel(selectedType.id);

    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4" data-testid="button-back">
          <ArrowLeft className="mr-2 size-4" />
          Geri
        </Button>

        <div className="text-center space-y-4">
          <Badge className={`${selectedType.bgColor} ${selectedType.color} hover:${selectedType.bgColor} border-0 px-3 py-1 text-sm`}>
            {selectedType.title}
          </Badge>
          <h1 className="text-3xl font-heading font-bold">{selectedType.title} Değerlendirmesi</h1>
          <p className="text-muted-foreground">{selectedType.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {selectedType.levels.map((level) => {
            const isUnlocked = level.level <= maxUnlocked;
            const result = getLevelResult(selectedType.id, level.level);
            const isCompleted = result && result.score >= 70;

            return (
              <Card 
                key={level.level}
                className={`cursor-pointer transition-all ${
                  selectedLevel === level.level ? 'border-primary ring-2 ring-primary/20' : ''
                } ${!isUnlocked ? 'opacity-60' : 'hover:shadow-lg'}`}
                onClick={() => handleSelectLevel(level.level)}
                data-testid={`level-card-${level.level}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`size-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : isUnlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="size-5" /> : isUnlocked ? <Star className="size-5" /> : <Lock className="size-5" />}
                    </div>
                    {result && (
                      <Badge variant={result.score >= 70 ? "default" : "secondary"}>
                        %{result.score}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">Seviye {level.level}: {level.title}</CardTitle>
                  <CardDescription>{level.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{level.questions.length} soru</p>
                  {!isUnlocked && (
                    <p className="text-xs text-amber-600 mt-2">Önceki seviyeyi %70+ ile tamamlayın</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {maxUnlocked >= selectedLevel && (
          <div className="flex justify-center">
            <Button size="lg" onClick={handleStart} className="h-12 px-8 text-base" data-testid="button-start">
              Seviye {selectedLevel}'i Başlat
              <ChevronRight className="ml-2 size-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (completed && levelData) {
    const passedLevel = score >= 70;
    const nextLevelUnlocked = passedLevel && selectedLevel < 3;

    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className={`size-20 ${passedLevel ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Award className="size-10" />
          </div>
          <h2 className="text-3xl font-heading font-bold">
            {passedLevel ? "Seviye Tamamlandı!" : "Tekrar Deneyin"}
          </h2>
          <p className="text-muted-foreground">
            {selectedType.title} - Seviye {selectedLevel}: {levelData.title}
          </p>
        </div>

        <Card className={`${passedLevel ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Skorunuz</span>
              <span className={`text-2xl font-bold ${passedLevel ? 'text-green-700' : 'text-orange-700'}`}>
                {score}/100
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={score} className="h-3" />
            <p className="text-sm leading-relaxed">
              {passedLevel 
                ? nextLevelUnlocked 
                  ? `Tebrikler! Seviye ${selectedLevel + 1} artık açıldı.`
                  : "Mükemmel! Tüm seviyeleri tamamladınız."
                : "Bu seviyeyi geçmek için %70 ve üzeri skor almanız gerekiyor."
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
                  <p className="font-medium">Yeni Görev Eklendi!</p>
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
          {!passedLevel && (
            <Button variant="outline" onClick={() => {
              setStarted(false);
              setCurrentQuestion(0);
              setAnswers({});
              setCompleted(false);
              setScore(0);
            }} data-testid="button-retry">
              <RefreshCw className="mr-2 size-4" />
              Tekrar Dene
            </Button>
          )}
          {nextLevelUnlocked && (
            <Button onClick={() => {
              setSelectedLevel(selectedLevel + 1);
              setStarted(false);
              setCurrentQuestion(0);
              setAnswers({});
              setCompleted(false);
              setScore(0);
              setCreatedQuestTitle(null);
            }} data-testid="button-next-level">
              Seviye {selectedLevel + 1}'e Geç
              <ChevronRight className="ml-2 size-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={handleBack} data-testid="button-back-to-list">
            <ArrowLeft className="mr-2 size-4" />
            Değerlendirmelere Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!levelData) return null;
  const currentQ = levelData.questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStarted(false)} data-testid="button-exit">
          <ArrowLeft className="mr-2 size-4" />
          Çık
        </Button>
        <Badge variant="outline">{selectedType.title} - Seviye {selectedLevel}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Soru {currentQuestion + 1} / {levelData.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">{currentQ.scenario}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion] || ""}
            onValueChange={(value) => setAnswers({ ...answers, [currentQuestion]: value })}
            className="space-y-4"
          >
            {currentQ.options.map((option) => (
              <div 
                key={option.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  answers[currentQuestion] === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setAnswers({ ...answers, [currentQuestion]: option.id })}
              >
                <RadioGroupItem value={option.id} id={`option-${option.id}`} className="mt-1" />
                <Label htmlFor={`option-${option.id}`} className="cursor-pointer flex-1 leading-relaxed">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            data-testid="button-next"
          >
            {currentQuestion < levelData.questions.length - 1 ? (
              <>
                Sonraki Soru
                <ChevronRight className="ml-2 size-4" />
              </>
            ) : (
              <>
                Değerlendirmeyi Tamamla
                <CheckCircle2 className="ml-2 size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
