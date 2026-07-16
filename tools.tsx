import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Code2, Brain, Music2, Lightbulb, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

const tools = [
  {
    icon: Brain,
    label: 'AI Writer',
    desc: 'Craft compelling blogs, copy, emails, and creative content at warp speed. BRO writes like a pro.',
    color: 'from-pink-500/20 to-purple-500/20',
    border: 'hover:border-pink-500/30',
    iconColor: 'text-pink-400',
    prompt: 'Help me write ',
  },
  {
    icon: Code2,
    label: 'Coding Assistant',
    desc: 'Debug, architect, and write code across any language. BRO is your senior dev on demand.',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'hover:border-cyan-500/30',
    iconColor: 'text-cyan-400',
    prompt: 'Help me with this code: ',
  },
  {
    icon: Music2,
    label: 'Music Generator',
    desc: 'Chord progressions, lyrics, song structures, genre deep-dives. BRO drops beats and knowledge.',
    color: 'from-violet-500/20 to-pink-500/20',
    border: 'hover:border-violet-500/30',
    iconColor: 'text-violet-400',
    prompt: 'Help me with music: ',
  },
  {
    icon: Lightbulb,
    label: 'Idea Generator',
    desc: 'Stuck? Brainstorm at God-tier velocity. Business ideas, creative concepts, wild pitches.',
    color: 'from-yellow-500/20 to-orange-500/20',
    border: 'hover:border-yellow-500/30',
    iconColor: 'text-yellow-400',
    prompt: 'Generate ideas for ',
  },
  {
    icon: BookOpen,
    label: 'Learning Assistant',
    desc: 'Master any topic fast. Explain it like BRO — clear, energetic, and unforgettable.',
    color: 'from-green-500/20 to-cyan-500/20',
    border: 'hover:border-green-500/30',
    iconColor: 'text-green-400',
    prompt: 'Teach me about ',
  },
  {
    icon: TrendingUp,
    label: 'Business Assistant',
    desc: 'Market analysis, pitch decks, growth hacks, strategies. BRO is your co-founder.',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'hover:border-blue-500/30',
    iconColor: 'text-blue-400',
    prompt: 'Give me business advice on ',
  },
];

export default function Tools() {
  const [, nav] = useLocation();

  const launch = (prompt: string) => {
    nav('/chat');
    // Store prompt in sessionStorage for chat to pick up
    sessionStorage.setItem('broStartPrompt', prompt);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/8 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-grid-cyber opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => nav('/chat')}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Tools Arsenal
            </h1>
            <p className="text-muted-foreground text-sm">Pick a tool, drop into chat, get results.</p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(({ icon: Icon, label, desc, color, border, iconColor, prompt }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className={`glass-card rounded-2xl p-6 border border-white/8 ${border} transition-all cursor-pointer group`}
              onClick={() => launch(prompt)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{desc}</p>
              <button
                className={`text-sm font-semibold ${iconColor} hover:opacity-80 transition-opacity`}
                onClick={(e) => { e.stopPropagation(); launch(prompt); }}
              >
                Launch Tool →
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center glass-card rounded-2xl p-8 border border-white/8">
          <h2 className="font-display font-bold text-xl text-white mb-2">Just want to chat?</h2>
          <p className="text-muted-foreground text-sm mb-5">Drop into the full chat interface and ask BRO anything.</p>
          <button
            onClick={() => nav('/chat')}
            className="px-8 py-3 rounded-xl font-display font-bold text-white bg-gradient-to-r from-primary to-accent neon-glow hover:opacity-90 transition-all"
          >
            Open Chat
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          <span className="gradient-text font-display font-bold">BRO.chat</span> © 2026 — Built with creativity and AI
        </p>
      </div>
    </div>
  );
}
