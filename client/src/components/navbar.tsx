import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();

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
        </div>
      </div>
    </nav>
  );
}