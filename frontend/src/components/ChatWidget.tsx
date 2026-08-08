import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import api from '../services/api';
import { useUiStore } from '../store/uiStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Recommend a GMT under 15,000 CHF',
  'Show me Omega',
  'A dress watch for a wedding',
  'Do you have diver watches?',
];

export default function ChatWidget() {
  const { chatOpen, openChat, closeChat } = useUiStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to Lustro. Ask me for a recommendation by brand, budget, or style — e.g. “a GMT under 15,000 CHF”.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const conversationId = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);
    try {
      const { data } = await api.post<{ reply: string; conversation_id: number }>('/api/v1/chat/', {
        message: trimmed,
        conversation_id: conversationId.current,
      });
      conversationId.current = data.conversation_id;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Apologies — I could not reach the boutique right now. Please try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {chatOpen ? (
        <div className="w-80 md:w-[28rem] h-[32rem] max-h-[80vh] bg-zinc-900 border border-white/10 rounded-sm shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-zinc-950 p-4 border-b border-white/5 flex justify-between items-center">
            <div>
              <h3 className="font-space tracking-widest text-sm text-gold uppercase">Lustro Assistant</h3>
              <p className="text-[10px] text-white/40">Your private boutique concierge</p>
            </div>
            <button onClick={closeChat} className="text-white/50 hover:text-white" aria-label="Close chat">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-white/90 border border-white/5'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-white/70 border border-white/5 px-4 py-3 text-sm">…</div>
              </div>
            )}
          </div>
          <form
            className="p-4 border-t border-white/5 flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a watch, brand, or budget..."
              className="flex-1 bg-zinc-800 border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-gold text-black rounded-sm flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {messages.length <= 1 && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[11px] border border-white/10 rounded-full px-3 py-1.5 text-white/60 hover:border-gold/60 hover:text-gold transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={openChat}
          className="w-14 h-14 bg-gold text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}