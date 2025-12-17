import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Key, Globe, Search, Binary, Puzzle, 
  Download, X, ChevronDown, LogOut, Menu,
  Shield, FileText, Archive
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { useNavigate } from "react-router-dom";

interface Challenge {
  id: string;
  title: string;
  category: "crypto" | "web" | "osint" | "forensics" | "reverse" | "misc";
  difficulty: "easy" | "medium" | "hard" | "insane";
  description: string;
  points: number;
  files?: { name: string; type: string }[];
  locked?: boolean;
}

const categories = [
  { id: "all", name: "All Challenges", icon: Puzzle },
  { id: "crypto", name: "Cryptography", icon: Key },
  { id: "web", name: "Web Exploitation", icon: Globe },
  { id: "osint", name: "OSINT", icon: Search },
  { id: "forensics", name: "Forensics", icon: Binary },
  { id: "reverse", name: "Reverse Engineering", icon: Lock },
  { id: "misc", name: "Miscellaneous", icon: Puzzle },
];

const challenges: Challenge[] = [
  {
    id: "crypto-1",
    title: "Whispers in the Void",
    category: "crypto",
    difficulty: "easy",
    description: "The ancients spoke in riddles. A cipher most classical hides the truth within these forgotten scrolls. The key lies where Caesar once walked...",
    points: 100,
    files: [{ name: "cipher.txt", type: "txt" }],
  },
  {
    id: "crypto-2",
    title: "The Quantum Paradox",
    category: "crypto",
    difficulty: "hard",
    description: "In realms where Schrödinger's equations govern reality, encryption takes on new meaning. Decode the quantum-entangled message before observation collapses the wavefunction.",
    points: 400,
    files: [{ name: "quantum_state.bin", type: "bin" }, { name: "measurement.py", type: "txt" }],
  },
  {
    id: "web-1",
    title: "Shadow Injection",
    category: "web",
    difficulty: "medium",
    description: "A dark web marketplace hides its secrets behind layers of authentication. But every fortress has its weakness. Find the injection point in the shadows.",
    points: 200,
  },
  {
    id: "web-2",
    title: "Cookie Monster",
    category: "web",
    difficulty: "easy",
    description: "The server remembers you through mystical tokens. Perhaps these cookies hold more than just session data...",
    points: 100,
  },
  {
    id: "osint-1",
    title: "Digital Footprints",
    category: "osint",
    difficulty: "medium",
    description: "Agent X left traces across the digital realm. Follow the breadcrumbs through social networks, archives, and forgotten corners of the internet.",
    points: 250,
    files: [{ name: "profile_image.png", type: "bin" }],
  },
  {
    id: "forensics-1",
    title: "Memory Fragments",
    category: "forensics",
    difficulty: "hard",
    description: "A compromised system's memory dump contains evidence of intrusion. Sift through the digital debris to uncover the attacker's trail.",
    points: 350,
    files: [{ name: "memdump.raw", type: "bin" }],
    locked: true,
  },
  {
    id: "forensics-2",
    title: "The Hidden Layer",
    category: "forensics",
    difficulty: "medium",
    description: "This image appears innocent, but beneath its surface lies encrypted data. Employ steganographic techniques to reveal what's concealed.",
    points: 200,
    files: [{ name: "innocent.png", type: "bin" }],
  },
  {
    id: "reverse-1",
    title: "Binary Necromancy",
    category: "reverse",
    difficulty: "insane",
    description: "Raise the dead code from this heavily obfuscated binary. Anti-debugging tricks, packed sections, and virtual machine protection guard its secrets.",
    points: 500,
    files: [{ name: "necromancer.exe", type: "bin" }],
  },
  {
    id: "reverse-2",
    title: "Protocol Specter",
    category: "reverse",
    difficulty: "hard",
    description: "A custom protocol communicates with the command server. Reverse engineer the binary to understand its language and forge your own messages.",
    points: 400,
    files: [{ name: "client.elf", type: "bin" }, { name: "capture.pcap", type: "bin" }],
  },
  {
    id: "misc-1",
    title: "Esoteric Transmissions",
    category: "misc",
    difficulty: "easy",
    description: "Strange signals emanate from an unknown source. The encoding scheme defies conventional wisdom. Think outside the binary box.",
    points: 150,
    files: [{ name: "signal.wav", type: "bin" }],
  },
];

const difficultyColors = {
  easy: "diff-easy",
  medium: "diff-medium",
  hard: "diff-hard",
  insane: "diff-insane",
};

const categoryBadges = {
  crypto: "badge-crypto",
  web: "badge-web",
  osint: "badge-osint",
  forensics: "badge-forensics",
  reverse: "badge-reverse",
  misc: "badge-misc",
};

export default function ChallengeVault() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredChallenges =
    selectedCategory === "all"
      ? challenges
      : challenges.filter((c) => c.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat?.icon || Puzzle;
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <CyberBackground />
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
                <h1 className="text-xl font-bold text-primary">Challenge Vault</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {filteredChallenges.length} challenges available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground font-mono">TEAM: PHANTOM_01</span>
            </div>
          </div>
        </header>

        {/* Challenge grid */}
        <div className="p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChallenges.map((challenge, index) => {
              const CategoryIcon = getCategoryIcon(challenge.category);
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !challenge.locked && setSelectedChallenge(challenge)}
                  className={`cyber-card p-5 cursor-pointer ${
                    challenge.locked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded ${categoryBadges[challenge.category]} border`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-mono ${difficultyColors[challenge.difficulty]}`}>
                      {challenge.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-card-foreground mb-2 flex items-center gap-2">
                    {challenge.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    {challenge.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {challenge.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-mono">{challenge.points} PTS</span>
                    {challenge.files && (
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
                    <span className={`px-2 py-1 rounded text-xs border ${categoryBadges[selectedChallenge.category]}`}>
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

              {/* Files */}
              {selectedChallenge.files && selectedChallenge.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wider">
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {selectedChallenge.files.map((file, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between p-3 rounded border border-border hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-card-foreground">{file.name}</span>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint */}
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
