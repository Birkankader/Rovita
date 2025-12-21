import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("rotiva-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("rotiva-theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  if (location === "/login" || location === "/register") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
              <Briefcase className="size-5" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Rotiva</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-muted-foreground"
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              <span className="sr-only">Tema Değiştir</span>
            </Button>
            
            {user && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
                disabled={isLoggingOut}
                className="text-muted-foreground hover:text-destructive"
                data-testid="button-logout"
              >
                <LogOut className="size-4 mr-2" />
                {isLoggingOut ? "Çıkılıyor..." : "Çıkış"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {children}
      </main>

      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Rotiva. Kariyer gelişim platformu.</p>
        </div>
      </footer>
    </div>
  );
}
