import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BootScreen } from "@/components/BootScreen";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Rules from "@/pages/Rules";
import TeamRegistration from "@/pages/TeamRegistration";
import ChallengeVault from "@/pages/ChallengeVault";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [bootComplete, setBootComplete] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    // Check if boot sequence has been shown this session
    const booted = sessionStorage.getItem("novus_booted");
    if (booted) {
      setBootComplete(true);
      setHasBooted(true);
    }
  }, []);

  const handleBootComplete = () => {
    sessionStorage.setItem("novus_booted", "true");
    setBootComplete(true);
    setHasBooted(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner 
          theme="dark"
          toastOptions={{
            style: {
              background: "hsl(0 0% 6%)",
              border: "1px solid hsl(120 100% 15%)",
              color: "hsl(120 60% 75%)",
            },
          }}
        />
        <AnimatePresence mode="wait">
          {!bootComplete && !hasBooted && (
            <BootScreen onComplete={handleBootComplete} />
          )}
        </AnimatePresence>
        
        {bootComplete && (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/team" element={<TeamRegistration />} />
              <Route path="/vault" element={<ChallengeVault />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
