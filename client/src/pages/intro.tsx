import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export default function IntroPage() {
  const [, setLocation] = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { user, loginMutation, registerMutation } = useAuth();

  const handleGetStarted = () => {
    setIsExiting(true);
    setTimeout(() => setLocation("/home"), 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="text-center space-y-8 w-full max-w-md">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.8 }}
          className="flex justify-center"
        >
          <img src="/logo.png" alt="LabMate Logo" className="w-24 h-24 object-contain rounded-2xl shadow-xl border border-primary/10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-6xl font-bold tracking-tighter">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-primary inline-block"
            >
              Lab
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="inline-block"
            >
              Mate
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <p className="text-xl text-muted-foreground">Your Own Lab Guardian</p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="w-full"
        >
          {user ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="w-full text-lg relative overflow-hidden group shadow-xl" onClick={handleGetStarted}>
                <span className="relative z-10">Continue as {user.username}</span>
                <motion.div
                  className="absolute inset-0 rounded-lg opacity-25 bg-white"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </Button>
            </motion.div>
          ) : (
            <div className="bg-card border shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-opacity-80">
              <div className="flex border-b">
                <button
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${authMode === 'login' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  onClick={() => setAuthMode('login')}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${authMode === 'register' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  onClick={() => setAuthMode('register')}
                >
                  Create Account
                </button>
              </div>

              <div className="p-6">
                <form className="space-y-4" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-primary" /> Username
                      </label>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-background border-primary/20 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" /> Password
                      </label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background border-primary/20 focus:border-primary transition-all duration-300 focus:ring-2 focus:ring-primary/20 h-11"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold shadow-md transition-all hover:shadow-lg"
                    disabled={registerMutation.isPending || loginMutation.isPending || !username || !password}
                  >
                    {loginMutation.isPending || registerMutation.isPending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      authMode === 'login' ? 'Sign In to LabMate' : 'Create Account'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-16 text-sm text-muted-foreground space-y-1"
        >
          <div>Developed By Uday Chavan</div>
          <div className="text-xs opacity-80">Guided by - Dr. P. S. Bhandari</div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed inset-0 bg-background"
            transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}