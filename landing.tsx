import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Zap, Brain, Music, Code2, Lightbulb, TrendingUp, Menu, X } from 'lucide-react';
import { useState } from 'react';

const tools = [
  { icon: Code2,      label: 'Coding Assistant',   desc: 'Debug, write, and review code like a senior engineer.' },
  { icon: Brain,      label: 'AI Writer',           desc: 'Craft blogs, copy, and ideas at warp speed.' },
  { icon: Music,      label: 'Music Generator',     desc: 'Chord progressions, lyrics, vibes — all day.' },
  { icon: Lightbulb,  label: 'Idea Generator',      desc: 'Brainstorm at God-tier velocity.' },
  { icon: Zap,        label: 'Learning Assistant',  desc: 'Master any topic with clarity and speed.' },
  { icon: TrendingUp, label: 'Business Assistant',  desc: 'Strategy, growth hacks, and market intel.' },
];

const stats = [
  { num: '∞',    label: 'Ideas Generated' },
  { num: '24/7', label: 'Always Online'   },
  { num: '100%', label: 'God-Tier Mode'   },
];

export default function Landing() {
  const [, nav] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-accent/8 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-cyber opacity-30" />
      </div>

      {/* ── NAV ── */}
      <nav className="relative z-20 px-5 py-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => nav('/')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bro-logo flex items-center justify-center shadow-lg shrink-0">
              <span className="font-display font-bold text-white text-lg">B</span>
            </div>
            <span className="font-display font-bold text-lg gradient-text">BRO.chat</span>
          </button>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => nav('/tools')}    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">AI Tools</button>
            <button onClick={() => nav('/settings')} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Settings</button>
            <button onClick={() => nav('/chat')}     className="ml-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all neon-glow">
              Open Chat
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(v => !v)} className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenu && (
          <div className="sm:hidden mt-3 flex flex-col gap-1 glass-card rounded-2xl p-3 border border-white/8">
            <button onClick={() => { nav('/tools');    setMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all">AI Tools</button>
            <button onClick={() => { nav('/settings'); setMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all">Settings</button>
            <button onClick={() => { nav('/chat');     setMobileMenu(false); }} className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all text-center mt-1">
              Open Chat
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-5 pt-12 pb-16 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
            God-Tier Mode Active
          </div>

          {/* Heading — fixed size, no responsive jumps */}
          <h1 className="text-5xl font-display font-bold leading-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">Meet </span>
            <span className="gradient-text">BRO</span>
          </h1>
          <p className="text-xl font-display text-white/80 mb-3">Your Ultimate AI Companion</p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            High-energy, intelligent, and always in your corner. BRO is your AI co-pilot for coding,
            creativity, motivation, music, business and everything in between.
          </p>

          {/* CTA buttons — full width on mobile, auto on bigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
            <button
              onClick={() => nav('/chat')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-bold text-base bg-gradient-to-r from-primary via-accent to-secondary text-white hover:opacity-90 transition-all neon-glow shadow-xl"
            >
              Start Chatting
            </button>
            <button
              onClick={() => nav('/tools')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-bold text-base border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
            >
              Explore Tools
            </button>
          </div>
        </motion.div>

        {/* Floating logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-14 w-28 h-28 rounded-[1.75rem] bro-logo flex items-center justify-center neon-glow shadow-2xl mx-auto"
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          <span className="font-display font-bold text-white text-6xl">B</span>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 mb-16">
        {/* Always 3 equal columns */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ num, label }) => (
            <div key={label} className="glass-card rounded-2xl p-5 text-center flex flex-col items-center justify-center">
              <div className="text-2xl font-display font-bold gradient-text mb-1">{num}</div>
              <div className="text-xs text-muted-foreground leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">AI Tools Arsenal</h2>
          <p className="text-muted-foreground text-sm">Everything you need, turbocharged.</p>
        </div>

        {/* 2-column grid on all sizes — cards stretch to equal height */}
        <div className="grid grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
          {tools.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3 }}
              className="glass-card rounded-2xl p-5 border border-white/8 hover:border-primary/30 transition-all group cursor-pointer flex flex-col"
              onClick={() => nav('/chat')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3 group-hover:from-primary/30 group-hover:to-accent/30 transition-all shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-white text-sm mb-1.5">{label}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed flex-1">{desc}</p>
              <button className="mt-3 text-primary text-xs font-semibold hover:text-secondary transition-colors self-start">
                Try Now →
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 mb-16">
        <div className="glass-card rounded-3xl p-8 border border-primary/20 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <h2 className="text-2xl font-display font-bold text-white mb-2 relative z-10">Ready to level up?</h2>
          <p className="text-muted-foreground text-sm mb-6 relative z-10">Your ultimate AI bro is waiting. Let's get it.</p>
          <button
            onClick={() => nav('/chat')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-bold text-base bg-gradient-to-r from-primary via-accent to-secondary text-white hover:opacity-90 transition-all neon-glow shadow-xl relative z-10"
          >
            Start Chatting — It's Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-muted-foreground text-xs">
        <p className="font-display font-bold gradient-text text-sm mb-1">BRO.chat</p>
        <p>© 2026 — Built with creativity and AI</p>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
      `}</style>
    </div>
  );
}
