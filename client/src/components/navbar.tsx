import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Navbar() {
  const [location] = useLocation();
  
  // Fetch current user credits (now server-controlled)
  const { data: creditsData, isLoading } = useQuery({
    queryKey: ['/api/credits'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const navItems = [
    { href: "/", label: "Home", testId: "nav-home" },
    { href: "/generate", label: "Generate", testId: "nav-generate" },
    { href: "/assets", label: "Assets", testId: "nav-assets" },
    { href: "/playground", label: "API Playground", testId: "nav-playground" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="logo">
              <Zap className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-lg">AI Studio</span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    size="sm"
                    data-testid={item.testId}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
            
            {/* Credits Display */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800" data-testid="credits-display">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {isLoading ? "..." : `${creditsData?.credits ?? 0} credits`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}