import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle, Shield, Users, Lock, Crown, Building2, User, LogOut, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const teamNameSchema = z.string().min(3, "Min 3 characters").max(30, "Max 30 characters");
const passwordSchema = z.string().min(6, "Min 6 characters").max(128);
const emailSchema = z.string().email("Invalid email format").max(255);
const nameSchema = z.string().min(1, "Required");

type AuthMode = "register" | "login" | "admin";

export default function Login() {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    password: "",
    confirmPassword: "",
    leaderName: "",
    leaderEmail: "",
    institution: "",
    adminEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Don't auto-redirect - let user choose to sign out or continue
  const handleSignOut = async () => {
    await signOut();
    sessionStorage.removeItem("novus_team_id");
    sessionStorage.removeItem("novus_team_name");
    toast.success("Signed out successfully");
  };

  const handleContinue = async () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      await fetchTeamInfo();
    }
  };

  const fetchTeamInfo = async () => {
    if (!user?.email) return;
    
    const teamNameFromEmail = user.email.split("@")[0];
    
    const { data: team } = await supabase
      .from("teams")
      .select("team_id, name")
      .ilike("name", teamNameFromEmail.replace(/_/g, "%"))
      .maybeSingle();
    
    if (team) {
      sessionStorage.setItem("novus_team_id", team.team_id);
      sessionStorage.setItem("novus_team_name", team.name);
    }
    
    navigate("/team-members");
  };

  const generateTeamId = () => {
    const prefix = "NVS";
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (mode === "admin") {
      const emailResult = emailSchema.safeParse(formData.adminEmail.trim());
      if (!emailResult.success) {
        newErrors.adminEmail = emailResult.error.errors[0].message;
      }
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    } else if (mode === "login") {
      const teamNameResult = teamNameSchema.safeParse(formData.teamName.trim());
      if (!teamNameResult.success) {
        newErrors.teamName = teamNameResult.error.errors[0].message;
      }
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    } else {
      // Register mode - validate all fields
      const teamNameResult = teamNameSchema.safeParse(formData.teamName.trim());
      if (!teamNameResult.success) {
        newErrors.teamName = teamNameResult.error.errors[0].message;
      }
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      const leaderResult = nameSchema.safeParse(formData.leaderName.trim());
      if (!leaderResult.success) {
        newErrors.leaderName = "Leader name required";
      }
      const emailResult = emailSchema.safeParse(formData.leaderEmail.trim());
      if (!emailResult.success) {
        newErrors.leaderEmail = emailResult.error.errors[0].message;
      }
      const instResult = nameSchema.safeParse(formData.institution.trim());
      if (!instResult.success) {
        newErrors.institution = "Institution required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (mode === "admin") {
        const { data: setupData, error: setupError } = await supabase.functions.invoke("setup-admin", {
          body: { email: formData.adminEmail.trim(), password: formData.password },
        });

        if (setupError || setupData?.error) {
          toast.error(setupData?.error || "Invalid admin credentials");
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.adminEmail.trim(), formData.password);
        if (error) {
          toast.error("Admin authentication failed");
          setLoading(false);
          return;
        }
        toast.success("Admin access granted");
        navigate("/admin");
      } else if (mode === "login") {
        const teamEmail = `${formData.teamName.toLowerCase().replace(/[^a-z0-9]/g, "_")}@novus.local`;
        
        const { error } = await signIn(teamEmail, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid team name or password");
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }
        
        sessionStorage.setItem("novus_team_name", formData.teamName.trim());
        
        // Get team and check if members already exist
        const { data: team } = await supabase
          .from("teams")
          .select("id, team_id")
          .eq("name", formData.teamName.trim())
          .maybeSingle();
        
        if (team) {
          sessionStorage.setItem("novus_team_id", team.team_id);
          
          // Check if team already has members saved
          const { data: members } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", team.id)
            .limit(1);
          
          toast.success("Access granted");
          
          // If members exist, skip to rules; otherwise go to team members page
          if (members && members.length > 0) {
            navigate("/rules");
          } else {
            navigate("/team-members");
          }
        } else {
          toast.success("Access granted");
          navigate("/team-members");
        }
      } else {
        // Register mode
        const teamEmail = `${formData.teamName.toLowerCase().replace(/[^a-z0-9]/g, "_")}@novus.local`;
        const teamId = generateTeamId();
        
        // Create auth user
        const { error: authError } = await signUp(teamEmail, formData.password);
        if (authError) {
          if (authError.message.includes("already registered")) {
            toast.error("Team name already registered. Please choose another or login.");
          } else {
            toast.error(authError.message);
          }
          setLoading(false);
          return;
        }

        // Insert team into database
        const { data: teamResult, error: teamError } = await supabase
          .from("teams")
          .insert({
            team_id: teamId,
            name: formData.teamName.trim(),
            leader_name: formData.leaderName.trim(),
            leader_email: formData.leaderEmail.trim(),
            team_size: 2,
            institution: formData.institution.trim(),
          })
          .select()
          .single();

        if (teamError) {
          if (teamError.message.includes("duplicate")) {
            toast.error("Team name already exists. Please choose another.");
          } else {
            toast.error("Failed to register team. Please try again.");
          }
          setLoading(false);
          return;
        }

        // Insert team leader as first member
        await supabase.from("team_members").insert({
          team_id: teamResult.id,
          name: formData.leaderName.trim(),
          email: formData.leaderEmail.trim(),
        });

        sessionStorage.setItem("novus_team_id", teamId);
        sessionStorage.setItem("novus_team_name", formData.teamName.trim());

        toast.success("Team registered successfully!");
        navigate("/team-members");
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
    setFormData({
      teamName: "",
      password: "",
      confirmPassword: "",
      leaderName: "",
      leaderEmail: "",
      institution: "",
      adminEmail: "",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  // If user is already logged in, show options
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <CyberBackground />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-[1]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-6">
            <Logo size="lg" />
          </div>
          
          <div className="cyber-card p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">SESSION ACTIVE</h2>
              <p className="text-muted-foreground text-sm">
                You are currently logged in{isAdmin ? " as admin" : ""}
              </p>
            </div>
            
            <div className="space-y-3">
              <motion.button
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full cyber-btn cyber-btn-filled flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Continue to {isAdmin ? "Admin Panel" : "Challenge Vault"}
              </motion.button>
              
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full cyber-btn flex items-center justify-center gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out & Start Fresh
              </motion.button>
            </div>
          </div>
        </motion.div>
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
        <div className="text-center mb-6">
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
          className="cyber-card p-6 md:p-8 max-h-[75vh] overflow-y-auto"
        >
          {/* Mode tabs */}
          <div className="flex gap-1 mb-4">
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 py-2 px-1 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
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
              className={`flex-1 py-2 px-1 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
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
              className={`flex-1 py-2 px-1 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
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
          <div
            className={`text-center mb-4 py-2 rounded border transition-colors duration-200 ${
              mode === "admin" 
                ? "border-destructive/30 bg-destructive/5" 
                : "border-primary/30 bg-primary/5"
            }`}
          >
            <p className={`text-xs font-mono flex items-center justify-center gap-2 transition-colors duration-200 ${
              mode === "admin" ? "text-destructive" : "text-primary"
            }`}>
              {getModeIcon()}
              {getModeTitle()}
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REGISTER MODE */}
            {mode === "register" && (
              <>
                {/* Team Name */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Team Name (Login ID)
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.teamName ? "border-destructive" : ""}`}
                    placeholder="e.g., Phantom_Hackers"
                    maxLength={30}
                  />
                  {errors.teamName && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.teamName}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`terminal-input w-full pr-10 ${errors.password ? "border-destructive" : ""}`}
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.confirmPassword ? "border-destructive" : ""}`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Leader Name */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Leader Name
                  </label>
                  <input
                    type="text"
                    name="leaderName"
                    value={formData.leaderName}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.leaderName ? "border-destructive" : ""}`}
                    placeholder="Full name"
                  />
                  {errors.leaderName && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.leaderName}
                    </p>
                  )}
                </div>

                {/* Leader Email */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Leader Email
                  </label>
                  <input
                    type="email"
                    name="leaderEmail"
                    value={formData.leaderEmail}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.leaderEmail ? "border-destructive" : ""}`}
                    placeholder="leader@institution.edu"
                  />
                  {errors.leaderEmail && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.leaderEmail}
                    </p>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Institution
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.institution ? "border-destructive" : ""}`}
                    placeholder="e.g., IIT Delhi"
                  />
                  {errors.institution && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.institution}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* LOGIN MODE */}
            {mode === "login" && (
              <>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Team Name
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.teamName ? "border-destructive" : ""}`}
                    placeholder="Enter your team name"
                  />
                  {errors.teamName && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.teamName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ADMIN MODE */}
            {mode === "admin" && (
              <>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className={`terminal-input w-full ${errors.adminEmail ? "border-destructive" : ""}`}
                    placeholder="admin@novus.ctf"
                  />
                  {errors.adminEmail && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.adminEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </>
            )}

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
                  <span>{mode === "register" ? "Registering..." : "Authenticating..."}</span>
                </>
              ) : (
                <>
                  {getModeIcon()}
                  <span>
                    {mode === "register" && "Register Team"}
                    {mode === "login" && "Login"}
                    {mode === "admin" && "Admin Login"}
                  </span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-border text-center">
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
          className="mt-4 text-center"
        >
          <button
            onClick={() => navigate("/")}
            className="text-xs text-muted-foreground/50 hover:text-primary transition-colors font-mono"
          >
            [ BACK TO HOME ]
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
