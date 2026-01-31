import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Team = {
  id: string;
  team_id: string;
  name: string;
  institution: string;
  score: number;
  leader_name: string;
};

export function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchTeams();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        (payload) => {
          console.log("Leaderboard update:", payload);
          
          if (payload.eventType === "INSERT") {
            setTeams((prev) => {
              const newTeams = [...prev, payload.new as Team];
              return newTeams.sort((a, b) => b.score - a.score);
            });
          } else if (payload.eventType === "UPDATE") {
            setTeams((prev) => {
              const updated = prev.map((team) =>
                team.id === (payload.new as Team).id ? (payload.new as Team) : team
              );
              return updated.sort((a, b) => b.score - a.score);
            });
          } else if (payload.eventType === "DELETE") {
            setTeams((prev) =>
              prev.filter((team) => team.id !== (payload.old as Team).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTeams = async () => {
    try {
      // Use secure function that doesn't expose emails
      const { data, error } = await supabase.rpc("get_public_teams");

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center font-mono text-muted-foreground">
            {index + 1}
          </span>
        );
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50";
      case 1:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50";
      case 2:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/50";
      default:
        return "bg-card/50 border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-primary font-mono animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-mono font-bold text-card-foreground">
            Live Leaderboard
          </h2>
          <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded animate-pulse">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Users className="w-4 h-4" />
          {teams.length} teams
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {teams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No teams registered yet
            </div>
          ) : (
            teams.map((team, index) => (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className={`flex items-center gap-4 p-4 border rounded-lg ${getRankBg(index)}`}
              >
                {/* Rank */}
                <div className="w-10 flex justify-center">{getRankIcon(index)}</div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-card-foreground truncate">
                      {team.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{team.team_id}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {team.institution} • Led by {team.leader_name}
                  </div>
                </div>

                {/* Score */}
                <motion.div
                  key={team.score}
                  initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                  animate={{ scale: 1, color: "hsl(var(--card-foreground))" }}
                  className="text-right"
                >
                  <div className="text-2xl font-mono font-bold">{team.score}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
