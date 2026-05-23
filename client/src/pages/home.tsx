import { Calculator as CalcIcon } from 'lucide-react';

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker,
  Search,
  Camera,
  TestTube,
  GitBranch,
  ArrowRight,
  Code2,
  Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TypeAnimation } from "@/components/type-animation";

export default function Home() {
  const [, setLocation] = useLocation();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    setTimeout(() => setLocation(path), 800);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const cards = [
    {
      href: "/predict",
      icon: Beaker,
      title: "Process Predictor",
      description: "AI-powered process and reaction predictions with detailed explanations",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      href: "/research",
      icon: Search,
      title: "Research Scraper",
      description: "Find and analyze research papers and resources",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      href: "/equipment",
      icon: Camera,
      title: "Equipment Analyzer",
      description: "Identify and analyze lab equipment with detailed information",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      href: "/chemical",
      icon: TestTube,
      title: "Chemical Safety Analyzer",
      description: "Comprehensive chemical analysis with safety guidelines",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      href: "/property-estimation",
      icon: CalcIcon,
      title: "Property Estimation",
      description: "Estimate physical properties using Group Contribution Methods",
      color: "from-emerald-500/20 to-green-500/20"
    },
    {
      href: "/block-diagram",
      icon: GitBranch,
      title: "Block Diagram Generator",
      description: "Create interactive block diagrams with Mermaid.js",
      color: "from-yellow-500/20 to-amber-500/20"
    },
    {
      href: "/credits",
      icon: Code2,
      title: "Credits",
      description: "View acknowledgments and contributors to the project",
      color: "from-indigo-500/20 to-blue-500/20",
      actionText: "Show Credits"
    }
  ];

  return (
    <div className="relative space-y-8 md:space-y-12 px-4 pb-8 md:pb-12 pt-0 w-full overflow-hidden">
      {/* Left side ambient blob */}
      <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/4" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}></div>

      {/* Right side ambient blob */}
      <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/4" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)' }}></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto mb-8 px-2 sm:px-0 text-center space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative inline-block mx-auto">
            <Card className="inline-block bg-card/40 backdrop-blur-md border-2 border-primary/40 shadow-sm relative overflow-hidden rounded-xl sm:rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              <CardContent className="py-5 sm:py-8 px-6 sm:px-12 relative z-10 flex flex-col items-center justify-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center leading-tight sm:leading-tight md:leading-tight">
                  <span className="text-primary">
                    Your AI-Powered
                  </span>
                  <br className="md:hidden" />
                  <span className="text-foreground mt-1 sm:mt-2 md:mt-0 md:ml-3 inline-block">
                    Lab Assistant
                  </span>
                </h1>
              </CardContent>
            </Card>
          </div>

          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mt-6">
            Your comprehensive lab safety and research companion with intelligent features and
            emergency notification system.
          </p>

          <div className="flex justify-center items-center gap-1 sm:gap-2 text-xs min-[375px]:text-sm sm:text-xl md:text-2xl font-medium mt-6 whitespace-nowrap bg-background/50 rounded-full py-2 px-4 sm:px-6 border shadow-sm w-fit mx-auto">
            <span>LabMate can</span>
            <TypeAnimation
              phrases={[
                "Predict or Explain Any Process 💡",
                "Analyze Any Equipment 🔬",
                "Research Smarter 🔍",
                "Evaluate the Safety ⚠️",
                "Notify Instantly 🔔",
                "Estimate Physical Properties 🌡️",
                "Generate Block diagrams ✏️"
              ]}
              typingSpeed={80}
              deletingSpeed={40}
              delayBetweenPhrases={1500}
            />
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 relative z-10 max-w-6xl mx-auto px-2 lg:px-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              variants={item}
              onHoverStart={() => setHoveredCard(card.href)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <Link href={card.href}>
                <Card className="group cursor-pointer h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className={`relative overflow-hidden rounded-t-lg bg-gradient-to-r ${card.color}`}>
                    <motion.div
                      animate={{
                        scale: hoveredCard === card.href ? 1.1 : 1,
                        rotate: hoveredCard === card.href ? 10 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute right-4 top-4 opacity-20"
                    >
                      <Icon className="w-16 h-16 text-foreground" />
                    </motion.div>
                    <div className="relative z-10">
                      <Icon className="w-8 h-8 text-primary mb-2 transition-transform duration-300 group-hover:scale-110" />
                      <CardTitle className="text-xl md:text-2xl transition-colors duration-300 group-hover:text-primary">
                        {card.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-muted-foreground text-sm md:text-base">
                      {card.description}
                    </p>
                    <motion.div
                      animate={{
                        x: hoveredCard === card.href ? 5 : 0,
                        opacity: hoveredCard === card.href ? 1 : 0.7
                      }}
                      className="flex items-center gap-2 mt-4 text-primary font-medium"
                    >
                      <span>{card.actionText || "Get Started"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}