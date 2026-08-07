import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-zinc-900 border border-white/10 rounded-sm shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-zinc-950 p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-space tracking-widest text-sm text-gold uppercase">Lustro Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-sm text-white/60 flex items-center justify-center text-center">
            AI Assistant integration coming soon.
          </div>
          <div className="p-4 border-t border-white/5">
            <input 
              type="text" 
              placeholder="Ask a question..." 
              className="w-full bg-zinc-800 border-none rounded-sm px-3 py-2 text-sm text-white focus:outline-none"
              disabled
            />
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gold text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
