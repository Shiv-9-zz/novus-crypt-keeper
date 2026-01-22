import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScrollText, ChevronDown, Check, AlertTriangle, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";
import { BackButton } from "@/components/BackButton";

const rules = [
  {
    title: "1. ELIGIBILITY",
    content: `All participants must be students currently enrolled in recognized educational institutions across India. Each team must consist of 2-4 members. A valid institutional email or ID may be required for verification. Corporate or professional teams are not permitted.`,
  },
  {
    title: "2. TEAM FORMATION",
    content: `Teams must register with a unique team name before the competition begins. Once registered, team composition cannot be changed. Each participant can only be a member of one team. Team leaders are responsible for all team communications and submissions.`,
  },
  {
    title: "3. CHALLENGE ACCESS",
    content: `Challenges will be released in scheduled waves during the competition period. Each challenge contains a hidden flag in the format: NOVUS{flag_content}. Challenges may include downloadable files that are essential for solving. Do not share challenge files or solutions with other teams.`,
  },
  {
    title: "4. PROHIBITED CONDUCT",
    content: `The following actions are strictly prohibited and will result in immediate disqualification:
    
    • Attacking the CTF infrastructure or other teams
    • Sharing flags, solutions, or hints with other teams
    • Using automated tools to brute-force flags
    • Attempting to access challenges before official release
    • Any form of denial-of-service attacks
    • Social engineering against organizers or participants
    • Plagiarism or using pre-solved writeups`,
  },
  {
    title: "5. FAIR PLAY",
    content: `All teams are expected to solve challenges independently using their own skills and knowledge. Online resources, documentation, and tools are permitted unless specifically prohibited in a challenge description. Collaboration within your team is encouraged; collaboration between teams is forbidden.`,
  },
  {
    title: "6. FLAG SUBMISSION",
    content: `Flags must be submitted exactly as found, maintaining case sensitivity. Multiple incorrect submissions may trigger rate limiting. Do not share your team's submission portal access with anyone. Screenshots of successful submissions may be requested for verification.`,
  },
  {
    title: "7. COMMUNICATION",
    content: `Official announcements will be made through the platform and designated communication channels. Support queries should be directed to the official support channels only. Do not publicly discuss challenge content during the competition. Respect all participants and organizers in communications.`,
  },
  {
    title: "8. SCORING & RANKING",
    content: `Points are awarded based on challenge difficulty and solve order. First blood bonuses may apply to certain challenges. Ties are broken by total solve time. The organizers' decisions on scoring are final. Rankings are updated in real-time on the scoreboard.`,
  },
  {
    title: "9. PRIZES & RECOGNITION",
    content: `Prizes will be awarded to the top-performing teams as announced. Winners may be required to provide solution writeups. Prize eligibility requires compliance with all rules. Certificates will be issued to all participating teams upon completion.`,
  },
  {
    title: "10. AMENDMENTS",
    content: `The organizers reserve the right to modify rules if necessary. Any changes will be announced through official channels. Continued participation implies acceptance of rule amendments. Disputes will be resolved at the sole discretion of the organizers.`,
  },
  {
    title: "11. DISCLAIMER",
    content: `The NOVUS CTF platform and challenges are provided "as is" for educational purposes. Participants engage at their own risk. Skills learned should only be applied legally and ethically. The organizers are not responsible for any misuse of knowledge gained.`,
  },
];

export default function Rules() {
  const navigate = useNavigate();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (isAtBottom) {
        setHasScrolledToBottom(true);
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProceed = () => {
    if (accepted) {
      navigate("/vault");
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden">
      <CyberBackground />
      
      {/* Header */}
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-background/80 backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/login" label="Back to Login" />
            <Logo size="sm" animate={false} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ScrollText className="w-4 h-4" />
            <span className="font-mono hidden sm:inline">PROTOCOL AGREEMENT</span>
          </div>
        </div>
      </header>

      {/* Main content - fixed height container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 min-h-0 relative z-10">
        {/* Title section */}
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary text-glow mb-2">
            COMPETITION PROTOCOL
          </h1>
          <p className="text-muted-foreground text-sm">
            Read and accept the following rules before proceeding. Scroll to the bottom to continue.
          </p>
        </div>

        {/* Scrollable rules container */}
        <div className="flex-1 min-h-0 relative">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto rounded-lg border border-border bg-card/50 backdrop-blur-sm p-6"
          >
            {rules.map((rule, index) => (
              <div
                key={index}
                className="mb-6 last:mb-0"
              >
                <h2 className="text-primary font-bold mb-2 text-sm md:text-base">
                  {rule.title}
                </h2>
                <p className="text-card-foreground text-sm leading-relaxed whitespace-pre-line">
                  {rule.content}
                </p>
              </div>
            ))}

            {/* End marker */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-muted-foreground text-xs font-mono">
                ═══ END OF PROTOCOL DOCUMENT ═══
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          {!hasScrolledToBottom && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-2 rounded-b-lg">
              <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                <span className="text-xs mb-1">Scroll to continue</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Acceptance section - always visible at bottom */}
        <div className="flex-shrink-0 mt-4 space-y-3 bg-background/90 backdrop-blur-sm p-4 -mx-4 md:-mx-6 px-4 md:px-6 border-t border-border">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => hasScrolledToBottom && setAccepted(!accepted)}
            disabled={!hasScrolledToBottom}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left w-full ${
              hasScrolledToBottom
                ? "border-border hover:border-primary/50 cursor-pointer bg-card/50"
                : "border-border/50 opacity-50 cursor-not-allowed bg-card/20"
            } ${accepted ? "border-primary bg-primary/10" : ""}`}
          >
            <div
              className={`w-6 h-6 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                accepted ? "bg-primary border-primary" : "border-muted-foreground"
              }`}
            >
              {accepted && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
            <span className="text-sm text-card-foreground leading-relaxed">
              I have read and agree to abide by all competition rules and protocols. I understand that
              violation of any rule may result in disqualification.
            </span>
          </button>

          {/* Warning */}
          {!hasScrolledToBottom && (
            <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-2 rounded">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>You must scroll through all rules before accepting</span>
            </div>
          )}

          {/* Proceed button */}
          <button
            onClick={handleProceed}
            disabled={!accepted}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all ${
              accepted 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Accept & Proceed to Challenge Vault</span>
          </button>
        </div>
      </div>
    </div>
  );
}
