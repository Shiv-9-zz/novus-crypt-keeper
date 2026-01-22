import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Rules from "@/pages/Rules";
import TeamRegistration from "@/pages/TeamRegistration";
import TeamMembers from "@/pages/TeamMembers";
import ChallengeVault from "@/pages/ChallengeVault";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/rules"
          element={
            <PageTransition>
              <Rules />
            </PageTransition>
          }
        />
        <Route
          path="/team"
          element={
            <PageTransition>
              <TeamRegistration />
            </PageTransition>
          }
        />
        <Route
          path="/team-members"
          element={
            <PageTransition>
              <TeamMembers />
            </PageTransition>
          }
        />
        <Route
          path="/vault"
          element={
            <PageTransition>
              <ChallengeVault />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <Admin />
            </PageTransition>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
