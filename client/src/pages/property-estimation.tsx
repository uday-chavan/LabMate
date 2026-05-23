import React from "react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Beaker,
  Atom,
  Thermometer,
  Scale,
  Droplet,
  Zap,
  Cloud,
  FlaskConical,
  AlertTriangle,
  Gauge,
  Hexagon,
  Waves,
  ArrowBigDown,
  Shapes,
  Bookmark,
  Save,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { predictProcess } from "@/lib/gemini";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

type PropertyData = {
  title: string;
  value: string;
  icon: any;
};

const propertyIcons = {
  Formula: Atom,
  Weight: Scale,
  Density: Beaker,
  Boiling: Thermometer,
  Melting: Thermometer,
  Solubility: Droplet,
  Structure: Shapes,
  Polarity: Zap,
  Vapor: Cloud,
  Reactivity: FlaskConical,
  Toxicity: AlertTriangle,
  Pressure: Gauge,
  State: Hexagon,
  Viscosity: Waves,
  Stability: FlaskConical,
  Ionization: ArrowBigDown
};

let cachedSmiles = "";
let cachedProperties: PropertyData[] = [];
let cachedMainTitle = "";

export default function PropertyEstimation() {
  const [smiles, setSmiles] = useState(cachedSmiles);
  const [properties, setProperties] = useState<PropertyData[]>(cachedProperties);
  const [mainTitle, setMainTitle] = useState<string>(cachedMainTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { cachedSmiles = smiles; }, [smiles]);
  useEffect(() => { cachedProperties = properties; }, [properties]);
  useEffect(() => { cachedMainTitle = mainTitle; }, [mainTitle]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!mainTitle || properties.length === 0) throw new Error("No properties to save");
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "smiles",
          query: smiles,
          result: JSON.stringify({ title: mainTitle, properties }),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Saved", description: "SMILES properties saved to history." }),
    onError: () => toast({ title: "Failed to save", description: "An error occurred.", variant: "destructive" })
  });

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    setProperties([]);
    setMainTitle("");

    try {
      const query = `Analyze this SMILES structure and provide ONLY these properties in this EXACT format. Include numerical values where applicable and keep descriptions very short (1-3 words):

Formula: [chemical formula]
Weight: [X.XX g/mol]
Density: [X.XX g/cm³]
Boiling: [XXX°C]
Melting: [XXX°C]
Solubility: [brief phrase]
Structure: [brief phrase]
Polarity: [polar/nonpolar/etc]
Vapor: [X.XX kPa at 25°C]
Reactivity: [low/medium/high]
Toxicity: [brief hazard level]
Pressure: [X.XX atm]
State: [solid/liquid/gas]
Viscosity: [X.XX cP]
Stability: [stable/unstable]
Ionization: [X.XX eV]

SMILES: ${smiles}`;

      const result = await predictProcess(query);
      const lines = result.split('\n').filter(line => line.trim());

      if (lines.length > 0) {
        setMainTitle(lines[0]); // First line is the formula

        const extractedProperties = lines.slice(1).map(line => {
          const [key, ...valueParts] = line.split(':');
          const cleanKey = key.trim();
          const value = valueParts.join(':').trim();

          if (!cleanKey || !value || !propertyIcons[cleanKey as keyof typeof propertyIcons]) {
            return null;
          }

          return {
            title: cleanKey,
            value,
            icon: propertyIcons[cleanKey as keyof typeof propertyIcons]
          };
        }).filter(Boolean) as PropertyData[];

        // Shuffle the properties array for random display
        const shuffledProperties = [...extractedProperties]
          .sort(() => Math.random() - 0.5);

        setProperties(shuffledProperties);
      }
    } catch (error) {
      console.error('Error:', error);
      setError("Failed to estimate properties");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="p-3 sm:p-4 border-2 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
              <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-full border-2 hover:bg-primary/10 hover:text-primary transition-colors">
                <Link href="/home">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Atom className="w-6 h-6 text-primary shrink-0" />
                Physical Property Estimator
              </h1>
            </div>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto border-2 hover:bg-primary/5 transition-colors">
              <Link href="/recent?type=smiles">
                <Bookmark className="w-4 h-4 mr-2" />
                <span>Saved SMILES</span>
              </Link>
            </Button>
          </div>
        </Card>
        <p className="text-muted-foreground px-2 text-center sm:text-left">
          Enter a SMILES notation to discover chemical properties
        </p>
      </motion.div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Input
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            placeholder="Enter SMILES notation (e.g., CCO for ethanol)"
            className="flex-1"
          />
          <Button
            onClick={handleEstimate}
            disabled={loading || !smiles}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Analyzing...
              </>
            ) : "Estimate"}
          </Button>
        </div>

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Try these examples:
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Ethanol", smiles: "CCO" },
              { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O" },
              { name: "Hydrogen Cyanide", smiles: "C#N" },
              { name: "Benzene", smiles: "C1=CC=CC=C1" },
              { name: "Glucose", smiles: "C(C1C(C(C(C(O1)O)O)O)O)O" }
            ].map((example) => (
              <Button
                key={example.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSmiles(example.smiles);
                  // Optionally auto-submit
                  // handleEstimate();
                }}
                className="text-xs"
              >
                {example.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mainTitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            <Card className="bg-primary/5 border-primary/20 shadow-sm mt-4">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h2 className="text-xl md:text-2xl font-bold text-primary break-words text-center sm:text-left flex-1">
                    {mainTitle}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="shrink-0 bg-background/50 hover:bg-background">
                    <Save className="w-4 h-4 mr-2" />
                    <span>Save</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {properties.map((prop, index) => {
              return (
                <motion.div
                  key={prop.title}
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.3,
                      ease: "easeOut",
                      delay: index * 0.04
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.15 }
                  }}
                >
                  <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="p-3 rounded-full bg-primary/10">
                          <prop.icon className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <motion.h3
                            initial={{ y: 10 }}
                            animate={{ y: 0 }}
                            className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                          >
                            {prop.title}
                          </motion.h3>
                          <p className="text-xl font-semibold text-foreground">
                            {prop.value}
                          </p>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}