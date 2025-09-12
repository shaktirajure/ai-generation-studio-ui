import { motion } from "framer-motion";
import { Link } from "wouter";
import { Zap, Sparkles, Box, Video, Database, Settings, ArrowRight, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { StudioButton } from "@/components/ui/studio-button";
import { SectionTitle } from "@/components/ui/section-title";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6
    }
  }
};

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export default function Home() {
  const mainFeatures = [
    {
      icon: Sparkles,
      title: "Generate Content",
      description: "Create AI-powered content with text prompts",
      details: "Transform your ideas into visual content using our advanced AI generation tools.",
      href: "/generate",
      buttonText: "Launch Studio",
      primary: true,
      testId: "button-go-generate"
    },
    {
      icon: Database,
      title: "Asset Library", 
      description: "Manage your generated content assets",
      details: "Browse, organize, and download all your previously generated content.",
      href: "/assets",
      buttonText: "View Assets",
      testId: "button-go-assets"
    },
    {
      icon: Settings,
      title: "API Playground",
      description: "Test and explore our API endpoints", 
      details: "Experiment with our API directly from your browser with interactive tools.",
      href: "/playground", 
      buttonText: "Open Playground",
      testId: "button-go-playground"
    }
  ];

  const capabilities = [
    {
      icon: Sparkles,
      title: "Text→3D",
      description: "Create 3D models and assets from simple text prompts",
      color: "text-primary"
    },
    {
      icon: Box,
      title: "Image→3D", 
      description: "Transform images into detailed 3D objects and scenes",
      color: "text-primary-2"
    },
    {
      icon: Video,
      title: "AI Texturing",
      description: "Generate realistic textures and materials for 3D content",
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative py-24 md:py-32">
        <div className="container relative z-10">
          <motion.div 
            className="text-center space-y-8 max-w-4xl mx-auto"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-4">
              <Badge variant="beta" className="mb-4">
                ✨ Now in Beta
              </Badge>
              <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight">
                Create, texture & 
                <span className="gradient-text block">publish 3D with AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Professional AI-powered 3D content generation platform. 
                From concept to creation in seconds, not hours.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link href="/generate">
                <StudioButton size="lg" className="gap-2" data-testid="hero-launch-studio">
                  <Zap className="w-5 h-5" />
                  Launch Studio
                  <ArrowRight className="w-4 h-4" />
                </StudioButton>
              </Link>
              <Link href="/playground">
                <StudioButton variant="outline" size="lg" className="gap-2" data-testid="hero-view-api">
                  View API
                </StudioButton>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex items-center justify-center gap-8 pt-8 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm">GPU Accelerated</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm">Webhook Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm">PWA Support</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow="Powerful Features"
            title="Everything you need to create"
            description="Professional-grade tools designed for creators, developers, and businesses"
            className="mb-16"
          />
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={cardVariants}>
                  <GlassCard className={`h-full group hover:scale-105 transition-all duration-300 ${feature.primary ? 'ring-1 ring-primary/20' : ''}`}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${feature.primary ? 'bg-primary/20' : 'bg-accent/20'}`}>
                          <Icon className={`w-5 h-5 ${feature.primary ? 'text-primary' : 'text-accent'}`} />
                        </div>
                        <h3 className="font-heading font-semibold text-lg">{feature.title}</h3>
                        {feature.primary && (
                          <Badge variant="live" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground">{feature.description}</p>
                      
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        {feature.details}
                      </p>
                      
                      <Link href={feature.href}>
                        <StudioButton 
                          variant={feature.primary ? "gradient" : "outline"} 
                          className="w-full mt-6 group-hover:scale-105 transition-transform"
                          data-testid={feature.testId}
                        >
                          {feature.buttonText}
                        </StudioButton>
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow="AI Capabilities"
            title="Advanced AI workflows"
            description="State-of-the-art AI models powering your creative process"
            className="mb-16"
          />
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <motion.div key={capability.title} variants={cardVariants}>
                  <GlassCard className="text-center h-full hover:scale-105 transition-all duration-300">
                    <div className="space-y-4">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-2/20`}>
                        <Icon className={`w-8 h-8 ${capability.color}`} />
                      </div>
                      <h3 className="font-heading font-semibold text-xl">{capability.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {capability.description}
                      </p>
                      {index === 1 && <div className="workflow-arrow"></div>}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="section">
        <div className="container">
          <SectionTitle
            eyebrow="How it works"
            title="Simple 3-step workflow"
            description="From prompt to production-ready 3D content"
            className="mb-16"
          />
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={cardVariants} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Prompt</h3>
              <p className="text-muted-foreground">Describe what you want to create with natural language</p>
            </motion.div>
            
            <motion.div variants={cardVariants} className="text-center relative">
              <div className="absolute -left-8 top-6 hidden md:block">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-2 text-white font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Webhook</h3>
              <p className="text-muted-foreground">AI processes your request and sends results via webhook</p>
            </motion.div>
            
            <motion.div variants={cardVariants} className="text-center relative">
              <div className="absolute -left-8 top-6 hidden md:block">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Preview & Download</h3>
              <p className="text-muted-foreground">Review, refine and download your 3D content</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <motion.div 
            className="glass rounded-3xl p-12 text-center space-y-8 bg-gradient-to-br from-primary/10 to-primary-2/10"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Ready to start creating?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of creators using AI Studio to bring their 3D visions to life.
              </p>
            </div>
            
            <Link href="/generate">
              <StudioButton size="lg" className="gap-2" data-testid="cta-get-started">
                <Zap className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </StudioButton>
            </Link>
            
            <p className="text-sm text-muted-foreground">
              No credit card required • 20 free credits to start
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}