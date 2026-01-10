import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, RotateCw, Info, Search, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage } from "@/lib/gemini";

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

export default function EquipmentAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    refetch();
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
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Camera className="w-8 h-8 text-primary" />
          Equipment Analyzer
        </h1>
        <p className="text-muted-foreground">
          Take a photo or upload an image of lab equipment to analyze it.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center relative">
                <AnimatePresence>
                  {previewUrl ? (
                    <motion.img
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={previewUrl}
                      alt="Equipment preview"
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-4"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upload or take a photo of lab equipment
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              <div className="flex gap-4 mt-4">
                <Button
                  onClick={handleUpload}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Camera Capture",
                      description: "Camera functionality coming soon!",
                    });
                  }}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !previewUrl}
                className="w-full mt-4"
              >
                {analyzing ? (
                  <>
                    <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Equipment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="pt-6 flex justify-center items-center min-h-[400px]">
                  <RotateCw className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            </motion.div>
          ) : equipment ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    {equipment.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-sm"
                  >
                    {equipment.details.description}
                  </motion.p>

                  <div className="pt-4">
                    <Button
                      onClick={handleGetSafety}
                      disabled={analyzing}
                      variant="outline"
                      className="w-full"
                    >
                      {analyzing ? (
                        <>
                          <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing Safety...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Safety Guidelines
                        </>
                      )}
                    </Button>
                  </div>

                  {showSafety && equipment.details.safetyGuidelines && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-4"
                    >
                      <h3 className="text-sm text-muted-foreground mb-2">Safety Guidelines:</h3>
                      <div className="text-sm space-y-2 text-foreground">
                        {equipment.details.safetyGuidelines
                          .split('\n')
                          .filter(line => line.trim())
                          .map((line, index) => (
                            <motion.p // Changed to motion.p for line-by-line animation
                              key={index}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 120,
                                damping: 14,
                                mass: 0.8,
                                delay: 0.2 + (index * 0.15)
                              }}
                              className="mb-2"
                            >
                              {line.replace(/\*\*/g, '')}
                            </motion.p>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}