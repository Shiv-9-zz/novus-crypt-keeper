import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Upload,
  Users,
  LogOut,
  Search,
  X,
  FileText,
  Download,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { toast } from "sonner";

type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  description: string;
  points: number;
  isLocked: boolean;
  isVisible: boolean;
  files: { name: string; size: string }[];
};

type Team = {
  id: string;
  name: string;
  leader: string;
  email: string;
  size: number;
  institution: string;
  registeredAt: string;
};

// Mock data
const mockChallenges: Challenge[] = [
  {
    id: "1",
    title: "Ancient Cipher",
    category: "Crypto",
    difficulty: "easy",
    description: "Decode the ancient message hidden within the encryption.",
    points: 100,
    isLocked: false,
    isVisible: true,
    files: [{ name: "cipher.txt", size: "2 KB" }],
  },
  {
    id: "2",
    title: "Shadow Protocol",
    category: "Web",
    difficulty: "medium",
    description: "Breach the shadow network's authentication system.",
    points: 200,
    isLocked: false,
    isVisible: true,
    files: [],
  },
  {
    id: "3",
    title: "Ghost in the Machine",
    category: "Forensics",
    difficulty: "hard",
    description: "Recover the deleted secrets from the corrupted drive.",
    points: 350,
    isLocked: true,
    isVisible: false,
    files: [{ name: "drive.img", size: "50 MB" }],
  },
];

const mockTeams: Team[] = [
  {
    id: "NVS-1A2B",
    name: "Phantom Coders",
    leader: "Arun Kumar",
    email: "arun@example.com",
    size: 4,
    institution: "IIT Delhi",
    registeredAt: "2025-01-15",
  },
  {
    id: "NVS-3C4D",
    name: "Binary Ghosts",
    leader: "Priya Singh",
    email: "priya@example.com",
    size: 3,
    institution: "BITS Pilani",
    registeredAt: "2025-01-16",
  },
];

const categories = ["Crypto", "Web", "OSINT", "Forensics", "Reverse", "Misc"];
const difficulties = ["easy", "medium", "hard", "insane"] as const;

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"challenges" | "teams">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [teams] = useState<Team[]>(mockTeams);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<Partial<Challenge>>({
    title: "",
    category: "Crypto",
    difficulty: "easy",
    description: "",
    points: 100,
    isLocked: false,
    isVisible: true,
    files: [],
  });

  const filteredChallenges = challenges.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChallenge = () => {
    setEditingChallenge(null);
    setFormData({
      title: "",
      category: "Crypto",
      difficulty: "easy",
      description: "",
      points: 100,
      isLocked: false,
      isVisible: true,
      files: [],
    });
    setShowModal(true);
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData(challenge);
    setShowModal(true);
  };

  const handleSaveChallenge = () => {
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    if (editingChallenge) {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === editingChallenge.id ? { ...c, ...formData } as Challenge : c
        )
      );
      toast.success("Challenge updated");
    } else {
      const newChallenge: Challenge = {
        id: `${Date.now()}`,
        title: formData.title!,
        category: formData.category!,
        difficulty: formData.difficulty!,
        description: formData.description!,
        points: formData.points!,
        isLocked: formData.isLocked!,
        isVisible: formData.isVisible!,
        files: formData.files || [],
      };
      setChallenges((prev) => [...prev, newChallenge]);
      toast.success("Challenge created");
    }
    setShowModal(false);
  };

  const handleDeleteChallenge = (id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    toast.success("Challenge deleted");
  };

  const toggleLock = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
  };

  const toggleVisibility = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c))
    );
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "hard":
        return "text-orange-400";
      case "insane":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-xs font-mono text-accent uppercase tracking-wider px-2 py-1 bg-accent/10 rounded">
              Admin Panel
            </span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === "challenges"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Shield className="w-4 h-4" />
            Challenges ({challenges.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === "teams"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Users className="w-4 h-4" />
            Teams ({teams.length})
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="terminal-input w-full pl-10"
            />
          </div>
          {activeTab === "challenges" && (
            <button onClick={handleCreateChallenge} className="cyber-btn-filled flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Challenge
            </button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "challenges" ? (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredChallenges.length === 0 ? (
                <div className="cyber-card p-12 text-center">
                  <p className="text-muted-foreground">No challenges found</p>
                </div>
              ) : (
                filteredChallenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    layout
                    className="cyber-card p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-card-foreground">
                            {challenge.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${
                              challenge.category === "Crypto"
                                ? "badge-crypto"
                                : challenge.category === "Web"
                                ? "badge-web"
                                : challenge.category === "OSINT"
                                ? "badge-osint"
                                : challenge.category === "Forensics"
                                ? "badge-forensics"
                                : challenge.category === "Reverse"
                                ? "badge-reverse"
                                : "badge-misc"
                            }`}
                          >
                            {challenge.category}
                          </span>
                          <span className={`text-xs font-mono uppercase ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-xs text-accent font-mono">{challenge.points} pts</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {challenge.description}
                        </p>
                        {challenge.files.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {challenge.files.length} file(s) attached
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVisibility(challenge.id)}
                          className={`p-2 rounded border transition-all ${
                            challenge.isVisible
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                          title={challenge.isVisible ? "Visible" : "Hidden"}
                        >
                          {challenge.isVisible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleLock(challenge.id)}
                          className={`p-2 rounded border transition-all ${
                            challenge.isLocked
                              ? "border-destructive text-destructive"
                              : "border-border text-muted-foreground"
                          }`}
                          title={challenge.isLocked ? "Locked" : "Unlocked"}
                        >
                          {challenge.isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditChallenge(challenge)}
                          className="p-2 rounded border border-border text-muted-foreground hover:border-accent hover:text-accent transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className="p-2 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="cyber-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-4">Team ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Leader</th>
                        <th className="px-6 py-4">Institution</th>
                        <th className="px-6 py-4">Size</th>
                        <th className="px-6 py-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTeams.map((team) => (
                        <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-primary">
                            {team.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-card-foreground font-medium">
                            {team.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-card-foreground">{team.leader}</div>
                            <div className="text-xs text-muted-foreground">{team.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {team.institution}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {team.size} members
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(team.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredTeams.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    No teams found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Challenge Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-card-foreground">
                  {editingChallenge ? "Edit Challenge" : "Create Challenge"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="terminal-input w-full"
                    placeholder="Challenge title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="terminal-input w-full appearance-none pr-10"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                      Difficulty
                    </label>
                    <div className="relative">
                      <select
                        value={formData.difficulty}
                        onChange={(e) =>
                          setFormData({ ...formData, difficulty: e.target.value as Challenge["difficulty"] })
                        }
                        className="terminal-input w-full appearance-none pr-10"
                      >
                        {difficulties.map((diff) => (
                          <option key={diff} value={diff}>
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Points
                  </label>
                  <input
                    type="number"
                    value={formData.points || ""}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="terminal-input w-full"
                    min="0"
                    step="50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="terminal-input w-full min-h-[100px] resize-y"
                    placeholder="Cryptic challenge description..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Challenge Files
                  </label>
                  <div className="border border-dashed border-border rounded p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: .zip, .txt, .pdf, .bin
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".zip,.txt,.pdf,.bin"
                    />
                  </div>
                  {formData.files && formData.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-card-foreground">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({file.size})</span>
                          </div>
                          <button className="text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border border-border rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-all">
                      {formData.isVisible && <Eye className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-card-foreground">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLocked}
                      onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border border-border rounded flex items-center justify-center peer-checked:bg-destructive peer-checked:border-destructive transition-all">
                      {formData.isLocked && <Lock className="w-3 h-3 text-destructive-foreground" />}
                    </div>
                    <span className="text-sm text-card-foreground">Locked</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="cyber-btn flex-1"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSaveChallenge} className="cyber-btn-filled flex-1">
                    {editingChallenge ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}