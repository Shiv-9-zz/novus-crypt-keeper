import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Key, Globe, Search, Binary, Puzzle, 
  Download, X, ChevronDown, LogOut, Menu,
  Shield, FileText, Archive, Send, AlertTriangle
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
  is_locked: boolean;
  files: ChallengeFile[];
}

const categories = [
  { id: "all", name: "All Challenges", icon: Puzzle },
  { id: "Crypto", name: "Cryptography", icon: Key },
  { id: "Web", name: "Web Exploitation", icon: Globe },
  { id: "OSINT", name: "OSINT", icon: Search },
  { id: "Forensics", name: "Forensics", icon: Binary },
  { id: "Reverse", name: "Reverse Engineering", icon: Lock },
  { id: "Misc", name: "Miscellaneous", icon: Puzzle },
];

const difficultyColors: Record<string, string> = {
  easy: "diff-easy",
  medium: "diff-medium",
  hard: "diff-hard",
  insane: "diff-insane",
};

const categoryBadges: Record<string, string> = {
  Crypto: "badge-crypto",
  Web: "badge-web",
  OSINT: "badge-osint",
  Forensics: "badge-forensics",
  Reverse: "badge-reverse",
  Misc: "badge-misc",
};

export default function ChallengeVault() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("TEAM");
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedTeamName = sessionStorage.getItem("novus_team_name");
    if (storedTeamName) {
      setTeamName(storedTeamName);
    }
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: challengesData, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_visible", true)
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

  const filteredChallenges =
    selectedCategory === "all"
      ? challenges
      : challenges.filter((c) => c.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Puzzle;
  };

  const handleDownloadFile = async (file: ChallengeFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("challenge-files")
        .download(file.file_path);

      if (error) throw error;

      // Create download link
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
    if (!flagInput.trim() || !selectedChallenge) return;
    
    setSubmitting(true);
    
    // Get team ID from session
    const teamId = sessionStorage.getItem("novus_team_id");
    
    // For now, just show a message - in production, you'd verify against the actual flag
    // This requires server-side validation to prevent cheating
    toast.info("Flag submitted for verification!");
    setFlagInput("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <CyberBackground />
      <HauntedEffects />
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-72 h-screen bg-card border-r border-border z-50 md:z-auto transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Logo size="sm" animate={false} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-muted-foreground hover:text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all text-left ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-card-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{category.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-destructive transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-muted-foreground hover:text-primary"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary glitch" data-text="Challenge Vault">Challenge Vault</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {filteredChallenges.length} challenges available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground font-mono">TEAM: {teamName}</span>
            </div>
          </div>
        </header>

        {/* Challenge grid */}
        <div className="p-4 md:p-6">
          {filteredChallenges.length === 0 ? (
            <div className="cyber-card p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No challenges available in this category</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChallenges.map((challenge, index) => {
                const CategoryIcon = getCategoryIcon(challenge.category);
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => !challenge.is_locked && setSelectedChallenge(challenge)}
                    className={`cyber-card p-5 cursor-pointer noise ${
                      challenge.is_locked ? "opacity-50 cursor-not-allowed" : "hover:glitch-box"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded ${categoryBadges[challenge.category] || "badge-misc"} border`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-mono ${difficultyColors[challenge.difficulty]}`}>
                        {challenge.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-card-foreground mb-2 flex items-center gap-2">
                      {challenge.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                      {challenge.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {challenge.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary font-mono">{challenge.points} PTS</span>
                      {challenge.files && challenge.files.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Archive className="w-3 h-3" />
                          <span>{challenge.files.length} file(s)</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedChallenge(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="cyber-card p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs border ${categoryBadges[selectedChallenge.category] || "badge-misc"}`}>
                      {selectedChallenge.category.toUpperCase()}
                    </span>
                    <span className={`text-xs font-mono ${difficultyColors[selectedChallenge.difficulty]}`}>
                      {selectedChallenge.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary text-glow">
                    {selectedChallenge.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Points */}
              <div className="mb-6 p-4 bg-primary/5 border border-primary/30 rounded">
                <p className="text-sm text-muted-foreground mb-1">Challenge Value</p>
                <p className="text-3xl font-bold text-primary font-mono">
                  {selectedChallenge.points} <span className="text-lg">POINTS</span>
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  Briefing
                </h3>
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
              <div className="mb-4">
                <h3 className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wider">
                  Submit Flag
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    placeholder="NOVUS{...}"
                    className="terminal-input flex-1 font-mono"
                  />
                  <button
                    onClick={handleSubmitFlag}
                    disabled={submitting || !flagInput.trim()}
                    className="cyber-btn-filled px-4 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit
                  </button>
                </div>
              </div>

              {/* Format hint */}
              <div className="p-4 bg-muted rounded">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <ChevronDown className="w-4 h-4" />
                  <span>Flag format: NOVUS&#123;...&#125;</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
