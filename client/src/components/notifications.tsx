import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Trophy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
  unread: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
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
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
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
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
              data-testid="button-mark-all-read"
            >
              <Check className="size-3 mr-1" />
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Bildirim yok
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${notification.unread ? 'bg-primary/5' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                  data-testid={`notification-item-${notification.id}`}
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
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        {notification.unread && (
                          <span className="size-2 bg-primary rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-muted-foreground pt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
