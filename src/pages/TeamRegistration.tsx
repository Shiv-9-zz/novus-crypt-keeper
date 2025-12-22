import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Building2, User, Hash, AlertTriangle, Check, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const teamNameSchema = z.string().min(3, "Min 3 characters").max(30, "Max 30 characters");
const emailSchema = z.string().email("Invalid email");
const nameSchema = z.string().min(1, "Required");
const institutionSchema = z.string().min(1, "Required");

interface TeamData {
  teamName: string;
  teamLeader: string;
  teamLeaderEmail: string;
  teamSize: string;
  institution: string;
  members: string[];
}

const steps = [
  { id: 1, title: "Team Info", icon: Users },
  { id: 2, title: "Leader Details", icon: User },
  { id: 3, title: "Institution", icon: Building2 },
  { id: 4, title: "Confirm", icon: Check },
];

export default function TeamRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [teamData, setTeamData] = useState<TeamData>({
    teamName: "",
    teamLeader: "",
    teamLeaderEmail: "",
    teamSize: "2",
    institution: "",
    members: ["", "", ""],
  });

  const generateTeamId = () => {
    const prefix = "NVS";
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${random}`;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        const teamNameResult = teamNameSchema.safeParse(teamData.teamName.trim());
        if (!teamNameResult.success) {
          newErrors.teamName = teamNameResult.error.errors[0].message;
        }
        if (!teamData.teamSize) {
          newErrors.teamSize = "Select team size";
        }
        break;
      case 2:
        const leaderResult = nameSchema.safeParse(teamData.teamLeader.trim());
        if (!leaderResult.success) {
          newErrors.teamLeader = "Leader name required";
        }
        const emailResult = emailSchema.safeParse(teamData.teamLeaderEmail.trim());
        if (!emailResult.success) {
          newErrors.teamLeaderEmail = emailResult.error.errors[0].message;
        }
        break;
      case 3:
        const instResult = institutionSchema.safeParse(teamData.institution.trim());
        if (!instResult.success) {
          newErrors.institution = "Institution required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        setTeamId(generateTeamId());
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Insert team into database
      const { data: teamResult, error: teamError } = await supabase
        .from("teams")
        .insert({
          team_id: teamId,
          name: teamData.teamName.trim(),
          leader_name: teamData.teamLeader.trim(),
          leader_email: teamData.teamLeaderEmail.trim(),
          team_size: parseInt(teamData.teamSize),
          institution: teamData.institution.trim(),
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
        name: teamData.teamLeader.trim(),
        email: teamData.teamLeaderEmail.trim(),
      });

      // Store team ID in session for the vault
      sessionStorage.setItem("novus_team_id", teamId);
      sessionStorage.setItem("novus_team_name", teamData.teamName);

      toast.success("Team registered successfully!");
      navigate("/rules");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TeamData, value: string) => {
    setTeamData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <CyberBackground />
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6 border-b border-border"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span className="font-mono">TEAM REGISTRATION</span>
          </div>
        </div>
      </motion.header>

      {/* Progress Steps */}
      <div className="border-b border-border py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      currentStep > step.id
                        ? "bg-primary border-primary"
                        : currentStep === step.id
                        ? "border-primary text-primary"
                        : "border-border"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:block text-xs font-mono">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 md:w-16 h-px mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="cyber-card p-6 md:p-8"
        >
          {/* Step 1: Team Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Team Information</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a unique team name and specify your team size
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamData.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
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
                <p className="text-xs text-muted-foreground mt-1">
                  {teamData.teamName.length}/30 characters
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Team Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["2", "3", "4"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleChange("teamSize", size)}
                      className={`p-3 rounded border transition-all ${
                        teamData.teamSize === size
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg font-bold">{size}</span>
                      <span className="text-xs block text-muted-foreground">members</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Leader Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Team Leader</h2>
                <p className="text-sm text-muted-foreground">
                  The team leader will be the primary contact
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Leader Name
                </label>
                <input
                  type="text"
                  value={teamData.teamLeader}
                  onChange={(e) => handleChange("teamLeader", e.target.value)}
                  className={`terminal-input w-full ${errors.teamLeader ? "border-destructive" : ""}`}
                  placeholder="Full name"
                />
                {errors.teamLeader && (
                  <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.teamLeader}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Leader Email
                </label>
                <input
                  type="email"
                  value={teamData.teamLeaderEmail}
                  onChange={(e) => handleChange("teamLeaderEmail", e.target.value)}
                  className={`terminal-input w-full ${errors.teamLeaderEmail ? "border-destructive" : ""}`}
                  placeholder="leader@institution.edu"
                />
                {errors.teamLeaderEmail && (
                  <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.teamLeaderEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Institution */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Institution Details</h2>
                <p className="text-sm text-muted-foreground">
                  Provide your educational institution information
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={teamData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  className={`terminal-input w-full ${errors.institution ? "border-destructive" : ""}`}
                  placeholder="e.g., Indian Institute of Technology, Delhi"
                />
                {errors.institution && (
                  <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.institution}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Confirm Details</h2>
                <p className="text-sm text-muted-foreground">
                  Review your team information before submitting
                </p>
              </div>

              {/* Team ID */}
              <div className="p-4 bg-primary/5 border border-primary/30 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground font-mono uppercase">
                    Your Team ID
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary text-glow font-mono">{teamId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save this ID - you'll need it for support queries
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Team Name</span>
                  <span className="text-card-foreground font-medium">{teamData.teamName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Team Size</span>
                  <span className="text-card-foreground font-medium">{teamData.teamSize} members</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Team Leader</span>
                  <span className="text-card-foreground font-medium">{teamData.teamLeader}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground text-sm">Email</span>
                  <span className="text-card-foreground font-medium">{teamData.teamLeaderEmail}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground text-sm">Institution</span>
                  <span className="text-card-foreground font-medium text-right max-w-[200px]">
                    {teamData.institution}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && (
              <button onClick={handleBack} className="cyber-btn flex-1" disabled={loading}>
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button onClick={handleNext} className="cyber-btn-filled flex-1 flex items-center justify-center gap-2">
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cyber-btn-filled flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Register Team</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
