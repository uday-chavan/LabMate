import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Beaker, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { predictProcess } from "@/lib/gemini";

const EXAMPLE_QUERIES = [
  {
    title: "Complex Organic Synthesis (Formula)",
    query: "C6H5COOH + CH3COOC2H5 ⇌ C6H5COOC2H5 + CH3COOH, Temperature: 140°C, Catalyst: H2SO4 - Explain the Fischer esterification process including mechanism, conditions, and catalysis requirements"
  },
  {
    title: "Redox Process (Formula)",
    query: "Fe2O3 + 3CO ⇌ 2Fe + 3CO2, Temperature: 900°C, Pressure: 2 atm - Explain this reduction process including thermodynamics, kinetics, and optimal conditions"
  },
  {
    title: "Pharmaceutical Production (Text)",
    query: "Detail the industrial process for synthesizing paracetamol from p-aminophenol and acetic anhydride, including reaction conditions, safety measures, and quality control steps"
  },
  {
    title: "Green Chemistry Process (Text)",
    query: "Explain the sustainable process of producing biodegradable plastics from corn starch through bacterial fermentation, including all stages from raw material to final polymer"
  },
  {
    title: "Product Prediction 1",
    query: "What products will form when mixing sodium hydroxide (NaOH) with hydrochloric acid (HCl) in aqueous solution at room temperature? Explain the reaction mechanism"
  },
  {
    title: "Product Prediction 2",
    query: "Predict the products of thermal decomposition of calcium carbonate (CaCO3) at 900°C. What gases will be released and what solid remains? Include reversibility conditions"
  }
];

export default function ProcessPredictor() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const resultsRef = useRef(null);

  const { data: prediction, isLoading, error, refetch } = useQuery({
    queryKey: ['prediction', query],
    queryFn: () => predictProcess(query),
    enabled: false,
  });

  const handlePredict = async () => {
    if (!query.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a process or reaction to predict",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

  // Scroll to results when they appear
  useEffect(() => {
    if (prediction) {
      const scrollArea = document.getElementById('results-scroll-area');
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTop = 0;
          // Auto-scrolling removed while keeping animations intact
        }, 100);
      }
    }
  }, [prediction]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Beaker className="w-8 h-8 text-primary" />
          Process Predictor
        </h1>
        <p className="text-muted-foreground">
          Describe a chemical process or reaction and get AI-powered predictions and explanations.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-gradient-x" />
          </div>
          <CardContent className="pt-6 space-y-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Textarea
                placeholder="Enter your process or reaction details here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px] text-lg leading-relaxed focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 relative bg-background"
              />
            </motion.div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Try these example queries:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EXAMPLE_QUERIES.map((example, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setQuery(example.query)}
                    className="text-left p-2 text-sm hover:bg-primary/5 rounded-md transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="font-medium">{example.title}</span>
                    <p className="text-muted-foreground truncate text-xs mt-1">
                      {example.query.length > 100
                        ? example.query.substring(0, 100) + "..."
                        : example.query}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handlePredict}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Process...
                  </>
                ) : (
                  <>
                    <Beaker className="mr-2 h-4 w-4" />
                    Predict Process
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Failed to get prediction. Please try again.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] rounded-md border p-6" id="results-scroll-area">
                  <div className="prose prose-lg max-w-none space-y-6">
                    {prediction.split('\n\n').map((section, i) => {
                      // Special handling for the first section (direct answer)
                      if (i === 0) {
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.8,
                              delay: 0.2,
                              type: "spring",
                              stiffness: 100
                            }}
                            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-lg"
                          >
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 leading-tight">
                              {section}
                            </h2>
                          </motion.div>
                        );
                      }
                      // Handle detailed explanation sections
                      const lines = section.split('\n');
                      return (
                        <motion.div
                          key={i}
                          className="result-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.8, 
                            delay: 0.3 + (i * 0.4),
                            type: "spring",
                            damping: 15
                          }}
                          className="space-y-2"
                        >
                          {lines.map((line, j) => (
                            <motion.p
                              key={`${i}-${j}`}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 120,
                                damping: 14,
                                mass: 0.8,
                                delay: 0.4 + (i * 0.4) + (j * 0.2) // Increased delay for smoother line animation
                              }}
                              className="leading-relaxed text-foreground/80 font-normal"
                            >
                              {line}
                            </motion.p>
                          ))}
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}