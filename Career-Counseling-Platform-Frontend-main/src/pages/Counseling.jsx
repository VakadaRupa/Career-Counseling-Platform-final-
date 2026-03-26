import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/BaseComponents';
import { Send, Loader2, User, Bot, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/utils';

export default function Counseling() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello! I'm your Career Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history] = useState([
    { id: 1, title: 'Software Engineering Path' },
    { id: 2, title: 'Product Management Tips' }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await getChatResponse([...messages, userMessage]);
      const assistantMessage = { id: Date.now() + 1, role: 'assistant', text: responseText };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      

      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Chat History */}
        <aside className="hidden w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] md:flex transition-colors">
          <div className="p-4">
            <Button variant="outline" className="w-full justify-start gap-2 border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all">
              <Plus size={16} />
              New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors">Recent Chats</p>
            <div className="space-y-1">
              {history.map((chat) => (
                <button
                  key={chat.id}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
                >
                  <MessageSquare size={16} className="shrink-0 text-[var(--text-secondary)]/60" />
                  <span className="flex-1 truncate">{chat.title}</span>
                  <Trash2 size={14} className="hidden group-hover:block text-[var(--text-secondary)]/60 hover:text-red-500" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-[var(--bg-secondary)]/50 transition-colors">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200" 
              alt="Counseling Background" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-8 md:px-0 relative z-10"
          >
            <div className="mx-auto max-w-3xl space-y-8">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 md:gap-6"
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors",
                      msg.role === 'assistant' ? "bg-[var(--info-bg)] text-[var(--info-text)]" : "bg-[var(--brand-solid)] text-white"
                    )}>
                      {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden">
                      <p className="text-sm font-bold text-[var(--text-primary)] capitalize transition-colors">{msg.role}</p>
                      <div className="text-[var(--text-secondary)] leading-relaxed transition-colors">
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {loading && (
                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[var(--info-bg)] text-[var(--info-text)] transition-colors">
                    <Bot size={20} />
                  </div>
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 md:p-8 transition-colors">
            <div className="mx-auto max-w-3xl">
              <form 
                onSubmit={handleSend}
                className="relative flex items-center"
              >
                <textarea
                  rows={1}
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-4 pl-4 pr-12 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 shadow-sm focus:border-[var(--brand-solid)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-solid)] transition-all"
                  placeholder="Ask me anything about your career..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-solid)] text-white transition-all hover:opacity-90 disabled:bg-[var(--bg-secondary)] disabled:text-[var(--text-secondary)]/40"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
