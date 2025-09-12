import { Link } from "wouter";
import { Zap, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudioFooter() {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/generate", label: "Generate" },
    { href: "/assets", label: "Assets" },
    { href: "/playground", label: "API Playground" },
  ];
  
  const resources = [
    { href: "#", label: "Documentation" },
    { href: "#", label: "API Reference" },
    { href: "#", label: "Pricing" },
    { href: "#", label: "Changelog" },
  ];
  
  const company = [
    { href: "#", label: "About" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ];
  
  const legal = [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookie Policy" },
    { href: "#", label: "GDPR" },
  ];
  
  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  return (
    <footer className="glass border-t border-border/50 mt-auto">
      <div className="container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl gradient-text">AI Studio</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Create, texture & publish 3D content with AI. The professional platform for AI-powered content generation.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="pwa" className="text-xs">
                PWA Ready
              </Badge>
              <Badge variant="live" className="text-xs">
                Webhooks Live
              </Badge>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-3 pt-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="p-2 rounded-lg glass border border-border/50 hover:border-primary/50 transition-colors group"
                  aria-label={label}
                  data-testid={`social-${label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            
            <div className="pt-2">
              <h4 className="font-medium text-sm text-foreground mb-2">Company</h4>
              <ul className="space-y-2">
                {company.map((link) => (
                  <li key={link.href}>
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3">
              {legal.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            
            {/* Newsletter */}
            <div className="pt-4 space-y-3">
              <h4 className="font-medium text-sm text-foreground">Stay Updated</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email"
                  className="flex-1 px-3 py-2 text-sm glass border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  data-testid="newsletter-input"
                />
                <button 
                  className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                  data-testid="newsletter-submit"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} AI Studio. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Built with ❤️ for creators</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-success text-xs font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}