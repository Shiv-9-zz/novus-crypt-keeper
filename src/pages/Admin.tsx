import { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Leaderboard } from "@/components/Leaderboard";

type Challenge = {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "insane";
  description: string;
  points: number;
  flag: string;
  hint: string | null;
  is_locked: boolean;
  is_visible: boolean;
  files: { id: string; file_name: string; file_path: string; file_size: string }[];
};

type Team = {
  id: string;
  team_id: string;
  name: string;
  leader_name: string;
  leader_email: string;
  team_size: number;
  institution: string;
  score: number;
  created_at: string;
};

const categories = ["Crypto", "Web", "OSINT", "Forensics", "Reverse", "Misc"];
const difficulties = ["easy", "medium", "hard", "insane"] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"challenges" | "teams" | "leaderboard">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    difficulty: "easy" | "medium" | "hard" | "insane";
    description: string;
    points: number;
    flag: string;
    hint: string;
    is_locked: boolean;
    is_visible: boolean;
  }>({
    title: "",
    category: "Crypto",
    difficulty: "easy",
    description: "",
    points: 100,
    flag: "",
    hint: "",
    is_locked: false,
    is_visible: true,
  });

  // Check auth and admin status
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch data
  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchTeams();
    }
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      if (challengesError) throw challengesError;

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

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("score", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const filteredChallenges = challenges.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.leader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      flag: "",
      hint: "",
      is_locked: false,
      is_visible: true,
    });
    setPendingFiles([]);
    setShowModal(true);
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      description: challenge.description,
      points: challenge.points,
      flag: challenge.flag,
      hint: challenge.hint || "",
      is_locked: challenge.is_locked,
      is_visible: challenge.is_visible,
    });
    setPendingFiles([]);
    setShowModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from("challenge-files").remove([filePath]);
      
      // Delete from database
      await supabase.from("challenge_files").delete().eq("id", fileId);
      
      // Update local state
      if (editingChallenge) {
        setEditingChallenge({
          ...editingChallenge,
          files: editingChallenge.files.filter((f) => f.id !== fileId),
        });
      }
      
      toast.success("File removed");
    } catch (error) {
      console.error("Error removing file:", error);
      toast.error("Failed to remove file");
    }
  };

  const uploadFiles = async (challengeId: string) => {
    for (const file of pendingFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${challengeId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("challenge-files")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      // Format file size
      const fileSize = file.size < 1024 
        ? `${file.size} B`
        : file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      await supabase.from("challenge_files").insert({
        challenge_id: challengeId,
        file_name: file.name,
        file_path: fileName,
        file_size: fileSize,
      });
    }
  };

  const handleSaveChallenge = async () => {
    if (!formData.title || !formData.description || !formData.flag) {
      toast.error("Title, description, and flag are required");
      return;
    }

    setSaving(true);
    try {
      if (editingChallenge) {
        const { error } = await supabase
          .from("challenges")
          .update({
            title: formData.title,
            category: formData.category,
            difficulty: formData.difficulty,
            description: formData.description,
            points: formData.points,
            flag: formData.flag,
            hint: formData.hint || null,
            is_locked: formData.is_locked,
            is_visible: formData.is_visible,
          })
          .eq("id", editingChallenge.id);

        if (error) throw error;

        // Upload new files
        if (pendingFiles.length > 0) {
          await uploadFiles(editingChallenge.id);
        }

        toast.success("Challenge updated");
      } else {
        const { data, error } = await supabase
          .from("challenges")
          .insert({
            title: formData.title,
            category: formData.category,
            difficulty: formData.difficulty,
            description: formData.description,
            points: formData.points,
            flag: formData.flag,
            hint: formData.hint || null,
            is_locked: formData.is_locked,
            is_visible: formData.is_visible,
          })
          .select()
          .single();

        if (error) throw error;

        // Upload files
        if (pendingFiles.length > 0 && data) {
          await uploadFiles(data.id);
        }

        toast.success("Challenge created");
      }

      setShowModal(false);
      fetchChallenges();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Failed to save challenge");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      // Get files to delete from storage
      const challenge = challenges.find((c) => c.id === id);
      if (challenge?.files.length) {
        const filePaths = challenge.files.map((f) => f.file_path);
        await supabase.storage.from("challenge-files").remove(filePaths);
      }

      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw error;

      setChallenges((prev) => prev.filter((c) => c.id !== id));
      toast.success("Challenge deleted");
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast.error("Failed to delete challenge");
    }
  };

  const toggleLock = async (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return;

    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_locked: !challenge.is_locked })
        .eq("id", id);

      if (error) throw error;

      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_locked: !c.is_locked } : c))
      );
    } catch (error) {
      console.error("Error toggling lock:", error);
      toast.error("Failed to update challenge");
    }
  };

  const toggleVisibility = async (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return;

    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_visible: !challenge.is_visible })
        .eq("id", id);

      if (error) throw error;

      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_visible: !c.is_visible } : c))
      );
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update challenge");
    }
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="cyber-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-card-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have admin privileges. Contact the administrator to request access.
          </p>
          <button onClick={() => navigate("/")} className="cyber-btn">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/login" label="Back to Login" />
            <Logo size="sm" />
            <span className="text-xs font-mono text-accent uppercase tracking-wider px-2 py-1 bg-accent/10 rounded">
              Admin Panel
            </span>
          </div>
          <button
            onClick={handleLogout}
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
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all ${
              activeTab === "leaderboard"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
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
                            challenge.is_visible
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                          title={challenge.is_visible ? "Visible" : "Hidden"}
                        >
                          {challenge.is_visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleLock(challenge.id)}
                          className={`p-2 rounded border transition-all ${
                            challenge.is_locked
                              ? "border-destructive text-destructive"
                              : "border-border text-muted-foreground"
                          }`}
                          title={challenge.is_locked ? "Locked" : "Unlocked"}
                        >
                          {challenge.is_locked ? (
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
          ) : activeTab === "teams" ? (
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
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTeams.map((team) => (
                        <tr key={team.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-primary">
                            {team.team_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-card-foreground font-medium">
                            {team.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-card-foreground">{team.leader_name}</div>
                            <div className="text-xs text-muted-foreground">{team.leader_email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {team.institution}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {team.team_size} members
                          </td>
                          <td className="px-6 py-4 text-sm text-accent font-mono font-bold">
                            {team.score} pts
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(team.created_at).toLocaleDateString()}
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
          ) : activeTab === "leaderboard" ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Leaderboard />
            </motion.div>
          ) : null}
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
                    value={formData.title}
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
                          setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })
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
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="terminal-input w-full"
                    min="0"
                    step="50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Flag (NOVUS{`{...}`})
                  </label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    className="terminal-input w-full font-mono"
                    placeholder="NOVUS{your_flag_here}"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="terminal-input w-full min-h-[100px] resize-y"
                    placeholder="Cryptic challenge description..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Hint (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.hint}
                    onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                    className="terminal-input w-full"
                    placeholder="Optional hint for participants"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                    Challenge Files
                  </label>
                  <div 
                    className="border border-dashed border-border rounded p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload files
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: .zip, .txt, .pdf, .bin, .py, .png, .jpg
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </div>
                  
                  {/* Existing files */}
                  {editingChallenge && editingChallenge.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Existing files:</p>
                      {editingChallenge.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between px-3 py-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-card-foreground">{file.file_name}</span>
                            <span className="text-xs text-muted-foreground">({file.file_size})</span>
                          </div>
                          <button 
                            onClick={() => removeExistingFile(file.id, file.file_path)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pending files */}
                  {pendingFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">New files to upload:</p>
                      {pendingFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/30 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm text-card-foreground">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button 
                            onClick={() => removePendingFile(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
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
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border border-border rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-all">
                      {formData.is_visible && <Eye className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-card-foreground">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_locked}
                      onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border border-border rounded flex items-center justify-center peer-checked:bg-destructive peer-checked:border-destructive transition-all">
                      {formData.is_locked && <Lock className="w-3 h-3 text-destructive-foreground" />}
                    </div>
                    <span className="text-sm text-card-foreground">Locked</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="cyber-btn flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveChallenge} 
                    className="cyber-btn-filled flex-1"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingChallenge ? "Update" : "Create"}
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
