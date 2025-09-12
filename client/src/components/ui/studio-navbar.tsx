import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Zap, Menu, X, Smartphone, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StudioButton } from "@/components/ui/studio-button";
import { Badge } from "@/components/ui/badge";

interface CreditsResponse {
  credits: number;
}

// Theme toggle hook
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) return savedTheme;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
}

// PWA install hook
function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    
    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, installApp };
}

export default function StudioNavbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, installApp } = usePWAInstall();
  
  // Fetch current user credits
  const { data: creditsData, isLoading } = useQuery<CreditsResponse>({
    queryKey: ['/api/credits'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const navItems = [
    { href: "/", label: "Home", testId: "nav-home" },
    { href: "/generate", label: "Generate", testId: "nav-generate" },
    { href: "/assets", label: "Assets", testId: "nav-assets" },
    { href: "/playground", label: "API", testId: "nav-playground" },
  ];

  return (
    <nav className="sticky top-0 z-50 glass backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity" data-testid="logo">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl gradient-text">AI Studio</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  size="sm"
                  className="relative"
                  data-testid={item.testId}
                >
                  {item.label}
                  {location === item.href && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                  )}
                </Button>
              </Link>
            ))}
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* PWA Install */}
            {isInstallable && (
              <StudioButton
                variant="outline"
                size="sm"
                onClick={installApp}
                className="hidden md:inline-flex gap-2"
                data-testid="button-install-app"
              >
                <Download className="w-4 h-4" />
                Install App
              </StudioButton>
            )}
            
            {/* Credits Display */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent/20">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-accent" data-testid="credits-display">
                {isLoading ? "..." : `${creditsData?.credits ?? 0} credits`}
              </span>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden md:inline-flex"
              data-testid="button-theme-toggle"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
            
            {/* Launch Studio CTA */}
            <Link href="/generate">
              <StudioButton 
                size="sm" 
                className="hidden md:inline-flex"
                data-testid="button-launch-studio"
              >
                Launch Studio
              </StudioButton>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border/50">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={location === item.href ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`${item.testId}-mobile`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            
            {/* Mobile credits */}
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-muted-foreground">Credits:</span>
              <Badge variant="beta" data-testid="credits-mobile">
                {isLoading ? "..." : `${creditsData?.credits ?? 0}`}
              </Badge>
            </div>
            
            {/* Mobile PWA Install */}
            {isInstallable && (
              <StudioButton
                variant="outline"
                onClick={installApp}
                className="w-full gap-2"
                data-testid="button-install-app-mobile"
              >
                <Smartphone className="w-4 h-4" />
                Install App
              </StudioButton>
            )}
            
            {/* Mobile theme toggle */}
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start gap-3"
              data-testid="button-theme-toggle-mobile"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </Button>
            
            {/* Mobile Launch Studio */}
            <Link href="/generate">
              <StudioButton 
                className="w-full" 
                onClick={() => setMobileMenuOpen(false)}
                data-testid="button-launch-studio-mobile"
              >
                Launch Studio
              </StudioButton>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}