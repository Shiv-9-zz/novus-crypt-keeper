import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CyberBackground } from "@/components/CyberBackground";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireTeam?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireTeam = false 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Check if user is logged in
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      navigate("/login", { replace: true });
      return;
    }

    // Check team requirement (non-admin users need team session)
    if (requireTeam && !isAdmin) {
      const teamId = sessionStorage.getItem("novus_team_id");
      if (!teamId) {
        navigate("/login", { replace: true });
        return;
      }
    }

    setIsAuthorized(true);
  }, [user, isAdmin, loading, navigate, requireAdmin, requireTeam]);

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <CyberBackground />
        <div className="text-primary font-mono animate-pulse">Authenticating...</div>
      </div>
    );
  }

  return <>{children}</>;
}
