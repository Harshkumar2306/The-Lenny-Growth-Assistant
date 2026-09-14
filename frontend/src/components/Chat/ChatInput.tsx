import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BookOpen, Layers } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, skill: string) => void;
  isLoading: boolean;
  activeProvider: string;
  activeModel?: string;
}

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

  return (
    <div className="p-2 sm:p-3 md:p-5 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 safe-pb flex-shrink-0">
      <div className="max-w-3xl mx-auto space-y-2 sm:space-y-2.5">
        {/* Mode Selector Chips with Clear Output Target */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 text-xs select-none scrollbar-none touch-manipulation">
          <button
            type="button"
            onClick={() => setSelectedSkill('chat')}
            title="Generates verified grounded answers directly in the chat feed"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
              selectedSkill === 'chat'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
                : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Grounded Q&A</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-stone-800/90 text-stone-400 border border-stone-750">
              Chat
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSkill('ship30')}
            title="Generates an executive ~1,250-word essay that renders in the Artifact Viewer"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
              selectedSkill === 'ship30'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs'
                : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Ship 30 Essay</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Artifact
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSkill('artifact')}
            title="Generates an interactive HTML/JS widget or prototype that renders in the Artifact Viewer"
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 min-h-[32px] ${
              selectedSkill === 'artifact'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-xs'
                : 'bg-stone-900/90 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Interactive HTML</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Artifact
            </span>
          </button>
        </div>

        {/* Input Container */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end rounded-2xl bg-stone-900 border border-stone-750 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 shadow-lg p-1.5 sm:p-2 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedSkill === 'ship30'
                ? 'Topic or guest for ~1,250w Ship 30 essay...'
                : selectedSkill === 'artifact'
                ? 'HTML prototype or calculator to build...'
                : 'Ask anything grounded in Lenny\'s podcast...'
            }
            className="w-full bg-transparent text-base sm:text-sm text-stone-100 placeholder-stone-500 resize-none px-2.5 py-2 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 border-none max-h-32 sm:max-h-36 leading-relaxed scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-950/40 scale-100 active:scale-95'
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

        <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 select-none">
          <span className="hidden sm:inline">Enter to send • Shift+Enter for new line</span>
          <span className="font-mono flex items-center gap-1.5 ml-auto sm:ml-0 text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="capitalize text-stone-300 font-medium">{activeProvider}</span>
            {activeModel && (
              <>
                <span className="text-stone-600">•</span>
                <span className="text-stone-400">{activeModel}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
