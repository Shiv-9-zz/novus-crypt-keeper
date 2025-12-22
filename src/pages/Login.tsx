import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle, Shield, Users, Lock, Crown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";

import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email format").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(128);

type AuthMode = "register" | "login" | "admin";

export default function Login() {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signUp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user) {
      // If admin mode and user is admin, go to admin panel
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/rules");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailResult = emailSchema.safeParse(formData.email.trim());
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // Validate password
    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (mode === "admin") {
        // First setup admin via edge function (creates user if needed and adds to admin_users)
        const { data: setupData, error: setupError } = await supabase.functions.invoke("setup-admin", {
          body: { email: formData.email.trim(), password: formData.password },
        });

        if (setupError || setupData?.error) {
          toast.error(setupData?.error || "Invalid admin credentials");
          setLoading(false);
          return;
        }

        // Now sign in as admin
        const { error } = await signIn(formData.email.trim(), formData.password);
        if (error) {
          toast.error("Admin authentication failed");
          setLoading(false);
          return;
        }
        toast.success("Admin access granted");
        navigate("/admin");
      } else if (mode === "login") {
        const { error } = await signIn(formData.email.trim(), formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }
        toast.success("Access granted");
        navigate("/rules");
      } else {
        // Register mode
        const { error } = await signUp(formData.email.trim(), formData.password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }
        toast.success("Registration complete! You can now login.");
        setMode("login");
        setFormData({ ...formData, password: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setFormData({ email: "", password: "", confirmPassword: "" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  const getModeTitle = () => {
    switch (mode) {
      case "register":
        return "TEAM REGISTRATION";
      case "login":
        return "TEAM LOGIN";
      case "admin":
        return "ADMIN ACCESS";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "register":
        return <Users className="w-4 h-4" />;
      case "login":
        return <Lock className="w-4 h-4" />;
      case "admin":
        return <Crown className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <CyberBackground />
      
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-[1]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mt-2 text-sm font-mono flicker-slow"
          >
            [ AUTHENTICATION PORTAL ]
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="cyber-card p-8 glitch-box noise"
        >
          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-2 px-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                mode === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-muted-foreground border-b border-border hover:text-primary/70"
              }`}
            >
              <Users className="w-3 h-3" />
              Register
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 px-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-muted-foreground border-b border-border hover:text-primary/70"
              }`}
            >
              <Lock className="w-3 h-3" />
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`flex-1 py-2 px-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                mode === "admin"
                  ? "text-destructive border-b-2 border-destructive bg-destructive/10"
                  : "text-muted-foreground/60 border-b border-border hover:text-destructive/70"
              }`}
            >
              <Crown className="w-3 h-3" />
              Admin
            </button>
          </div>

          {/* Mode indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`text-center mb-4 py-2 rounded border ${
                mode === "admin" 
                  ? "border-destructive/30 bg-destructive/5" 
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              <p className={`text-xs font-mono flex items-center justify-center gap-2 ${
                mode === "admin" ? "text-destructive" : "text-primary"
              }`}>
                {getModeIcon()}
                {getModeTitle()}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Admin warning */}
          {mode === "admin" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded border border-destructive/30 bg-destructive/5"
            >
              <p className="text-xs text-destructive/80 font-mono text-center">
                ⚠ RESTRICTED ACCESS - AUTHORIZED PERSONNEL ONLY
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                {mode === "admin" ? "Admin Email" : "Email Address"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`terminal-input w-full ${errors.email ? "border-destructive" : ""}`}
                placeholder={mode === "admin" ? "admin@novus.ctf" : "agent@novus.ctf"}
                autoComplete="email"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`terminal-input w-full pr-10 ${errors.password ? "border-destructive" : ""}`}
                  placeholder="••••••••"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password - only for register */}
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.confirmPassword ? "border-destructive" : ""}`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-mono text-sm uppercase tracking-wider transition-all ${
                mode === "admin"
                  ? "bg-destructive/20 border border-destructive text-destructive hover:bg-destructive/30"
                  : "cyber-btn-filled"
              }`}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="w-4 h-4" />
                  </motion.div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  {getModeIcon()}
                  <span>
                    {mode === "register" && "Create Account"}
                    {mode === "login" && "Access System"}
                    {mode === "admin" && "Admin Login"}
                  </span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {mode === "admin" ? (
                "Admin access is monitored and logged"
              ) : (
                <>
                  By proceeding, you accept the{" "}
                  <span className="text-primary cursor-pointer hover:underline">Terms of Engagement</span>
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* Back to landing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center space-y-2"
        >
          <button
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground/50 hover:text-primary transition-colors font-mono"
          >
            [ BACK TO HOME ]
          </button>
          <p className="text-xs text-muted-foreground/50 font-mono">
            ◉ 256-BIT ENCRYPTION ENABLED
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
