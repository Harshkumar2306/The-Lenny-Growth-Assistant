import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Layers, ArrowUpRight } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, skill: string) => void;
  isLoading: boolean;
  activeProvider: string;
  activeModel?: string;
}

const INSPIRATION_STARTERS: Record<'chat' | 'ship30' | 'artifact', string[]> = {
  chat: [
    'Elena Verna on PLG Loops vs Funnels',
    'Casey Winters on Retention Flywheels',
    'Shreyas Doshi on Fatal Risk Pre-Mortem',
  ],
  ship30: [
    'Why User Retention Compounds While Acquisition Decays',
    'Elena Verna B2B Self-Serve Growth Playbook',
    'Rahul Vohra High-Expectation Customer Framework',
  ],
  artifact: [
    'Rahul Vohra 40% PMF Engine with Real-Time Sliders',
    'Bob Moesta JTBD Customer Switching Forces Simulator',
    'Elena Verna B2B Viral Loop & Expansion Calculator',
  ],
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  activeProvider,
  activeModel,
}) => {
  const [input, setInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<'chat' | 'ship30' | 'artifact'>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), selectedSkill);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePickInspiration = (starter: string) => {
    setInput(starter);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 safe-pb flex-shrink-0 select-none">
      <div className="max-w-3xl mx-auto space-y-2.5">
        {/* Mode Selector Segmented Control & Dynamic Grounding Indicator */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Segmented Control Bar */}
          <div className="flex items-center p-1 bg-stone-900/90 rounded-xl border border-stone-800/90 shadow-inner overflow-x-auto scrollbar-none flex-nowrap shrink-0">
            {/* Grounded Q&A */}
            <button
              type="button"
              onClick={() => setSelectedSkill('chat')}
              title="Verified answers grounded in 5,993 podcast chunks"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                selectedSkill === 'chat'
                  ? 'bg-stone-800 text-amber-300 shadow-xs border border-stone-700/60'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${selectedSkill === 'chat' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span>Grounded Q&A</span>
            </button>

            {/* Ship 30 Essay */}
            <button
              type="button"
              onClick={() => setSelectedSkill('ship30')}
              title="Generates ~1,250-word executive essay rendered in the Deliverables panel"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                selectedSkill === 'ship30'
                  ? 'bg-amber-500/15 text-amber-300 shadow-xs border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${selectedSkill === 'ship30' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span>Ship 30 Essay</span>
            </button>

            {/* Interactive HTML */}
            <button
              type="button"
              onClick={() => setSelectedSkill('artifact')}
              title="Generates interactive HTML prototype or calculator in the Deliverables panel"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                selectedSkill === 'artifact'
                  ? 'bg-sky-500/15 text-sky-300 shadow-xs border border-sky-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850/50'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedSkill === 'artifact' ? 'text-sky-400' : 'text-stone-500'}`} />
              <span>Interactive HTML</span>
            </button>
          </div>

          {/* Contextual Mode Target & Grounding Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium shrink-0 min-w-0">
            {selectedSkill === 'chat' && (
              <span className="text-amber-400/90 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="truncate">5,993 chunks grounded</span>
              </span>
            )}
            {selectedSkill === 'ship30' && (
              <span className="text-amber-400/90 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 truncate">
                <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">~1,250w Essay Artifact</span>
              </span>
            )}
            {selectedSkill === 'artifact' && (
              <span className="text-sky-400/90 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 truncate">
                <Layers className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Interactive HTML Sandbox</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Inspiration Starters (Dedicated row, fully separated with breathing room) */}
        {!input.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 select-none">
              <Sparkles className="w-3 h-3 text-amber-400/80 shrink-0" />
              <span>Try:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap">
              {INSPIRATION_STARTERS[selectedSkill].map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickInspiration(starter)}
                  className={`group px-3 py-1 rounded-full border text-stone-300 hover:text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs ${
                    selectedSkill === 'artifact'
                      ? 'bg-stone-900/90 hover:bg-sky-500/15 border-stone-800 hover:border-sky-500/40 hover:text-sky-200'
                      : 'bg-stone-900/90 hover:bg-amber-500/15 border-stone-800 hover:border-amber-500/40 hover:text-amber-200'
                  }`}
                >
                  <span className="truncate max-w-[220px] sm:max-w-[280px]">{starter}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Mode-Adaptive Input Container */}
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-end rounded-2xl bg-stone-900/95 border transition-all duration-200 ${
            selectedSkill === 'artifact'
              ? 'border-stone-800 focus-within:border-sky-500/60 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-lg shadow-sky-950/20'
              : selectedSkill === 'ship30'
              ? 'border-stone-800 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-lg shadow-amber-950/20'
              : 'border-stone-800 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-lg shadow-black/40'
          } p-2 sm:p-2.5 gap-2`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedSkill === 'ship30'
                ? 'Enter topic or guest framework for ~1,250w Ship 30 essay...'
                : selectedSkill === 'artifact'
                ? 'Describe interactive HTML prototype, PMF calculator, or simulator...'
                : "Ask anything grounded in Lenny's podcast (e.g. Elena Verna on PLG)..."
            }
            className="w-full bg-transparent text-sm text-stone-100 placeholder-stone-500 resize-none px-2 py-1 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 border-none max-h-32 sm:max-h-40 leading-relaxed scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title={input.trim() ? 'Send message (Enter)' : 'Type a message to send'}
            className={`p-2.5 sm:p-3 rounded-xl transition-all shrink-0 cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
              input.trim() && !isLoading
                ? selectedSkill === 'artifact'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-stone-950 hover:from-sky-400 hover:to-cyan-300 shadow-md shadow-sky-950/40 active:scale-95 font-bold'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400 text-stone-950 hover:from-amber-400 hover:to-orange-300 shadow-md shadow-amber-950/40 active:scale-95 font-bold'
                : 'bg-stone-800/80 text-stone-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Polished Status Bar with Keyboard Badges & Live Provider Status */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 select-none">
          <div className="hidden sm:flex items-center gap-1.5 text-stone-500">
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-[10px] text-stone-400 shadow-2xs">
              Enter
            </kbd>
            <span>to send</span>
            <span className="text-stone-700">•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-[10px] text-stone-400 shadow-2xs">
              Shift + Enter
            </kbd>
            <span>newline</span>
          </div>

          <div className="font-mono flex items-center gap-1.5 ml-auto sm:ml-0 text-stone-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="capitalize text-stone-300 font-medium">{activeProvider}</span>
            {activeModel && (
              <>
                <span className="text-stone-700">•</span>
                <span className="text-amber-400/90 font-mono font-medium">{activeModel}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
