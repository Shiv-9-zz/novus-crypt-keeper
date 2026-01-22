import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Key, Globe, Search, Binary, Puzzle, 
  Download, ChevronRight, LogOut, Shield, FileText, 
  Send, AlertTriangle, CheckCircle2, XCircle, Trophy,
  ArrowLeft, Code, Database, Network, Terminal, Eye
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { BackButton } from "@/components/BackButton";

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

interface DomainInfo {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  challenges: Challenge[];
  solvedCount: number;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Crypto: Key,
  Web: Globe,
  OSINT: Search,
  Forensics: Binary,
  Reverse: Lock,
  Misc: Puzzle,
  Pwn: Terminal,
  Networking: Network,
  Steganography: Eye,
  Programming: Code,
  Database: Database,
};

const categoryDescriptions: Record<string, string> = {
  Crypto: "Break ciphers, decode messages, and crack encryption algorithms",
  Web: "Exploit web vulnerabilities and bypass security controls",
  OSINT: "Gather intelligence from open sources and public data",
  Forensics: "Analyze files, memory dumps, and digital artifacts",
  Reverse: "Decompile binaries and understand program logic",
  Misc: "Diverse challenges testing various skills",
  Pwn: "Exploit binary vulnerabilities and gain system access",
  Networking: "Analyze packets and exploit network protocols",
  Steganography: "Find hidden data within images and files",
  Programming: "Solve algorithmic and coding challenges",
  Database: "SQL injection and database exploitation",
};

const categoryColors: Record<string, string> = {
  Crypto: "from-yellow-500/20 to-amber-600/20 border-yellow-500/50",
  Web: "from-blue-500/20 to-cyan-600/20 border-blue-500/50",
  OSINT: "from-green-500/20 to-emerald-600/20 border-green-500/50",
  Forensics: "from-purple-500/20 to-violet-600/20 border-purple-500/50",
  Reverse: "from-red-500/20 to-rose-600/20 border-red-500/50",
  Misc: "from-gray-500/20 to-slate-600/20 border-gray-500/50",
  Pwn: "from-orange-500/20 to-red-600/20 border-orange-500/50",
  Networking: "from-teal-500/20 to-cyan-600/20 border-teal-500/50",
  Steganography: "from-pink-500/20 to-fuchsia-600/20 border-pink-500/50",
  Programming: "from-indigo-500/20 to-blue-600/20 border-indigo-500/50",
  Database: "from-emerald-500/20 to-green-600/20 border-emerald-500/50",
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
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("TEAM");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamDbId, setTeamDbId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);

  useEffect(() => {
    const storedTeamName = sessionStorage.getItem("novus_team_name");
    const storedTeamId = sessionStorage.getItem("novus_team_id");
    
    if (storedTeamName) setTeamName(storedTeamName);
    if (storedTeamId) setTeamId(storedTeamId);
    
    fetchTeamAndChallenges(storedTeamId);
  }, []);

  const fetchTeamAndChallenges = async (teamIdStr: string | null) => {
    try {
      if (teamIdStr) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("id")
          .eq("team_id", teamIdStr)
          .maybeSingle();
        
        if (teamData) {
          setTeamDbId(teamData.id);
          
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

      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_visible", true)
        .eq("is_locked", false)
        .order("points", { ascending: true });

      if (error) throw error;

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

  // Group challenges by domain/category
  const domains: DomainInfo[] = Object.entries(
    challenges.reduce((acc, challenge) => {
      const category = challenge.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(challenge);
      return acc;
    }, {} as Record<string, Challenge[]>)
  ).map(([name, domainChallenges]) => ({
    name,
    icon: categoryIcons[name] || Puzzle,
    description: categoryDescriptions[name] || "Test your skills in this domain",
    color: categoryColors[name] || "from-primary/20 to-primary/10 border-primary/50",
    challenges: domainChallenges,
    solvedCount: domainChallenges.filter(c => solvedChallenges.includes(c.id)).length,
  }));

  const currentDomain = domains.find(d => d.name === selectedDomain);

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
    if (!flagInput.trim() || !selectedChallenge || !teamDbId) return;
    
    setSubmitting(true);
    
    try {
      const isCorrect = flagInput.trim() === selectedChallenge.flag;
      
      await supabase.from("submissions").insert({
        team_id: teamDbId,
        challenge_id: selectedChallenge.id,
        submitted_flag: flagInput.trim(),
        is_correct: isCorrect,
      });

      if (isCorrect) {
        const { data: teamData } = await supabase
          .from("teams")
          .select("score")
          .eq("id", teamDbId)
          .single();
        
        if (teamData) {
          await supabase
            .from("teams")
            .update({ score: teamData.score + selectedChallenge.points })
            .eq("id", teamDbId);
        }

        await supabase
          .from("challenges")
          .update({ solve_count: selectedChallenge.solve_count + 1 })
          .eq("id", selectedChallenge.id);

        setShowSuccess(true);
        setSolvedChallenges(prev => [...prev, selectedChallenge.id]);
        
        setTimeout(() => {
          setShowSuccess(false);
          setFlagInput("");
        }, 2500);
      } else {
        setShowWrong(true);
        setTimeout(() => setShowWrong(false), 1500);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit flag");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDomains = () => {
    setSelectedDomain(null);
    setSelectedChallenge(null);
    setFlagInput("");
  };

  const handleBackToChallenges = () => {
    setSelectedChallenge(null);
    setFlagInput("");
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <CyberBackground />

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
                +{selectedChallenge?.points} POINTS
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrong Flag Overlay */}
      <AnimatePresence>
        {showWrong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-destructive/10 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.3, 1],
                  rotate: [0, -10, 10, -10, 0]
                }}
                transition={{ duration: 0.6 }}
              >
                <XCircle className="w-32 h-32 text-destructive mx-auto mb-6" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-destructive mb-4"
              >
                ACCESS DENIED
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-muted-foreground font-mono"
              >
                Incorrect flag. Try again!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <BackButton to="/rules" label="Back to Rules" />
          <Logo size="sm" animate={false} />
        </div>
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

      {/* Navigation breadcrumb */}
      {(selectedDomain || selectedChallenge) && (
        <div className="border-b border-border px-4 py-2 flex items-center gap-2 text-sm relative z-10">
          <button
            onClick={handleBackToDomains}
            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Domains
          </button>
          {selectedDomain && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                onClick={handleBackToChallenges}
                className={`${selectedChallenge ? "text-muted-foreground hover:text-primary" : "text-primary"} transition-colors`}
              >
                {selectedDomain}
              </button>
            </>
          )}
          {selectedChallenge && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-primary">{selectedChallenge.title}</span>
            </>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Domain Selection View */}
          {!selectedDomain && (
            <motion.div
              key="domains"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-primary text-glow mb-2">
                  CHALLENGE VAULT
                </h1>
                <p className="text-muted-foreground">
                  Choose a domain to begin your journey
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>{domains.length} Domains</span>
                  <span>•</span>
                  <span>{challenges.length} Challenges</span>
                  <span>•</span>
                  <span className="text-primary">{solvedChallenges.length} Solved</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map((domain, index) => {
                  const DomainIcon = domain.icon;
                  const progress = domain.challenges.length > 0 
                    ? (domain.solvedCount / domain.challenges.length) * 100 
                    : 0;
                  
                  return (
                    <motion.button
                      key={domain.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDomain(domain.name)}
                      className={`cyber-card p-6 text-left hover:scale-[1.02] transition-all bg-gradient-to-br ${domain.color} group`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-background/50 border border-border group-hover:border-primary/50 transition-colors">
                          <DomainIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary font-mono">
                            {domain.challenges.length}
                          </p>
                          <p className="text-xs text-muted-foreground">challenges</p>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-card-foreground mb-2">
                        {domain.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {domain.description}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary font-mono">
                            {domain.solvedCount}/{domain.challenges.length}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-background/50 rounded overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Challenge List View */}
          {selectedDomain && !selectedChallenge && currentDomain && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-2">
                  <currentDomain.icon className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-bold text-primary text-glow">
                    {currentDomain.name}
                  </h1>
                </div>
                <p className="text-muted-foreground">{currentDomain.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-primary">{currentDomain.solvedCount}</span> of {currentDomain.challenges.length} completed
                </p>
              </div>

              <div className="space-y-3">
                {currentDomain.challenges.map((challenge, index) => {
                  const isSolved = solvedChallenges.includes(challenge.id);
                  const ChallengeIcon = categoryIcons[challenge.category] || Puzzle;
                  
                  return (
                    <motion.button
                      key={challenge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedChallenge(challenge)}
                      className={`cyber-card w-full p-4 text-left hover:border-primary/50 transition-all flex items-center gap-4 ${
                        isSolved ? "bg-primary/5 border-primary/30" : ""
                      }`}
                    >
                      <div className={`p-2 rounded ${isSolved ? "bg-primary/20" : "bg-muted"}`}>
                        {isSolved ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <ChallengeIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold ${isSolved ? "text-primary" : "text-card-foreground"}`}>
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {challenge.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className={`text-xs font-mono ${difficultyColors[challenge.difficulty]}`}>
                            {challenge.difficulty.toUpperCase()}
                          </p>
                          <p className="text-sm font-bold text-primary font-mono">
                            {challenge.points} PTS
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Challenge Detail View */}
          {selectedChallenge && (
            <motion.div
              key="challenge-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div
                className={`cyber-card p-6 md:p-8 ${showWrong ? "animate-shake border-destructive" : ""}`}
              >
                {/* Challenge header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10 border border-primary/30">
                      {(() => {
                        const CategoryIcon = categoryIcons[selectedChallenge.category] || Puzzle;
                        return <CategoryIcon className="w-6 h-6 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-mono uppercase">
                        {selectedChallenge.category}
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-primary text-glow">
                        {selectedChallenge.title}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono ${difficultyColors[selectedChallenge.difficulty]}`}>
                      {selectedChallenge.difficulty.toUpperCase()}
                    </span>
                    <p className="text-lg font-bold text-primary font-mono">
                      {selectedChallenge.points} PTS
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6 p-4 bg-muted/30 rounded border border-border">
                  <p className="text-card-foreground leading-relaxed">
                    {selectedChallenge.description}
                  </p>
                </div>

                {/* Hint */}
                {selectedChallenge.hint && (
                  <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded">
                    <h3 className="text-sm text-accent mb-2 font-mono uppercase tracking-wider">
                      Hint
                    </h3>
                    <p className="text-card-foreground text-sm">
                      {selectedChallenge.hint}
                    </p>
                  </div>
                )}

                {/* Files */}
                {selectedChallenge.files && selectedChallenge.files.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wider">
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {selectedChallenge.files.map((file) => (
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
                {solvedChallenges.includes(selectedChallenge.id) ? (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-primary font-bold">Already Solved!</p>
                      <p className="text-sm text-muted-foreground">You've already captured this flag.</p>
                    </div>
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
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
