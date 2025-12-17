import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 characters";
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

    // Simulate auth - replace with actual Supabase auth
    setTimeout(() => {
      setLoading(false);
      toast.success(mode === "login" ? "Access granted" : "Registration complete");
      navigate("/rules");
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Live animated background */}
      <CyberBackground />
      
      {/* Overlay gradient */}
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
          {/* Mode toggle */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-mono uppercase tracking-wider transition-all ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground border-b border-border hover:text-primary/70"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-mono uppercase tracking-wider transition-all ${
                mode === "register"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground border-b border-border hover:text-primary/70"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`terminal-input w-full ${errors.email ? "border-destructive" : ""}`}
                placeholder="agent@novus.ctf"
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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

            {/* Confirm Password */}
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

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cyber-btn-filled w-full flex items-center justify-center gap-2"
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
                  <Shield className="w-4 h-4" />
                  <span>{mode === "login" ? "Access System" : "Create Account"}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              By proceeding, you accept the{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Engagement</span>
            </p>
          </div>
        </motion.div>

        {/* Admin Access */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center space-y-2"
        >
          <button
            onClick={() => navigate("/admin")}
            className="text-xs text-muted-foreground/50 hover:text-accent transition-colors font-mono"
          >
            [ ADMIN ACCESS ]
          </button>
          <p className="text-xs text-muted-foreground/50 font-mono">
            ◉ 256-BIT ENCRYPTION ENABLED
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
