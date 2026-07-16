import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Trash2, Plus, MessageSquare, Menu, X,
  Settings, Zap, User, AlertTriangle, Home, Bot,
  ChevronLeft
} from 'lucide-react';
import {
  useListOpenaiConversations,
  useGetOpenaiConversation,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
  getGetOpenaiConversationQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

type UIMessage = {
  id: number;
  role: 'user' | 'assistant' | 'error';
  content: string;
  createdAt: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function BroLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-sm rounded-lg', md: 'w-10 h-10 text-xl rounded-xl', lg: 'w-16 h-16 text-3xl rounded-2xl' };
  return (
    <div className={cn('bro-logo flex items-center justify-center neon-glow shrink-0', sizes[size])}>
      <span className="font-display font-bold text-white">{size === 'lg' ? 'B' : 'B'}</span>
    </div>
  );
}

export default function Chat() {
  const [, nav] = useLocation();
  const params = useParams();
  const currentChatId = params.id ? parseInt(params.id) : null;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: conversations = [] } = useListOpenaiConversations();
  const { data: currentChat } = useGetOpenaiConversation(currentChatId || 0, {
    query: { enabled: !!currentChatId, queryKey: getGetOpenaiConversationQueryKey(currentChatId || 0) }
  });

  const createChat = useCreateOpenaiConversation();
  const deleteChat = useDeleteOpenaiConversation();

  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync UI messages from server data
  useEffect(() => {
    if (!isStreaming && currentChat?.messages) {
      setUiMessages(currentChat.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt,
      })));
    }
  }, [currentChat?.messages, isStreaming]);

  // Reset when switching chats
  useEffect(() => {
    setUiMessages([]);
    setIsStreaming(false);
    abortRef.current?.abort();
  }, [currentChatId]);

  useEffect(() => {
    if (!isStreaming) {
      if (currentChat?.messages) {
        setUiMessages(currentChat.messages.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          createdAt: m.createdAt,
        })));
      }
    }
  }, [currentChat?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiMessages]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  const handleNewChat = async () => {
    const chat = await createChat.mutateAsync({ data: { title: 'New Chat' } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    nav(`/chat/${chat.id}`);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 2500);
      return;
    }
    setDeleteConfirm(null);
    await deleteChat.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    if (currentChatId === id) nav('/chat');
  };

  const submitMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let chatId = currentChatId;

    if (!chatId) {
      const chat = await createChat.mutateAsync({ data: { title: content.slice(0, 40) } });
      chatId = chat.id;
      window.history.pushState({}, '', `${import.meta.env.BASE_URL.replace(/\/$/, '')}/chat/${chat.id}`);
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    }

    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const now = new Date().toISOString();
    const userMsg: UIMessage = { id: Date.now(), role: 'user', content, createdAt: now };
    const assistantMsg: UIMessage = { id: Date.now() + 1, role: 'assistant', content: '', createdAt: now };
    setUiMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      const url = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/openai/conversations/${chatId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: ac.signal,
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let isError = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) {
              accumulated = data.error;
              isError = true;
              break;
            }
            if (data.content) {
              accumulated += data.content;
              setUiMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...last, content: accumulated };
                }
                return msgs;
              });
            }
          } catch { /* partial chunk */ }
        }
      }

      if (isError) {
        setUiMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, role: 'error', content: accumulated };
          }
          return msgs;
        });
      }

    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setUiMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          msgs[msgs.length - 1] = { ...last, role: 'error', content: errMsg };
        }
        return msgs;
      });
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(chatId!) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      if (!currentChatId) nav(`/chat/${chatId}`);
    }
  }, [currentChatId, isStreaming, createChat, queryClient, nav]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(inputValue);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Pick up pre-filled prompt from AI Tools page
  useEffect(() => {
    const stored = sessionStorage.getItem('broStartPrompt');
    if (stored) {
      sessionStorage.removeItem('broStartPrompt');
      setInputValue(stored);
      textareaRef.current?.focus();
    }
  }, []);

  const chips = [
    'Drop me 3 underground tracks 🎵',
    'Teach me a sick JavaScript trick 💡',
    'Hype me up for the week 🔥',
    'Tell me a wild fun fact 🤯',
  ];

  const msgCount = uiMessages.length;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/8 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-grid-cyber opacity-25" />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <AnimatePresence initial={false}>
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className={cn(
              'flex flex-col w-[280px] h-full z-50 shrink-0',
              'bg-sidebar/90 backdrop-blur-xl border-r border-white/5',
              isMobile && 'absolute left-0 top-0 shadow-2xl',
            )}
          >
            {/* Logo */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <button onClick={() => nav('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <BroLogo size="md" />
                <div>
                  <div className="font-display font-bold gradient-text">BRO.chat</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">God-tier mode</div>
                </div>
              </button>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* New Chat */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                disabled={createChat.isPending}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 text-white hover:from-primary/30 hover:to-accent/30 hover:border-primary/40 transition-all font-semibold text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {createChat.isPending ? 'Creating...' : 'New Chat'}
              </button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8 px-4">
                  No chats yet — start a new one!
                </div>
              ) : (
                conversations.slice().reverse().map((conv) => {
                  const isActive = currentChatId === conv.id;
                  const isConfirm = deleteConfirm === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => { nav(`/chat/${conv.id}`); if (isMobile) setSidebarOpen(false); }}
                      className={cn(
                        'group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border',
                        isActive
                          ? 'bg-primary/10 border-primary/25 text-primary'
                          : 'border-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <MessageSquare className={cn('w-3.5 h-3.5 shrink-0', isActive && 'text-primary')} />
                        <span className="truncate text-sm">{conv.title || 'Untitled'}</span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className={cn(
                          'shrink-0 p-1 rounded transition-all ml-1',
                          isConfirm
                            ? 'opacity-100 text-destructive bg-destructive/10 animate-pulse'
                            : 'opacity-0 group-hover:opacity-100 hover:text-destructive',
                        )}
                        title={isConfirm ? 'Click again to confirm delete' : 'Delete chat'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom nav */}
            <div className="border-t border-white/5 p-3 space-y-1">
              <button
                onClick={() => nav('/tools')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm"
              >
                <Zap className="w-4 h-4" />
                AI Tools
              </button>
              <button
                onClick={() => nav('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-sm"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Profile */}
            <div className="border-t border-white/5 p-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-foreground truncate">Digital Creator</div>
                  <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wide">AI Studio / God Mode</div>
                </div>
              </div>
              <div className="text-[10px] text-center text-muted-foreground mt-2">v1.0.0 · SYSTEM ONLINE</div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        {/* Header */}
        <header className="h-14 flex items-center px-4 gap-3 border-b border-white/5 bg-background/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {(!sidebarOpen || isMobile) && (
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {sidebarOpen && !isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <h2 className="font-display font-semibold text-base truncate text-foreground">
              {currentChatId ? (currentChat?.title || 'Loading…') : 'New Session'}
            </h2>
          </div>

          {msgCount > 0 && (
            <div className="text-[10px] text-muted-foreground border border-white/10 rounded-full px-2.5 py-0.5 shrink-0">
              {msgCount} msg{msgCount !== 1 ? 's' : ''}
            </div>
          )}

          <button onClick={() => nav('/')} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all shrink-0">
            <Home className="w-4 h-4" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-6 flex flex-col gap-5">
          {uiMessages.length === 0 && !isStreaming ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full space-y-6 py-12"
            >
              <motion.div
                animate={{ rotate: [12, 0, 12] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 rounded-3xl bro-logo flex items-center justify-center neon-glow"
              >
                <span className="font-display font-bold text-white text-5xl">B</span>
              </motion.div>

              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-3">
                  Yo, what's the vibe?
                </h1>
                <p className="text-muted-foreground text-base max-w-md mx-auto">
                  God-tier AI activated. Ask me anything — I'm your ultimate digital bro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-4">
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputValue(chip); textareaRef.current?.focus(); }}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-sm text-left relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                    <span className="relative">{chip}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {uiMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i === uiMessages.length - 1 ? 0 : 0 }}
                  className={cn('flex gap-3 max-w-3xl', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                >
                  {/* Avatar */}
                  {msg.role !== 'user' && (
                    <div className={cn('shrink-0 mt-1', msg.role === 'error' ? 'w-8 h-8' : '')}>
                      {msg.role === 'error' ? (
                        <div className="w-8 h-8 rounded-lg bg-destructive/20 border border-destructive/30 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                      ) : (
                        <BroLogo size="sm" />
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div
                      className={cn(
                        'px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-primary/80 to-accent/70 text-white rounded-tr-sm shadow-md'
                          : msg.role === 'error'
                          ? 'bg-destructive/10 border border-destructive/20 text-destructive rounded-tl-sm'
                          : 'bg-white/5 border border-white/8 text-foreground rounded-tl-sm backdrop-blur-sm',
                      )}
                    >
                      {msg.content || (isStreaming && i === uiMessages.length - 1 && (
                        <span className="flex items-center gap-1 h-5">
                          <span className="dot-flashing" />
                        </span>
                      ))}
                    </div>
                    <span className={cn('text-[10px] text-muted-foreground px-1', msg.role === 'user' && 'text-right')}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0 flex items-center justify-center mt-1">
                      <User className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-5 border-t border-white/5 bg-background/70 backdrop-blur-md">
          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-end gap-3 glass-panel rounded-2xl p-3 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? 'BRO is thinking...' : 'Message BRO...'}
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 outline-none text-[15px] text-foreground placeholder:text-muted-foreground/60 py-1 min-h-[32px] max-h-[200px] custom-scrollbar disabled:opacity-50"
              />
              <button
                onClick={() => submitMessage(inputValue)}
                disabled={!inputValue.trim() || isStreaming}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                  inputValue.trim() && !isStreaming
                    ? 'bg-gradient-to-r from-primary to-accent text-white neon-glow hover:opacity-90'
                    : 'bg-white/10 text-muted-foreground cursor-not-allowed',
                )}
              >
                {isStreaming ? (
                  <Bot className="w-4 h-4 animate-pulse" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-widest">
              BRO.chat · God-tier mode · {isStreaming ? 'Generating...' : 'Enter to send'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
