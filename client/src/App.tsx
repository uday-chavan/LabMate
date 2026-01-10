import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { WebSocketProvider } from "./lib/websocket.tsx";
import { AnimatePresence } from "framer-motion";

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
import Credits from "@/pages/credits"; // Added import for Credits page

function Router() {
  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      {/* Only show navbar on non-intro pages */}
      <Switch>
        <Route path="/" component={IntroPage} />
        <Route>
          <>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <AnimatePresence mode="wait">
                <Switch>
                  <Route path="/home" component={Home} />
                  <Route path="/predict" component={ProcessPredictor} />
                  <Route path="/research" component={ResearchScraper} />
                  <Route path="/equipment" component={EquipmentAnalyzer} />
                  <Route path="/chemical" component={ChemicalSafetyAnalyzer} />
                  <Route path="/block-diagram" component={BlockDiagram} />
                  <Route path="/property-estimation" component={PropertyEstimation} />
                  <Route path="/credits" component={Credits} /> {/* Added Credits route */}
                  <Route component={NotFound} />
                </Switch>
              </AnimatePresence>
            </main>
          </>
        </Route>
      </Switch>
    </div>
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