import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, ArrowRight, User, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const memberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long").optional().or(z.literal("")),
});

interface TeamMember {
  id?: string;
  name: string;
  email: string;
}

export default function TeamMembers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamDbId, setTeamDbId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [members, setMembers] = useState<TeamMember[]>([{ name: "", email: "" }]);
  const [existingMembers, setExistingMembers] = useState<TeamMember[]>([]);
  const [hasExistingMembers, setHasExistingMembers] = useState(false);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    const init = async () => {
      const storedTeamId = sessionStorage.getItem("novus_team_id");
      const storedTeamName = sessionStorage.getItem("novus_team_name");
      
      if (!storedTeamId) {
        toast.error("No team found. Please register first.");
        navigate("/login");
        return;
      }
      
      setTeamId(storedTeamId);
      setTeamName(storedTeamName || "Your Team");

      // Get team database ID
      const { data: teamData } = await supabase
        .from("teams")
        .select("id")
        .eq("team_id", storedTeamId)
        .maybeSingle();

      if (teamData) {
        setTeamDbId(teamData.id);

        // Check for existing members
        const { data: membersData } = await supabase
          .from("team_members")
          .select("id, name, email")
          .eq("team_id", teamData.id);

        if (membersData && membersData.length > 0) {
          setExistingMembers(membersData.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email || ""
          })));
          setHasExistingMembers(true);
        }
      }
      
      setLoading(false);
    };

    init();
  }, [navigate]);

  const addMember = () => {
    if (members.length < 3) {
      setMembers([...members, { name: "", email: "" }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
    
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  const validateMembers = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};
    let isValid = true;

    members.forEach((member, index) => {
      if (member.name.trim() || member.email.trim()) {
        const result = memberSchema.safeParse(member);
        if (!result.success) {
          newErrors[index] = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              newErrors[index][err.path[0] as string] = err.message;
            }
          });
          isValid = false;
        }
      }
    });

    const hasValidMember = members.some((m) => m.name.trim().length >= 2);
    if (!hasValidMember) {
      toast.error("Please add at least one team member");
      return false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateMembers() || !teamDbId) return;

    setSaving(true);
    try {
      const validMembers = members
        .filter((m) => m.name.trim().length >= 2)
        .map((m) => ({
          team_id: teamDbId,
          name: m.name.trim(),
          email: m.email.trim() || null,
        }));

      const { error: insertError } = await supabase
        .from("team_members")
        .insert(validMembers);

      if (insertError) throw insertError;

      // Update team size
      const totalMembers = existingMembers.length + validMembers.length;
      await supabase
        .from("teams")
        .update({ team_size: totalMembers + 1 }) // +1 for leader
        .eq("id", teamDbId);

      toast.success("Team members added successfully!");
      navigate("/rules");
    } catch (error: any) {
      console.error("Error adding team members:", error);
      toast.error(error.message || "Failed to add team members");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    navigate("/rules");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  // If team already has members, show them and allow continuing
  if (hasExistingMembers) {
    return (
      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <CyberBackground />
        
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-6 border-b border-border"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/login" label="Back to Login" />
              <Logo size="sm" animate={false} />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              <span className="font-mono">TEAM SETUP</span>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="cyber-card p-6 md:p-8">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold text-primary text-glow mb-2">
                  TEAM READY
                </h1>
                <p className="text-muted-foreground text-sm">
                  Team: <span className="text-primary font-mono">{teamName}</span>
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-mono text-muted-foreground mb-3">TEAM MEMBERS</h2>
                <div className="space-y-2">
                  {existingMembers.map((member, index) => (
                    <div key={member.id || index} className="flex items-center gap-3 p-3 rounded border border-border bg-card/50">
                      <User className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm text-foreground">{member.name}</p>
                        {member.email && (
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full cyber-btn cyber-btn-filled flex items-center justify-center gap-2"
              >
                <span>Continue to Rules</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <CyberBackground />
      
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6 border-b border-border"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/login" label="Back to Login" />
            <Logo size="sm" animate={false} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span className="font-mono">TEAM SETUP</span>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="cyber-card p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-primary text-glow mb-2">
                ADD TEAM MEMBERS
              </h1>
              <p className="text-muted-foreground text-sm">
                Team: <span className="text-primary font-mono">{teamName}</span>
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Add up to 3 additional members (excluding the team leader)
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {members.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Member {index + 1}
                    </span>
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Name *"
                        value={member.name}
                        onChange={(e) => updateMember(index, "name", e.target.value)}
                        className={`cyber-input w-full ${
                          errors[index]?.name ? "border-destructive" : ""
                        }`}
                      />
                      {errors[index]?.name && (
                        <p className="text-destructive text-xs mt-1">
                          {errors[index].name}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={member.email}
                        onChange={(e) => updateMember(index, "email", e.target.value)}
                        className={`cyber-input w-full ${
                          errors[index]?.email ? "border-destructive" : ""
                        }`}
                      />
                      {errors[index]?.email && (
                        <p className="text-destructive text-xs mt-1">
                          {errors[index].email}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {members.length < 3 && (
              <motion.button
                type="button"
                onClick={addMember}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full cyber-btn flex items-center justify-center gap-2 mb-6"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Member</span>
              </motion.button>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                type="button"
                onClick={handleContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 cyber-btn text-muted-foreground"
              >
                Skip for Now
              </motion.button>
              
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.98 } : {}}
                className="flex-1 cyber-btn cyber-btn-filled flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
