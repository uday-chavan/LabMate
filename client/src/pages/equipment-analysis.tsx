import { useState } from "react";
import { Tool, Search, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function EquipmentAnalysis() {
  const [equipment, setEquipment] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!equipment) return;

    setLoading(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setResult(
        `Analysis for ${equipment}:\n\n` +
        `• Type: Laboratory equipment\n` +
        `• Common usage: Chemical synthesis, analytical procedures\n` +
        `• Safety considerations: Requires proper handling and regular maintenance\n` +
        `• Compatibility: Works well with standard laboratory setups\n\n` +
        `Recommendation: Ensure regular calibration for optimal performance.`
      );
      setLoading(false);
    }, 1500);
  };

  const handleQuery = async () => {
    if (!query) return;

    setLoading(true);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setResult(
        `Information about "${query}":\n\n` +
        `• Function: Used for precise measurement of liquid volumes\n` +
        `• Materials: Usually made of borosilicate glass\n` +
        `• Accuracy: Class A volumetric equipment has higher accuracy\n` +
        `• Usage tips: Always read the meniscus at eye level\n\n` +
        `Best practices: Clean thoroughly after use to prevent cross-contamination.`
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto space-y-8 p-6"
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Tool className="w-8 h-8 text-primary" />
          Equipment Analysis
        </h1>
        <p className="text-muted-foreground">
          Analyze lab equipment functionality or query for equipment information
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="space-y-8"
      >
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Equipment Analysis
            </h2>
            <div className="space-y-4">
              <Input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="Enter equipment name (e.g., spectrophotometer)"
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={loading || !equipment}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Equipment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Equipment Query
            </h2>
            <div className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about lab equipment (e.g., How to properly use a pipette?)"
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleQuery} 
                disabled={loading || !query}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Query"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Card className="border-primary/50 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Analysis Result</h3>
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {result}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}