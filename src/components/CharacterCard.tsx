import React from 'react';
import type { Role, Side } from '../types/avalon';
import { ROLE_LABELS } from '../types/avalon';
import { Sparkles, Skull } from 'lucide-react';

interface Props {
  role: Role;
  side: Side;
  revealed?: boolean;
  onClick?: () => void;
  isLLMThinking?: boolean;
}

const ROLE_IMAGES: Record<Role, string> = {
  merlin: '/assets/roles/merlin.png',
  percival: '/assets/roles/percival.png',
  loyal_servant: '/assets/roles/loyal_servant.png',
  assassin: '/assets/roles/assassin.png',
  morgana: '/assets/roles/morgana.png',
  mordred: '/assets/roles/mordred.png',
  oberon: '/assets/roles/oberon.png',
  minion: '/assets/roles/minion.png'
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  merlin: 'Sees the evil, but must remain hidden.',
  percival: 'Sees Merlin and Morgana.',
  loyal_servant: 'Defender of the true King.',
  assassin: 'Seeks to strike down Merlin.',
  morgana: 'Deceives Percival.',
  mordred: 'Hidden from Merlin\'s sight.',
  oberon: 'Unknown to evil.',
  minion: 'Agent of the dark forces.'
};

const CharacterCard: React.FC<Props> = ({ role, side, revealed = true, onClick, isLLMThinking }) => {
  const isGood = side === 'good';
  const imageUrl = ROLE_IMAGES[role];
  
  return (
    <div 
      onClick={onClick}
      className={`relative w-56 h-80 rounded-sm overflow-hidden cursor-pointer group transition-all duration-700 card-perspective
        ${revealed ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'shadow-[0_10px_30px_rgba(0,0,0,0.6)]'}
        hover:-translate-y-4 hover:scale-105`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Container holding the front and back */}
      <div 
        className={`relative w-full h-full transition-transform duration-1000 ${revealed ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* === FRONT OF CARD === */}
        <div 
          className="absolute inset-0 backface-hidden bg-zinc-900 border-[3px] border-zinc-700/80 flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
           {/* Card Art */}
           <div className="relative h-[65%] w-full overflow-hidden border-b-2 border-zinc-800">
             <img 
               src={imageUrl} 
               alt={ROLE_LABELS[role]} 
               className="object-cover w-full h-full transform transition-transform duration-1000 group-hover:scale-110" 
             />
             {/* Vignette Overlay */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
             {/* Allegiance Tint */}
             <div className={`absolute inset-0 mix-blend-overlay opacity-40 ${isGood ? 'bg-blue-600' : 'bg-red-700'}`} />
           </div>

           {/* Card Text Area (Parchment/Iron vibe) */}
           <div className="relative h-[35%] w-full bg-zinc-950 flex flex-col items-center pt-3 px-4 text-center">
             {/* Ornamental divider */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
             
             <h4 className={`text-xl font-black uppercase tracking-widest ${isGood ? 'text-amber-100' : 'text-red-200'} drop-shadow-[0_2px_2px_rgba(0,0,0,1)]`} style={{ fontFamily: "'Cinzel', serif" }}>
               {ROLE_LABELS[role]}
             </h4>
             
             <div className="flex items-center gap-2 mt-1 mb-2">
               <div className="h-px w-8 bg-zinc-700" />
               {isGood ? <Sparkles size={10} className="text-amber-500/50" /> : <Skull size={10} className="text-red-500/50" />}
               <div className="h-px w-8 bg-zinc-700" />
             </div>

             <p className="text-[11px] text-stone-400 leading-tight font-medium italic opacity-80" style={{ fontFamily: "'Playfair Display', serif" }}>
               {ROLE_DESCRIPTIONS[role]}
             </p>
           </div>
           
           {/* Card Frame Inner Border */}
           <div className="absolute inset-2 border border-amber-900/30 pointer-events-none mix-blend-overlay" />
        </div>

        {/* === BACK OF CARD === */}
        <div 
          className="absolute inset-0 backface-hidden bg-zinc-900 border-[3px] border-zinc-700/80 flex items-center justify-center overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
           {/* Card Back Texture */}
           <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,40,40,1)_0%,rgba(10,10,10,1)_100%)]" />
           
           {/* Ornamental Card Back Design */}
           <div className="relative w-3/4 h-[85%] border-2 border-amber-900/40 rounded-sm flex flex-col items-center justify-center p-4">
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-900/40" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-900/40" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-900/40" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-900/40" />
              
              <h2 
                className="text-2xl text-zinc-700 font-black tracking-[0.25em] select-none" 
                style={{ 
                  fontFamily: "'Cinzel', serif", 
                  writingMode: 'vertical-rl', 
                  textOrientation: 'upright' 
                }}
              >
                AVALON
              </h2>
           </div>
        </div>
      </div>

      {/* Thinking Halo Overlay (If LLM is processing) */}
      {isLLMThinking && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40">
           <div className="absolute inset-0 border-4 border-indigo-500/50 animate-pulse" />
           <div className="bg-zinc-900/90 border border-indigo-500/50 px-4 py-2 text-indigo-300 font-bold tracking-widest text-xs uppercase shadow-[0_0_30px_rgba(99,102,241,0.5)]">
             推演局勢中...
           </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
