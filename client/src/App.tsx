import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { WebSocketProvider } from "./lib/websocket.tsx";
import { motion, AnimatePresence } from "framer-motion";

import { AuthProvider } from "./hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import IntroPage from "@/pages/intro";
import ProcessPredictor from "@/pages/process-predictor";
import ResearchScraper from "@/pages/research-scraper";
import EquipmentAnalyzer from "@/pages/equipment-analyzer";
import ChemicalSafetyAnalyzer from "@/pages/chemical";
import BlockDiagram from "@/pages/process-flow";
import PropertyEstimation from "@/pages/property-estimation";
import Credits from "@/pages/credits"; 
import RecentSearches from "@/pages/recent-searches";
import { ProtectedRoute } from "@/lib/protected-route";

function AnimatedRoutes() {
  return (
    <Switch>
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/predict" component={ProcessPredictor} />
      <ProtectedRoute path="/research" component={ResearchScraper} />
      <ProtectedRoute path="/equipment" component={EquipmentAnalyzer} />
      <ProtectedRoute path="/chemical" component={ChemicalSafetyAnalyzer} />
      <ProtectedRoute path="/block-diagram" component={BlockDiagram} />
      <ProtectedRoute path="/property-estimation" component={PropertyEstimation} />
      <ProtectedRoute path="/credits" component={Credits} />
      <ProtectedRoute path="/recent" component={RecentSearches} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <Switch>
          <Route path="/" component={IntroPage} />
          <Route>
            <>
              <Navbar />
              <main className="w-full">
                <AnimatedRoutes />
              </main>
            </>
          </Route>
        </Switch>
      </div>
    </AuthProvider>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Router />
        <Toaster />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;