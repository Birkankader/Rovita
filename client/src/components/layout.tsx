import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, Briefcase, LayoutDashboard, Map, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Notifications } from "./notifications";
import { useAuth } from "@/hooks/use-auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  if (location === "/login" || location === "/register") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
    { label: "İş Analizi", href: "/job-analysis", icon: Briefcase },
    { label: "Yol Haritası", href: "/roadmap", icon: Map },
    { label: "Değerlendirme", href: "/assessment", icon: User },
    { label: "Profil", href: "/profile", icon: User },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Briefcase className="size-5" />
            </div>
            <span>Rotiva</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="h-6 w-px bg-border mx-2" />
                
                <Notifications />
                
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className={isActive("/settings") ? "text-primary bg-muted" : "text-muted-foreground"}>
                    <Settings className="size-5" />
                    <span className="sr-only">Ayarlar</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Nav */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Menüyü Aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                ))}
                {user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link 
                      href="/settings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="size-5" />
                      Ayarlar
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {children}
      </main>

      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Rotiva. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
