import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Clock, Mail, Smartphone, Moon, Sun, Sunrise } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Settings() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [times, setTimes] = useState<string[]>(["morning"]);

  const toggleTime = (time: string) => {
    setTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time) 
        : [...prev, time]
    );
  };

  const handleSave = () => {
    toast({
      title: "Preferences Saved",
      description: "We'll notify you according to your new schedule.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Settings & Preferences</h1>
        <p className="text-muted-foreground">Manage how and when you want to be notified.</p>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              <CardTitle>Notification Schedule</CardTitle>
            </div>
            <CardDescription>
              Stay motivated with timely reminders to complete your daily quests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications for pending tasks</p>
              </div>
              <Switch 
                id="notifications" 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            {notificationsEnabled && (
              <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2 fade-in duration-300">
                <Label>Preferred Time of Day</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => toggleTime("morning")}
                    className={`cursor-pointer relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                      times.includes("morning") ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${times.includes("morning") ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Sunrise className="size-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Morning</div>
                      <div className="text-xs text-muted-foreground">09:00 AM</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => toggleTime("afternoon")}
                    className={`cursor-pointer relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                      times.includes("afternoon") ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${times.includes("afternoon") ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Sun className="size-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Afternoon</div>
                      <div className="text-xs text-muted-foreground">01:00 PM</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => toggleTime("evening")}
                    className={`cursor-pointer relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                      times.includes("evening") ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${times.includes("evening") ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Moon className="size-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Evening</div>
                      <div className="text-xs text-muted-foreground">06:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              <CardTitle>Channels</CardTitle>
            </div>
            <CardDescription>Where should we send your updates?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Digests</p>
                  <p className="text-xs text-muted-foreground">Weekly progress summary</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mobile Push</p>
                  <p className="text-xs text-muted-foreground">Instant quest updates</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} className="ml-auto">Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
