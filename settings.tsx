import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Trash2, Sun, Moon, Monitor, Info, Zap, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListOpenaiConversations,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'light' | 'system';

export default function Settings() {
  const [, nav] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useListOpenaiConversations();
  const deleteChat = useDeleteOpenaiConversation();

  const [theme, setTheme] = useState<Theme>('dark');
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearHistory = async () => {
    if (!conversations.length) return;
    setClearing(true);
    for (const c of conversations) {
      await deleteChat.mutateAsync({ id: c.id });
    }
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setClearing(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/8 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-grid-cyber opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => nav('/chat')}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
            <p className="text-muted-foreground text-sm">Customize your BRO.chat experience</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Theme */}
          <div className="glass-card rounded-2xl p-6 border border-white/8">
            <h2 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
              <Moon className="w-4 h-4 text-primary" />
              Appearance
            </h2>
            <p className="text-muted-foreground text-sm mb-5">Choose your preferred color theme.</p>
            <div className="flex gap-3">
              {themes.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all',
                    theme === value
                      ? 'border-primary/50 bg-primary/10 text-primary neon-glow'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clear History */}
          <div className="glass-card rounded-2xl p-6 border border-white/8">
            <h2 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Chat History
            </h2>
            <p className="text-muted-foreground text-sm mb-5">
              You have <span className="text-white font-semibold">{conversations.length}</span> conversation{conversations.length !== 1 ? 's' : ''} saved.
              Clearing is permanent.
            </p>
            <button
              onClick={handleClearHistory}
              disabled={clearing || !conversations.length}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                cleared
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : conversations.length
                  ? 'bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20'
                  : 'bg-white/5 border border-white/10 text-muted-foreground cursor-not-allowed',
              )}
            >
              {cleared ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              {cleared ? 'History cleared!' : clearing ? 'Clearing...' : 'Clear All History'}
            </button>
          </div>

          {/* About */}
          <div className="glass-card rounded-2xl p-6 border border-white/8">
            <h2 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
              <Info className="w-4 h-4 text-secondary" />
              About BRO.chat
            </h2>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              BRO.chat is your god-tier AI companion built for creators, coders, dreamers, and hustlers.
              Powered by OpenAI's GPT-4o Mini, engineered for maximum vibe.
            </p>
            <div className="space-y-2.5">
              {[
                ['Version', '1.0.0'],
                ['Model', 'GPT-4o Mini'],
                ['Build', 'God-tier Mode'],
                ['Status', 'System Online ✓'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass-card rounded-2xl p-6 border border-white/8">
            <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => nav('/chat')} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                Open Chat
              </button>
              <button onClick={() => nav('/tools')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-semibold hover:bg-white/10 transition-all">
                AI Tools
              </button>
              <button onClick={() => nav('/')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-semibold hover:bg-white/10 transition-all">
                Home
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-8">
          <span className="gradient-text font-display font-bold">BRO.chat</span> © 2026 — Built with creativity and AI
        </p>
      </div>
    </div>
  );
}
