import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Key, Globe, Search, Binary, Puzzle, 
  Download, ChevronRight, LogOut, Shield, FileText, 
  Send, AlertTriangle, CheckCircle2, XCircle, Trophy
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { HauntedEffects } from "@/components/HauntedEffects";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChallengeFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: string;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  description: string;
  points: number;
  hint: string | null;
  flag: string;
  is_locked: boolean;
  solve_count: number;
  files: ChallengeFile[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Crypto: Key,
  Web: Globe,
  OSINT: Search,
  Forensics: Binary,
  Reverse: Lock,
  Misc: Puzzle,
};

const difficultyColors: Record<string, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-orange-500",
  insane: "text-red-500",
};

export default function ChallengeVault() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("TEAM");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamDbId, setTeamDbId] = useState<string | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const storedTeamName = sessionStorage.getItem("novus_team_name");
    const storedTeamId = sessionStorage.getItem("novus_team_id");
    
    if (storedTeamName) setTeamName(storedTeamName);
    if (storedTeamId) setTeamId(storedTeamId);
    
    fetchTeamAndChallenges(storedTeamId);
  }, []);

  const fetchTeamAndChallenges = async (teamIdStr: string | null) => {
    try {
      // Get team's database ID
      if (teamIdStr) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("id")
          .eq("team_id", teamIdStr)
          .maybeSingle();
        
        if (teamData) {
          setTeamDbId(teamData.id);
          
          // Get already solved challenges for this team
          const { data: submissions } = await supabase
            .from("submissions")
            .select("challenge_id")
            .eq("team_id", teamData.id)
            .eq("is_correct", true);
          
          if (submissions) {
            setSolvedChallenges(submissions.map(s => s.challenge_id));
          }
        }
      }

      // Fetch visible challenges ordered by points
      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_visible", true)
        .eq("is_locked", false)
        .order("points", { ascending: true });

      if (error) throw error;

      // Fetch files for each challenge
      const challengesWithFiles = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { data: files } = await supabase
            .from("challenge_files")
            .select("*")
            .eq("challenge_id", challenge.id);
          
          return {
            ...challenge,
            files: files || [],
          };
        })
      );

      setChallenges(challengesWithFiles as Challenge[]);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const currentChallenge = challenges[currentIndex];
  const CategoryIcon = currentChallenge ? (categoryIcons[currentChallenge.category] || Puzzle) : Puzzle;

  const handleDownloadFile = async (file: ChallengeFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("challenge-files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handleSubmitFlag = async () => {
    if (!flagInput.trim() || !currentChallenge || !teamDbId) return;
    
    setSubmitting(true);
    setAttempts(prev => prev + 1);
    
    try {
      // Record the submission
      const isCorrect = flagInput.trim() === currentChallenge.flag;
      
      await supabase.from("submissions").insert({
        team_id: teamDbId,
        challenge_id: currentChallenge.id,
        submitted_flag: flagInput.trim(),
        is_correct: isCorrect,
      });

      if (isCorrect) {
        // Update team score
        const { data: teamData } = await supabase
          .from("teams")
          .select("score")
          .eq("id", teamDbId)
          .single();
        
        if (teamData) {
          await supabase
            .from("teams")
            .update({ score: teamData.score + currentChallenge.points })
            .eq("id", teamDbId);
        }

        // Update solve count
        await supabase
          .from("challenges")
          .update({ solve_count: currentChallenge.solve_count + 1 })
          .eq("id", currentChallenge.id);

        // Show success screen
        setShowSuccess(true);
        setSolvedChallenges(prev => [...prev, currentChallenge.id]);
        
        // Move to next challenge after animation
        setTimeout(() => {
          setShowSuccess(false);
          if (currentIndex < challenges.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlagInput("");
            setAttempts(0);
          } else {
            setAllCompleted(true);
          }
        }, 2500);
      } else {
        // Show wrong animation
        setShowWrong(true);
        setTimeout(() => setShowWrong(false), 1000);
        toast.error("Incorrect flag. Try again!");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit flag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextChallenge = () => {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setFlagInput("");
      setAttempts(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading challenges...</div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="cyber-card p-12 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">No Challenges Available</h2>
          <p className="text-muted-foreground">Check back later for new challenges.</p>
        </div>
      </div>
    );
  }

  if (allCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="cyber-card p-12 text-center max-w-md"
        >
          <Trophy className="w-20 h-20 text-primary mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-primary text-glow mb-4">CONGRATULATIONS!</h2>
          <p className="text-muted-foreground mb-6">
            You've completed all available challenges!
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            Team: {teamName}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <CyberBackground />
      <HauntedEffects />

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 className="w-32 h-32 text-primary mx-auto mb-6" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-primary text-glow mb-4"
              >
                FLAG VERIFIED!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl text-muted-foreground font-mono"
              >
                +{currentChallenge?.points} POINTS
              </motion.p>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-muted-foreground mt-4"
              >
                Loading next challenge...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between">
        <Logo size="sm" animate={false} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground font-mono">{teamName}</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-mono">
            CHALLENGE {currentIndex + 1} OF {challenges.length}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            ATTEMPTS: {attempts}
          </span>
        </div>
        <div className="w-full h-1 bg-muted rounded overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / challenges.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <motion.div
          key={currentChallenge.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className={`cyber-card p-6 md:p-8 max-w-2xl w-full ${showWrong ? "animate-shake border-destructive" : ""}`}
        >
          {/* Challenge header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10 border border-primary/30">
                <CategoryIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-mono uppercase">
                  {currentChallenge.category}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-primary text-glow">
                  {currentChallenge.title}
                </h2>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-mono ${difficultyColors[currentChallenge.difficulty]}`}>
                {currentChallenge.difficulty.toUpperCase()}
              </span>
              <p className="text-lg font-bold text-primary font-mono">
                {currentChallenge.points} PTS
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6 p-4 bg-muted/30 rounded border border-border">
            <p className="text-card-foreground leading-relaxed">
              {currentChallenge.description}
            </p>
          </div>

          {/* Hint */}
          {currentChallenge.hint && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded">
              <h3 className="text-sm text-accent mb-2 font-mono uppercase tracking-wider">
                Hint
              </h3>
              <p className="text-card-foreground text-sm">
                {currentChallenge.hint}
              </p>
            </div>
          )}

          {/* Files */}
          {currentChallenge.files && currentChallenge.files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wider">
                Attachments
              </h3>
              <div className="space-y-2">
                {currentChallenge.files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleDownloadFile(file)}
                    className="w-full flex items-center justify-between p-3 rounded border border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-card-foreground">{file.file_name}</span>
                      <span className="text-xs text-muted-foreground">({file.file_size})</span>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flag submission */}
          {solvedChallenges.includes(currentChallenge.id) ? (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <div>
                <p className="text-primary font-bold">Already Solved!</p>
                <p className="text-sm text-muted-foreground">You've already captured this flag.</p>
              </div>
              {currentIndex < challenges.length - 1 && (
                <button
                  onClick={handleNextChallenge}
                  className="ml-auto cyber-btn-filled flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wider">
                Submit Flag
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitFlag()}
                  placeholder="NOVUS{...}"
                  className="terminal-input flex-1 font-mono"
                  disabled={submitting}
                />
                <button
                  onClick={handleSubmitFlag}
                  disabled={submitting || !flagInput.trim()}
                  className="cyber-btn-filled px-6 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Flag format: NOVUS&#123;...&#125;
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Custom CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
