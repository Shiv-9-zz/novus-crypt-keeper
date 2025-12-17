import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Skull, Terminal, Lock, Eye, Binary, ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CyberBackground } from "@/components/CyberBackground";

const features = [
  {
    icon: Terminal,
    title: "Multi-Domain Challenges",
    desc: "Crypto, Web, OSINT, Forensics, Reverse Engineering & More",
  },
  {
    icon: Lock,
    title: "Secure Infrastructure",
    desc: "256-bit encrypted platform with isolated challenge environments",
  },
  {
    icon: Eye,
    title: "Real-time Competition",
    desc: "Live leaderboards and dynamic scoring systems",
  },
  {
    icon: Binary,
    title: "Progressive Difficulty",
    desc: "From beginner to elite-tier challenges",
  },
];

const stats = [
  { value: "50+", label: "Challenges" },
  { value: "6", label: "Categories" },
  { value: "Pan-India", label: "Competition" },
  { value: "24H", label: "Duration" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Live animated background */}
      <CyberBackground />
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent z-[1]" />
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Logo size="sm" />
        <button
          onClick={() => navigate("/login")}
          className="cyber-btn text-sm"
        >
          Enter Portal
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Skull className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Capture The Flag 2025
            </span>
            <Skull className="w-6 h-6 text-primary animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
            <span className="text-primary text-glow glitch" data-text="NOVUS">NOVUS</span>
          </h1>

          <p className="text-xl md:text-2xl text-card-foreground font-mono max-w-2xl mx-auto">
            Enter the{" "}
            <span className="text-accent">forbidden realm</span> of cybersecurity.
            <br />
            <span className="text-muted-foreground">Decode. Exploit. Conquer.</span>
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="cyber-btn-filled text-lg px-8 py-4 flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Access System
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Floating terminal decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 max-w-md w-full"
        >
          <div className="cyber-card p-4 text-left glitch-box noise">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">terminal</span>
            </div>
            <pre className="text-xs text-card-foreground font-mono space-y-1">
              <code className="block"><span className="text-primary">$</span> ssh novus@ctf.secure</code>
              <code className="block text-muted-foreground">Connecting to NOVUS mainframe...</code>
              <code className="block text-accent">[ AUTHENTICATION REQUIRED ]</code>
              <code className="block text-primary">$</code>
              <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
            </pre>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary text-glow flicker-slow">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-2xl md:text-3xl font-mono text-card-foreground mb-16"
          >
            [ <span className="text-primary">SYSTEM CAPABILITIES</span> ]
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="cyber-card p-6 group"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4 group-hover:text-glow transition-all" />
                <h3 className="text-lg font-bold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="cyber-card p-12 max-w-3xl mx-auto border-primary/50"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              <span className="text-primary text-glow">Are you ready</span>
              <br />
              <span className="text-card-foreground">to breach the system?</span>
            </h2>
            <p className="text-muted-foreground mb-8 font-mono">
              Join hackers from across India. Prove your skills.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="cyber-btn-filled text-lg px-10 py-4"
            >
              Initialize Access
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border/50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground font-mono">
          <span>© 2025 NOVUS CTF. All rights reserved.</span>
          <span className="text-xs">◉ SECURE CONNECTION ESTABLISHED</span>
        </div>
      </footer>
    </div>
  );
}