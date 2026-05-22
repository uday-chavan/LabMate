import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-compressor";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
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
  Calculator,
  History,
  LogOut,
  User,
  Settings,
  Crop as CropIcon,
  Check
} from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlertButton from "@/components/alert-button";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const { logoutMutation, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const profileMutation = useMutation({
    mutationFn: async (data: { displayName?: string, avatarUrl?: string }) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setProfileOpen(false);
      toast({ title: "Profile updated" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  });

  const openProfileEdit = () => {
    setEditName(user?.displayName || "");
    setEditAvatar(user?.avatarUrl || "");
    setProfileOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setCropDialogOpen(true);
    });
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    try {
      const compressed = await compressImage(base64Image);
      setEditAvatar(compressed);
      setCropDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to process image", variant: "destructive" });
    }
  };

  const menuItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/predict", icon: Beaker, label: "Predictor" },
    { href: "/research", icon: Search, label: "Research" },
    { href: "/equipment", icon: Camera, label: "Equipment Scanner" },
    { href: "/chemical", icon: TestTube, label: "Chemical Hazard Scanner" },
    { href: "/property-estimation", icon: Calculator, label: "Physical Property Estimator" },
    { href: "/block-diagram", icon: GitBranch, label: "Block Diagram Generator" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo.png" alt="LabMate Logo" className="h-10 w-10 object-contain rounded-md" />
          </Link>
        </div>

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

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <AlertButton />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 mr-1 md:mr-4 rounded-full border border-black overflow-hidden p-0">
                <Avatar className="h-full w-full">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.displayName || user?.username} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{user?.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openProfileEdit} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
                placeholder="Display Name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="avatar" className="text-right mt-3">
                Profile Image
              </Label>
              <div className="col-span-3 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={editAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: Square image under 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => profileMutation.mutate({ displayName: editName, avatarUrl: editAvatar })}
              disabled={profileMutation.isPending}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="w-5 h-5" /> Crop Photo
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh' }}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={getCroppedImg}>
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}