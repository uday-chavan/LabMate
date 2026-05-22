import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload, Loader2, Info, Search, Shield, Bookmark, Save } from "lucide-react";
import { analyzeImage } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type EquipmentDetails = {
  name: string;
  description: string;
  safetyGuidelines?: string;
};

interface EquipmentRecord {
  id: number;
  name: string;
  details: EquipmentDetails;
  imageUrl: string | null;
}

let cachedSelectedFile: File | null = null;
let cachedPreviewUrl: string | null = null;
let cachedShowSafety = false;
let cachedShowAnalysis = false;

export default function EquipmentAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(cachedSelectedFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(cachedPreviewUrl);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSafety, setShowSafety] = useState(cachedShowSafety);
  const [showAnalysis, setShowAnalysis] = useState(cachedShowAnalysis);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync to module-level cache
  useEffect(() => { cachedSelectedFile = selectedFile; }, [selectedFile]);
  useEffect(() => { cachedPreviewUrl = previewUrl; }, [previewUrl]);
  useEffect(() => { cachedShowSafety = showSafety; }, [showSafety]);
  useEffect(() => { cachedShowAnalysis = showAnalysis; }, [showAnalysis]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!equipment || equipment.name === "Analyzing...") throw new Error("No equipment analyzed");
      const res = await fetch("/api/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "equipment",
          query: equipment.details.name,
          image: previewUrl,
          result: `Name: ${equipment.details.name}\n\nDescription: ${equipment.details.description}\n\nSafety Guidelines:\n${equipment.details.safetyGuidelines || 'Not analyzed yet'}`,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => toast({ title: "Saved", description: "Equipment analysis saved to history." }),
    onError: () => toast({ title: "Failed to save", description: "An error occurred.", variant: "destructive" })
  });

  const handleGetSafety = async () => {
    if (!previewUrl || !equipment) {
      toast({
        title: "No Image",
        description: "Please upload or capture an image first.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const safetyAnalysis = await analyzeImage(previewUrl, 'equipment', 'safety');

      // Extract only the general safety points
      const points = safetyAnalysis
        .split(/[.•\n]/)
        .map(point => point.trim())
        .filter(point => {
          // Filter out empty lines and unwanted content
          if (!point) return false;
          if (point.toLowerCase().includes("is a")) return false;
          if (point.toLowerCase().includes("this equipment")) return false;
          if (point.toLowerCase().includes("the image shows")) return false;
          if (point.toLowerCase().includes("chemical name")) return false;
          if (point.toLowerCase().includes("safety data sheet")) return false;
          if (point.toLowerCase().includes("sds")) return false;
          if (point.toLowerCase().includes("therefore, i cannot")) return false;
          if (point.toLowerCase().includes("consult the manual")) return false;

          // Keep only general safety and operation guidelines
          return point.toLowerCase().includes("safety") ||
                 point.toLowerCase().includes("wear") ||
                 point.toLowerCase().includes("ensure") ||
                 point.toLowerCase().includes("must") ||
                 point.toLowerCase().includes("should") ||
                 point.toLowerCase().includes("caution") ||
                 point.toLowerCase().includes("warning") ||
                 point.toLowerCase().includes("protect") ||
                 point.toLowerCase().includes("maintain") ||
                 point.toLowerCase().includes("inspect") ||
                 point.toLowerCase().includes("check") ||
                 point.toLowerCase().includes("proper") ||
                 point.toLowerCase().includes("before");
        })
        .join('\n');

      const updatedEquipment = {
        ...equipment,
        details: {
          ...equipment.details,
          safetyGuidelines: points,
        },
      };

      queryClient.setQueryData(
        ["equipment", selectedFile?.name],
        updatedEquipment,
      );
      setShowSafety(true);
    } catch (error) {
      toast({
        title: "Safety Analysis Failed",
        description: "Failed to analyze safety guidelines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

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
    setShowSafety(false);
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

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!previewUrl) {
      toast({
        title: "No Image",
        description: "Please upload or capture an image first.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await analyzeImage(previewUrl, 'equipment');
      const equipmentDetails: EquipmentDetails = {
        name: analysis.split("\n")[0],
        description: analysis.split("\n").slice(1).join("\n"),
      };

      const detectedEquipment: EquipmentRecord = {
        id: Date.now(),
        name: equipmentDetails.name,
        details: equipmentDetails,
        imageUrl: previewUrl || null,
      };

      queryClient.setQueryData(
        ["equipment", selectedFile?.name],
        detectedEquipment,
      );
      setShowAnalysis(true);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const {
    data: equipment,
    isLoading,
    refetch,
  } = useQuery<EquipmentRecord>({
    queryKey: ["equipment", selectedFile?.name],
    queryFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      return {
        id: 1,
        name: "Analyzing...",
        details: {
          name: "Analyzing...",
          description: "Analysis in progress",
        },
        imageUrl: previewUrl || null,
      };
    },
    enabled: false,
    staleTime: 10 * 60 * 1000,
  });

  const renderAnalysis = () => {
    if (!equipment) return null;

    const name = equipment.details.name || equipment.name;
    const description = equipment.details.description;
    const safetyGuidelines = equipment.details.safetyGuidelines;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        {/* Name and Save Button Container */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <motion.h2 
            className="text-2xl md:text-4xl font-bold text-center bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="break-words max-w-full text-center">{name}</span>
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
          {/* Description Card */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="text-base sm:text-lg font-semibold text-blue-700 dark:text-blue-300">
                DESCRIPTION & FUNCTION
              </h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm sm:text-base leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* Safety Guidelines Card */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-300">
                SAFETY GUIDELINES
              </h3>
            </div>
            
            {safetyGuidelines ? (
              <ul className="space-y-2">
                {safetyGuidelines
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, i) => {
                    const text = line.replace(/\*\*/g, '').trim();
                    if (!text || text === '•') return null;
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-green-700 dark:text-green-300 text-sm sm:text-base"
                      >
                        <span className="mt-1.5">•</span>
                        <span>{text.startsWith('•') ? text.substring(1).trim() : text}</span>
                      </motion.li>
                    );
                  })}
              </ul>
            ) : (
              <div className="space-y-4">
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Click below to analyze general safety and operational precautions for this equipment.
                </p>
                <Button
                  onClick={handleGetSafety}
                  disabled={analyzing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Safety...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Get Safety Guidelines
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
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
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent px-2 whitespace-nowrap sm:whitespace-normal">
              Equipment Analyzer
            </h1>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/recent?type=equipment">
                <Bookmark className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Saved</span>
                <span className="hidden sm:inline">Saved Equipment</span>
              </Link>
            </Button>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Take a photo or upload an image of lab equipment to analyze it.
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
                    alt="Selected equipment"
                    className="max-h-48 sm:max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setShowAnalysis(false);
                        setShowSafety(false);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Remove Image
                    </Button>
                    <Button
                      onClick={handleAnalyze}
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
                          <Search className="mr-2 h-4 w-4" />
                          Analyze Equipment
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
                      onClick={handleUpload}
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
                      onClick={handleUpload}
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

          {/* Right hand panel: Details summary or Placeholder */}
          <div className="md:col-span-2 flex justify-center items-center h-full pb-8 md:pb-0">
            <AnimatePresence mode="wait">
              {showAnalysis && equipment ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full flex justify-center animate-fade-in"
                >
                  <Card className="w-full border-2 border-primary/20 p-6 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Camera className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
                      Equipment Detected
                    </h3>
                    <p className="text-lg font-semibold text-foreground/90">
                      {equipment.details.name || equipment.name}
                    </p>
                  </Card>
                </motion.div>
              ) : analyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground w-full h-full min-h-[250px] flex flex-col justify-center items-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/30 dark:bg-gray-900/30 w-full"
                >
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2 text-primary/60" />
                  <p>Analyzing equipment...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-muted-foreground w-full h-full min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-gray-50/30 dark:bg-gray-900/30 w-full"
                >
                  <img src="/placeholder.png" alt="Equipment Analysis Placeholder" className="w-32 h-32 mb-4 object-contain opacity-70" />
                  <h3 className="font-medium text-foreground/70 mb-2">Equipment Analysis</h3>
                  <p className="text-sm max-w-[200px]">Upload or take a photo of lab equipment to see its details and safety guidelines here.</p>
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