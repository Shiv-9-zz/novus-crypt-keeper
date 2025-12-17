import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <CyberBackground />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md relative z-10"
      >
        <Logo size="md" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <span className="text-6xl font-bold text-destructive">404</span>
          </div>
          
          <h1 className="text-xl font-bold text-card-foreground mb-2">
            SECTOR NOT FOUND
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            The requested resource does not exist in this system.
            Return to authorized sectors immediately.
          </p>

          <motion.button
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cyber-btn inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Base</span>
          </motion.button>
        </motion.div>

        {/* Terminal decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-left p-4 bg-card rounded border border-border font-mono text-xs text-muted-foreground"
        >
          <p className="text-destructive">ERROR: Access Denied</p>
          <p>Path: {location.pathname}</p>
          <p>Status: 404 NOT_FOUND</p>
          <p className="text-terminal-dim">Logging incident...</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
