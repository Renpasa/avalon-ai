import { useState, useRef } from 'react';
import type { Player } from '../types/avalon';
import type { ChatMessage } from '../types/game';
import { Send, ScrollText, Info } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  players: Player[];
  humanId: number;
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export default function ChatPanel({ messages, players, humanId, onSendMessage, disabled }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll disabled per user request
  /*
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full w-full rounded-sm medieval-panel border-iron animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay z-0" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between bg-zinc-950/80 px-6 py-4 border-b-2 border-zinc-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-amber-900/50 text-amber-600 bg-zinc-900 rounded-sm">
            <ScrollText size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-widest text-amber-500 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Hall of Voices
            </h3>
            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Public Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
           <div className={`h-2 w-2 rounded-full ${disabled ? 'bg-zinc-700' : 'bg-red-700 animate-pulse box-shadow-[0_0_10px_rgba(185,28,28,0.8)]'}`} />
           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{disabled ? 'Sealed' : 'Scribe'}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center text-stone-600 text-center space-y-4 px-10">
            <Info size={32} className="opacity-30" />
            <p className="text-xs font-bold italic tracking-widest opacity-60 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Silence falls upon<br/>the Round Table.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.senderId === 'system';
            const isMe = msg.senderId === humanId;
            const sender = players.find((p) => p.id === msg.senderId);
            const isMock = msg.text.includes('[Mock Mode]');

            if (isSystem) {
              return (
                <div key={msg.id} className="flex items-center gap-4 py-2 opacity-60">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]" style={{ fontFamily: "'Cinzel', serif" }}>
                    {msg.text}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-${isMe ? 'right' : 'left'}-2 duration-300`}>
                <div className={`flex items-center gap-2 mb-1 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border
                    ${isMe ? 'bg-amber-900/50 text-amber-500 border-amber-900' : 'bg-zinc-800 text-stone-400 border-zinc-700 shadow-inner'}`}
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {isMe ? 'U' : sender?.name[0]}
                  </div>
                  <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">
                    {sender?.name || 'Unknown'} {isMe && '— YOU'}
                  </span>
                </div>
                
                <div 
                  className={`relative max-w-[90%] px-5 py-3 text-sm font-medium leading-relaxed shadow-lg transition-transform duration-300 group-hover:scale-[1.02] border-2
                    ${isMe 
                      ? 'bg-zinc-800 text-stone-200 rounded-b-xl rounded-tl-xl border-amber-900/50 border-r-4 border-r-amber-700' 
                      : 'bg-zinc-950 text-stone-300 rounded-b-xl rounded-tr-xl border-zinc-800 border-l-4 border-l-zinc-600'
                    }
                    ${isMock ? 'border-amber-500/50 italic opacity-80' : ''}`}
                >
                  {isMock && (
                    <div className="absolute -top-2 -right-2 bg-amber-500/20 border border-amber-500 text-[8px] text-amber-500 font-black px-1.5 py-0.5 rounded shadow-lg">MOCK</div>
                  )}
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative z-10 p-5 bg-zinc-950 border-t-2 border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="relative group/input">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "The Scribe is recording..." : "Speak thy mind..."}
            className="w-full h-12 bg-zinc-900 border-2 border-zinc-800 pl-5 pr-14 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700 focus:bg-zinc-800 disabled:opacity-50 disabled:grayscale transition-all rounded-sm font-medium"
          />
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className={`absolute right-2 top-1.5 h-9 w-10 flex items-center justify-center transition-all border-2 rounded-sm
              ${!text.trim() || disabled 
                ? 'text-zinc-600 border-transparent bg-transparent' 
                : 'bg-zinc-800 border-amber-900/50 text-amber-600 hover:bg-amber-900 hover:text-amber-100 hover:border-amber-700 shadow-md active:scale-95'
              }`}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-1">
           <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
           <p className="px-3 text-[9px] font-black text-stone-600 tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
             {disabled ? 'Wait your turn' : 'Press Enter'}
           </p>
           <div className="h-px flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
        </div>
      </form>
    </div>
  );
}
