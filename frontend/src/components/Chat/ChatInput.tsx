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
    <div className="p-2 sm:p-3 md:p-5 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 safe-pb flex-shrink-0 select-none">
      <div className="max-w-3xl mx-auto space-y-2 sm:space-y-2.5">
        {/* Mode Selector Chips with Clear Output Target & Dynamic Hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs scrollbar-none touch-manipulation">
            {/* Grounded Q&A */}
            <button
              type="button"
              onClick={() => setSelectedSkill('chat')}
              title="Generates verified grounded answers directly in the chat feed"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
                selectedSkill === 'chat'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950/40'
                  : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${selectedSkill === 'chat' ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
              <span>Grounded Q&A</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-stone-800/90 text-stone-400 border border-stone-750">
                Chat
              </span>
            </button>

            {/* Ship 30 Essay */}
            <button
              type="button"
              onClick={() => setSelectedSkill('ship30')}
              title="Generates an executive ~1,250-word essay that renders in the Artifact Viewer"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
                selectedSkill === 'ship30'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950/40'
                  : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${selectedSkill === 'ship30' ? 'text-amber-400' : 'text-stone-500'}`} />
              <span>Ship 30 Essay</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Artifact
              </span>
            </button>

            {/* Interactive HTML */}
            <button
              type="button"
              onClick={() => setSelectedSkill('artifact')}
              title="Generates an interactive HTML/JS widget or prototype that renders in the Artifact Viewer"
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
                selectedSkill === 'artifact'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm shadow-sky-950/40'
                  : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedSkill === 'artifact' ? 'text-sky-400' : 'text-stone-500'}`} />
              <span>Interactive HTML</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Artifact
              </span>
            </button>
          </div>

          {/* Mode Subtext Hint */}
          <div className="text-[11px] text-stone-400 hidden sm:flex items-center gap-1.5 truncate">
            {selectedSkill === 'chat' && (
              <span className="text-amber-400/80">Answers grounded in 5,993 podcast chunks</span>
            )}
            {selectedSkill === 'ship30' && (
              <span className="text-amber-400/90 font-medium">Generates ~1,250w essay in Artifact Viewer</span>
            )}
            {selectedSkill === 'artifact' && (
              <span className="text-sky-400/90 font-medium">Builds live interactive simulator in Artifact Viewer</span>
            )}
          </div>
        </div>

        {/* Quick Inspiration Starters (Visible when input is empty) */}
        {!input.trim() && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-[11px] animate-in fade-in duration-200">
            <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex-shrink-0">
              Try:
            </span>
            {INSPIRATION_STARTERS[selectedSkill].map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickInspiration(starter)}
                className={`px-2 py-0.5 rounded-lg border text-stone-300 hover:text-white transition-all cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px] ${
                  selectedSkill === 'artifact'
                    ? 'bg-stone-900/80 hover:bg-sky-500/15 border-stone-800 hover:border-sky-500/40 hover:text-sky-200'
                    : 'bg-stone-900/80 hover:bg-amber-500/15 border-stone-800 hover:border-amber-500/40 hover:text-amber-200'
                }`}
              >
                <span className="truncate max-w-[200px] sm:max-w-[260px]">{starter}</span>
                <ArrowUpRight className="w-2.5 h-2.5 opacity-50 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Mode-Adaptive Input Container */}
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-end rounded-2xl bg-stone-900 border transition-all ${
            selectedSkill === 'artifact'
              ? 'border-sky-500/40 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-lg shadow-sky-950/20'
              : selectedSkill === 'ship30'
              ? 'border-amber-500/40 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-lg shadow-amber-950/20'
              : 'border-stone-750 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-lg shadow-black/40'
          } p-1.5 sm:p-2`}
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
                : 'Ask anything grounded in Lenny\'s podcast (e.g. Elena Verna on PLG)...'
            }
            className="w-full bg-transparent text-base sm:text-sm text-stone-100 placeholder-stone-500 resize-none px-2.5 py-2 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 border-none max-h-32 sm:max-h-36 leading-relaxed scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            title={input.trim() ? 'Send message (Enter)' : 'Type a message to send'}
            className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
              input.trim() && !isLoading
                ? selectedSkill === 'artifact'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-stone-950 hover:from-sky-400 hover:to-cyan-300 shadow-md shadow-sky-950/40 scale-100 active:scale-95 font-bold'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400 text-stone-950 hover:from-amber-400 hover:to-orange-300 shadow-md shadow-amber-950/40 scale-100 active:scale-95 font-bold'
                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
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
            <span>•</span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-[10px] text-stone-400 shadow-2xs">
              Shift + Enter
            </kbd>
            <span>newline</span>
          </div>

          <div className="font-mono flex items-center gap-1.5 ml-auto sm:ml-0 text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="capitalize text-stone-300 font-medium">{activeProvider}</span>
            {activeModel && (
              <>
                <span className="text-stone-600">•</span>
                <span className="text-amber-400/90 font-mono font-medium">{activeModel}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
