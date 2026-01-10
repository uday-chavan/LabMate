import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Beaker,
  Search,
  Camera,
  TestTube,
  Menu,
  Home,
  X,
  GitBranch,
  Code2,
  Calculator
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlertButton from "@/components/alert-button";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/predict", icon: Beaker, label: "Process Predictor" },
    { href: "/research", icon: Search, label: "Research Scraper" },
    { href: "/equipment", icon: Camera, label: "Equipment Analyzer" },
    { href: "/chemical", icon: TestTube, label: "Chemical Safety Analyzer" },
    { href: "/property-estimation", icon: Calculator, label: "Property Estimation" },
    { href: "/block-diagram", icon: GitBranch, label: "Block Diagram Generator" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <Beaker className="h-6 w-6 text-primary" />
          <span className="font-bold">LabMate</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex-wrap justify-center">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <NavigationMenuItem key={href}>
                <Link href={href}>
                  <NavigationMenuLink className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md">
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{label}</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-4">
          <AlertButton />
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <nav className="container py-4 space-y-2">
              {menuItems.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <a className="flex items-center gap-3 px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                  </a>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}