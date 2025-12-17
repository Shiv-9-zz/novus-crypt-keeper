import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScrollText, ChevronDown, Check, AlertTriangle, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";

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
      navigate("/team");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6 border-b border-border"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" animate={false} />
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ScrollText className="w-4 h-4" />
            <span className="font-mono">PROTOCOL AGREEMENT</span>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-primary text-glow mb-2">
            COMPETITION PROTOCOL
          </h1>
          <p className="text-muted-foreground text-sm">
            Read and accept the following rules before proceeding. Scroll to the bottom to continue.
          </p>
        </motion.div>

        {/* Rules container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 relative"
        >
          <div
            ref={scrollRef}
            className="cyber-card p-6 h-[50vh] md:h-[55vh] overflow-y-auto"
          >
            {rules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="mb-6 last:mb-0"
              >
                <h2 className="text-primary font-bold mb-2 text-sm md:text-base">
                  {rule.title}
                </h2>
                <p className="text-card-foreground text-sm leading-relaxed whitespace-pre-line">
                  {rule.content}
                </p>
              </motion.div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-2"
            >
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center text-muted-foreground"
              >
                <span className="text-xs mb-1">Scroll to continue</span>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Acceptance section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-4"
        >
          {/* Checkbox */}
          <label
            className={`flex items-start gap-3 p-4 rounded border transition-all cursor-pointer ${
              hasScrolledToBottom
                ? "border-border hover:border-primary/50"
                : "border-border/50 opacity-50 cursor-not-allowed"
            } ${accepted ? "border-primary bg-primary/5" : ""}`}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => hasScrolledToBottom && setAccepted(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${
                accepted ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {accepted && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <span className="text-sm text-card-foreground">
              I have read and agree to abide by all competition rules and protocols. I understand that
              violation of any rule may result in disqualification.
            </span>
          </label>

          {/* Warning */}
          {!hasScrolledToBottom && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>You must scroll through all rules before accepting</span>
            </div>
          )}

          {/* Proceed button */}
          <motion.button
            onClick={handleProceed}
            disabled={!accepted}
            whileHover={accepted ? { scale: 1.02 } : {}}
            whileTap={accepted ? { scale: 0.98 } : {}}
            className={`cyber-btn w-full flex items-center justify-center gap-2 ${
              accepted ? "cyber-btn-filled" : "opacity-50 cursor-not-allowed"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Accept & Proceed</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
