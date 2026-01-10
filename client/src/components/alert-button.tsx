import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendAlert } from "@/lib/telegram";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AlertButton() {
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveLocation = () => {
    if (location.trim()) {
      toast({
        title: "Location Saved",
        description: `Current location set to: ${location}`,
      });
    }
    setIsLocationOpen(false);
  };

  const handleAlert = async () => {
    if (sending) return;

    setSending(true);
    try {
      const timestamp = new Date().toLocaleString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });

      await sendAlert(
        `🚨 EMERGENCY ALERT 🚨\n\n` +
        `Message: Emergency situation reported\n` +
        `Location: ${location || "Not specified"}\n` +
        `Time: ${timestamp}\n\n` +
        `⚠️ Please respond immediately!\n` +
        `HELP NEEDED!`
      );

      toast({
        title: "Alert Sent",
        description: "Emergency notification has been dispatched",
        variant: "default",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Alert Failed",
        description: "Failed to send emergency alert. Please use alternative emergency contacts.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Location Dialog */}
      <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-background hover:bg-background"
          >
            <MapPin className="h-5 w-5 text-primary" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Current Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Enter your location"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleSaveLocation}
              className="w-full"
            >
              Save Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Alert Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="font-semibold"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Emergency Alert
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-2 border-destructive p-0 bg-white">
          <div className="p-0">
            <div className="p-6 space-y-6">
              <div className="space-y-2 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                <h2 className="text-lg font-semibold">Emergency Alert</h2>
                <p className="text-sm text-muted-foreground">
                  Press the button below to send an immediate emergency alert to all staff members.
                </p>
              </div>
              <div className="flex items-center justify-center py-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-32 h-32 rounded-full 
                    bg-red-500 
                    text-white font-bold text-xl
                    flex items-center justify-center
                    relative
                    ${sending ? 'opacity-75' : ''}
                    before:content-[''] 
                    before:absolute 
                    before:inset-0 
                    before:rounded-full 
                    before:bg-red-500/50
                    before:animate-ping
                    before:animation-delay-100
                    after:content-['']
                    after:absolute
                    after:inset-[-8px]
                    after:rounded-full
                    after:bg-red-500/30
                    after:animate-pulse
                    after:animation-delay-200
                  `}
                  onClick={handleAlert}
                  disabled={sending}
                >
                  <span className="relative z-10">
                    {sending ? (
                      <AlertTriangle className="h-12 w-12 animate-spin" />
                    ) : (
                      "EMERGENCY"
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}