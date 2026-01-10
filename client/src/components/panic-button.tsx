import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function PanicButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { connected } = useWebSocket();

  const handleEmergency = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/alert", { location: "Unknown" });
      toast({
        title: "Emergency Alert Sent",
        description: "Help is on the way. Stay calm and follow safety procedures.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emergency alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full p-6 shadow-lg hover:shadow-xl transition-shadow animate-pulse"
          onClick={() => setOpen(true)}
        >
          <AlertOctagon className="w-6 h-6" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Emergency Alert
            </DialogTitle>
            <DialogDescription>
              Press the button below to send an immediate emergency alert to all staff members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/30 rounded-full blur-xl animate-pulse" />
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-32 h-32 rounded-full text-xl font-bold relative z-10"
                  onClick={handleEmergency}
                  disabled={isSubmitting || !connected}
                >
                  {isSubmitting ? "Sending..." : "EMERGENCY"}
                </Button>
              </div>
            </motion.div>

            {!connected && (
              <p className="text-sm text-destructive text-center">
                Warning: Connection to emergency system lost. Please try alternative emergency procedures.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}