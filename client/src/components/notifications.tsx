import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Trophy, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export function Notifications() {
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    {
      id: 1,
      title: "Serini kaybetme!",
      message: "Bugün bir görev tamamlamadın. 3 günlük serini canlı tutmak için giriş yap.",
      time: "2 saat önce",
      type: "streak",
      unread: true
    },
    {
      id: 2,
      title: "Yeni Görev Mevcut",
      message: "Yol haritana 'CSS Grid'de Ustalaşma' adlı yeni bir görev eklendi.",
      time: "5 saat önce",
      type: "quest",
      unread: true
    },
    {
      id: 3,
      title: "Seviye Atladın!",
      message: "Tebrikler! Seviye 5'e ulaştın. Yeni rozetine göz at.",
      time: "1 gün önce",
      type: "achievement",
      unread: true
    },
    {
      id: 4,
      title: "Sistem Güncellemesi",
      message: "Daha iyi doğruluk için iş analizi algoritmasını geliştirdik.",
      time: "2 gün önce",
      type: "system",
      unread: false
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setUnreadCount(0)}
        >
          <Bell className="size-5 text-muted-foreground hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 flex items-center justify-between">
          <h4 className="font-semibold leading-none">Bildirimler</h4>
          <span className="text-xs text-muted-foreground">Tümünü okundu işaretle</span>
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${notification.unread ? 'bg-primary/5' : ''}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-1 p-1.5 rounded-full shrink-0 ${
                    notification.type === 'streak' ? 'bg-orange-100 text-orange-600' :
                    notification.type === 'quest' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'achievement' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {notification.type === 'streak' ? <Calendar className="size-3" /> :
                     notification.type === 'achievement' ? <Trophy className="size-3" /> :
                     <Bell className="size-3" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground pt-1">{notification.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs h-8 gap-1">
            Tüm bildirimleri gör
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
