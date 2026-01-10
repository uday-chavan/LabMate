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
      color: "from-indigo-500/20 to-blue-500/20"
    }
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.3
      }}
      className="relative space-y-8 md:space-y-12 px-4 py-8 md:py-12 overflow-hidden"
    >
      {/* Left side gradient animation */}
      <div className="absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-blue-400/20 via-sky-300/10 to-transparent animate-pulse-slow pointer-events-none"></div>

      {/* Right side gradient animation */}
      <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-orange-400/20 via-amber-300/10 to-transparent animate-pulse-slow pointer-events-none"></div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-4 md:space-y-6"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground px-4">
          Your AI-Powered Lab Assistant
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
          Your comprehensive lab safety and research companion with intelligent features and
          emergency notification system.
        </p>
        {/* Animation positioned below the heading */}
        <div className="flex justify-center items-center gap-2 text-2xl font-medium mt-6 mb-8">
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
      </motion.header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
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
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}