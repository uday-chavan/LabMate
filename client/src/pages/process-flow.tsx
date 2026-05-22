import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RotateCw, Sparkles, GitBranch, Info, Bookmark, Save, ArrowLeft } from "lucide-react";
import mermaid from "mermaid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateMermaidDiagram } from "@/lib/gemini";
import { Link } from "wouter";

export default function BlockDiagram() {
  const [description, setDescription] = useState<string>(() => sessionStorage.getItem('diagram-desc') || "");
  const [svgContent, setSvgContent] = useState<string>("");
  const [diagramCode, setDiagramCode] = useState<string>(() => sessionStorage.getItem('diagram-code') || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    sessionStorage.setItem('diagram-desc', description);
  }, [description]);

  useEffect(() => {
    sessionStorage.setItem('diagram-code', diagramCode);
  }, [diagramCode]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diagram",
          query: description,
          result: diagramCode,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Saved", description: "Diagram saved to your history." }),
    onError: () => toast({ title: "Failed to save", description: "An error occurred.", variant: "destructive" })
  });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        curve: 'cardinal',
        nodeSpacing: 100,
        rankSpacing: 100,
        defaultRenderer: 'dagre',
        htmlLabels: true,
        fontSize: 20,
      }
    });

    if (diagramCode && !svgContent) {
      mermaid.render('preview-cached', diagramCode).then(({ svg }) => {
        setSvgContent(svg);
      }).catch(console.error);
    }
  }, []);

  const generateDiagram = async () => {
    if (!description.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a process description",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const code = await generateMermaidDiagram(description.trim());
      setDiagramCode(code);
      const { svg } = await mermaid.render('preview', code);
      setSvgContent(svg);

      toast({
        title: "Success",
        description: "Block diagram generated successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate diagram. Please try again.",
        variant: "destructive",
      });
      console.error('Diagram generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSVG = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'block-diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container px-4 py-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-4 sm:space-y-6"
      >
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="relative inline-flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
                <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0">
                  <Link href="/home">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent text-center sm:text-left py-1">
                  Block Diagram Generator
                </h1>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                <Link href="/recent?type=diagram">
                  <Bookmark className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">Saved</span>
                  <span className="hidden sm:inline">Saved Diagrams</span>
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Describe your process in natural language and let AI create a block diagram
          </p>
          <motion.div 
            className="mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs flex items-center gap-1 hover:bg-primary/10"
              onClick={() => {
                setDescription(`Manufacturing of Polyvinyl Chloride (PVC) – 12-Step Process
Polyvinyl chloride (PVC) is a widely used plastic made from vinyl chloride monomer (VCM).

Step 1: Cracking of naphtha or natural gas.
Step 2: Ethylene production
Step 3: Chlorine Production via electrolysis of brine (NaCl solution).
Step 4: Ethylene Dichloride (EDC) Formation - C₂H₄ + Cl₂ → C₂H₄Cl₂ with FeCl₃ catalyst.
Step 5: EDC Purification through distillation.
Step 6: EDC Cracking to Vinyl Chloride Monomer (VCM) - C₂H₄Cl₂ → C₂H₃Cl + HCl (450-550°C).
Step 7: HCl Recycling for chlorine production.
Step 8: VCM Purification via distillation.
Step 9: Polymerization of VCM using suspension, emulsion, or bulk methods.
Step 10: Polymerization Control with catalysts and temperature regulation.
Step 11: PVC Recovery & Washing to remove residuals.
Step 12: Drying & Sieving for uniform granules.
Step 13: Final Compounding & Processing with additives.`);
              }}
            >
              <Sparkles className="w-3 h-3" /> Try Example: PVC Manufacturing Process
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-primary/20 overflow-hidden h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Process Description
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-gradient-x pointer-events-none" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[200px] md:min-h-[250px] text-base relative bg-background/80 backdrop-blur-sm transition-all duration-300 focus:bg-background"
                  placeholder="Describe your process in natural language..."
                />
                <motion.div
                  className="flex gap-3 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={generateDiagram}
                    className="flex-1 relative overflow-hidden group"
                    disabled={isGenerating}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 group-hover:animate-gradient-x pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isGenerating ? (
                      <>
                        <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Diagram...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Diagram
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {svgContent ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <Card className="border-2 border-primary/20 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                      Generated Block Diagram
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending || !diagramCode}
                            className="group px-2 sm:px-3"
                          >
                            <Save className="w-4 h-4 sm:mr-2 transition-transform group-hover:scale-110" />
                            <span className="hidden sm:inline">Save</span>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadSVG}
                            className="group px-2 sm:px-3"
                          >
                            <Download className="w-4 h-4 sm:mr-2 transition-transform group-hover:scale-110" />
                            <span className="hidden sm:inline">Download SVG</span>
                          </Button>
                        </motion.div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)]">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="h-[400px] md:h-[600px] flex items-center justify-center bg-white rounded-lg p-2 sm:p-8 shadow-inner overflow-auto"
                    >
                      <div
                        ref={previewRef}
                        className="min-w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                      />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="h-full flex items-center justify-center"
              >
                <p className="text-muted-foreground text-center">
                  Your generated diagram will appear here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}