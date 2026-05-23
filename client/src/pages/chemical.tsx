import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Loader2, Shield, AlertTriangle, Bookmark, Save, ArrowLeft, TestTube } from "lucide-react";
import { analyzeImage } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { HazardMeter } from "@/components/hazard-meter";
import { Link } from "wouter";

let cachedSelectedFile: File | null = null;
let cachedPreviewUrl: string | null = null;
let cachedShowAnalysis = false;
let cachedHazards: string[] = [];

export default function Chemical() {
  const [selectedFile, setSelectedFile] = useState<File | null>(cachedSelectedFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(cachedPreviewUrl);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(cachedShowAnalysis);
  const [hazards, setHazards] = useState<string[]>(cachedHazards);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => { cachedSelectedFile = selectedFile; }, [selectedFile]);
  useEffect(() => { cachedPreviewUrl = previewUrl; }, [previewUrl]);
  useEffect(() => { cachedShowAnalysis = showAnalysis; }, [showAnalysis]);
  useEffect(() => { cachedHazards = hazards; }, [hazards]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!analysis) throw new Error("No analysis available");
      const chemicalName = analysis.split('\n')[0].trim();
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chemical",
          query: chemicalName,
          image: previewUrl,
          result: analysis,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Saved", description: "Chemical analysis saved to history." }),
    onError: () => toast({ title: "Failed to save", description: "An error occurred.", variant: "destructive" })
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setShowAnalysis(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['chemical-analysis', previewUrl],
    queryFn: async () => {
      if (!previewUrl) return null;
      setAnalyzing(true);
      try {
        const result = await analyzeImage(previewUrl, 'chemical');
        setShowAnalysis(true);

        // Extract hazards from analysis
        const hazardSection = result.split('\n\n').find(section => 
          section.toLowerCase().startsWith('hazards:')
        );

        if (hazardSection) {
          const hazardList = hazardSection
            .split('\n')
            .slice(1) // Skip the "HAZARDS:" header
            .map(h => h.trim())
            .filter(h => h && h !== '•')
            .map(h => h.startsWith('•') ? h.substring(1).trim() : h);
          setHazards(hazardList);
        }

        return result;
      } catch (error) {
        toast({
          title: "Analysis failed",
          description: error instanceof Error ? error.message : "Failed to analyze image",
          variant: "destructive"
        });
        return null;
      } finally {
        setAnalyzing(false);
      }
    },
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });

  const startAnalysis = () => {
    if (previewUrl) {
      refetch();
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    const sections = analysis.split('\n\n');
    const [chemicalName, ...otherSections] = sections;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        {/* Chemical Name and Save Button Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <motion.h2 
            className="text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="break-words max-w-full text-center">{chemicalName}</span>
          </motion.h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending} 
            className="shrink-0 border-primary/20 text-primary hover:bg-primary/10"
          >
            <Save className="w-4 h-4 mr-2 text-primary" />
            Save
          </Button>
        </div>

        {/* Main Sections */}
        <motion.div 
          className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {otherSections.map((section, idx) => {
            const [title, ...points] = section.split('\n');

            // Skip empty sections or additional information
            if (!points.length || title.toLowerCase().includes('additional')) return null;

            // Determine section type for styling
            const isHazards = title.toLowerCase().includes('hazard');
            const isSafety = title.toLowerCase().includes('safety');
            const isFirstAid = title.toLowerCase().includes('first aid');
            const isPrecautions = title.toLowerCase().includes('precaution');

            // Style based on section type
            const sectionStyle = isHazards ? {
              bgColor: 'bg-red-50 dark:bg-red-950/30',
              borderColor: 'border-red-200 dark:border-red-800',
              titleColor: 'text-red-700 dark:text-red-300',
              icon: <AlertTriangle className="w-5 h-5 text-red-500" />
            } : isSafety ? {
              bgColor: 'bg-blue-50 dark:bg-blue-950/30',
              borderColor: 'border-blue-200 dark:border-blue-800',
              titleColor: 'text-blue-700 dark:text-blue-300',
              icon: <Shield className="w-5 h-5 text-blue-500" />
            } : isFirstAid ? {
              bgColor: 'bg-green-50 dark:bg-green-950/30',
              borderColor: 'border-green-200 dark:border-green-800',
              titleColor: 'text-green-700 dark:text-green-300',
              icon: <Shield className="w-5 h-5 text-green-500" />
            } : isPrecautions ? {
              bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
              borderColor: 'border-yellow-200 dark:border-yellow-800',
              titleColor: 'text-yellow-700 dark:text-yellow-300',
              icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />
            } : {
              bgColor: 'bg-gray-50 dark:bg-gray-900',
              borderColor: 'border-gray-200 dark:border-gray-800',
              titleColor: 'text-gray-700 dark:text-gray-300',
              icon: null
            };

            return (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className={`rounded-lg border p-4 ${sectionStyle.bgColor} ${sectionStyle.borderColor}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {sectionStyle.icon}
                  <h3 className={`text-base sm:text-lg font-semibold ${sectionStyle.titleColor}`}>
                    {title.toUpperCase()}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {points.map((point, i) => {
                    const text = point.trim();
                    if (!text || text === '•') return null;

                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-start gap-2 ${sectionStyle.titleColor} text-sm sm:text-base`}
                      >
                        <span className="mt-1.5">•</span>
                        <span>{text.startsWith('•') ? text.substring(1).trim() : text}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="container px-4 py-6 sm:py-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="space-y-4">
          <Card className="p-3 sm:p-4 border-2 shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
                <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-full border-2 hover:bg-primary/10 hover:text-primary transition-colors">
                  <Link href="/home">
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </Button>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <TestTube className="w-6 h-6 text-primary shrink-0" />
                  Chemical Label Scanner
                </h1>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto border-2 hover:bg-primary/5 transition-colors">
                <Link href="/recent?type=chemical">
                  <Bookmark className="w-4 h-4 mr-2" />
                  <span>Saved Chemicals</span>
                </Link>
              </Button>
            </div>
          </Card>
          <p className="text-sm sm:text-base text-muted-foreground px-2 text-center sm:text-left">
            Upload or take a photo of any chemical label to get detailed safety information and analysis
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <Card className="md:col-span-3 p-4 sm:p-6 border-2 border-primary/20">
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center space-y-4 transition-colors duration-200 ${
                previewUrl ? 'border-primary/40' : 'border-gray-200 hover:border-primary/40'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={previewUrl}
                    alt="Selected chemical label"
                    className="max-h-48 sm:max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setShowAnalysis(false);
                        setHazards([]); //added line to clear hazards state when removing image
                      }}
                      className="w-full sm:w-auto"
                    >
                      Remove Image
                    </Button>
                    <Button
                      onClick={startAnalysis}
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Analyze Chemical Safety
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <motion.div 
                      className="flex justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8] 
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Upload className="h-10 sm:h-12 w-10 sm:w-12 text-primary/60" />
                    </motion.div>
                    <p className="text-sm sm:text-base">Drag and drop an image here, or click to select</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileInput}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Hazard Meter Section */}
          <div className="md:col-span-2 flex justify-center items-center h-full pb-8 md:pb-0">
            <AnimatePresence mode="wait">
              {showAnalysis && hazards.length > 0 ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full flex justify-center"
                >
                  <HazardMeter hazards={hazards} />
                </motion.div>
              ) : analyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground w-full h-full min-h-[250px] flex flex-col justify-center items-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/30 dark:bg-gray-900/30"
                >
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2 text-primary/60" />
                  <p>Analyzing hazard level...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground w-full h-full min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50/30 dark:bg-gray-900/30"
                >
                  <img src="/chemical safety scanner.webp" alt="Safety Analysis Placeholder" className="w-32 h-32 mb-4 object-cover rounded-2xl opacity-90 border shadow-sm" />
                  <h3 className="font-medium text-foreground/70 mb-2">Safety Analysis</h3>
                  <p className="text-sm max-w-[200px]">Upload a chemical label to see its hazard rating and safety guidelines here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showAnalysis && !analyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 sm:mt-10"
            >
              <Card className="p-4 sm:p-6 border-2 border-primary/20">
                {renderAnalysis()}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}