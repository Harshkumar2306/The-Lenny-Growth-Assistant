import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, ArrowDown, BookOpen, Layers, ArrowUpRight } from 'lucide-react';
import { Message, Artifact, Citation } from '../../lib/api';
import { MessageItem } from './MessageItem';

interface ChatPaneProps {
  messages: Message[];
  artifacts: Artifact[];
  suggestions?: string[];
  streamingMessage: string;
  streamingStatus: string;
  streamingCitations?: Citation[];
  isLoading: boolean;
  onTriggerShip30: (content: string) => void;
  onTriggerPrototype?: (content: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onSelectPromptChip: (prompt: string, skill?: string) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  artifacts,
  suggestions = [],
  streamingMessage,
  streamingStatus,
  streamingCitations,
  isLoading,
  onTriggerShip30,
  onTriggerPrototype,
  onOpenArtifact,
  onSelectPromptChip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  // Check if user is scrolled up or near bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If within 100px of bottom, consider user pinned to bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isScrolledUp = distanceFromBottom > 100;

    isUserScrolledUpRef.current = isScrolledUp;
    setShowScrollBottom(isScrolledUp);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // When a new message arrives or loading begins (e.g. user submitted prompt), reset to bottom
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isLoading, scrollToBottom]);

  // While tokens are streaming: ONLY auto-scroll IF the user has NOT scrolled up!
  useEffect(() => {
    if (!isUserScrolledUpRef.current && isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [streamingMessage, streamingStatus, isLoading]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin scroll-touch flex flex-col relative"
    >
      {messages.length === 0 && !isLoading ? (
        /* Empty State Hero - Adaptive Command Center */
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-3xl lg:max-w-4xl mx-auto w-full my-auto animate-in fade-in duration-200 select-none">
          {/* Badge & Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-950/40 mb-3">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-100 tracking-tight">
              How can I help you grow today?
            </h2>
          </div>
        </div>
      ) : (
        /* Conversation Feed */
        <div className="flex-1 divide-y divide-stone-900/60">
          {messages.map((msg, idx) => (
            <MessageItem
              key={msg.id}
              message={msg}
              artifacts={artifacts}
              suggestions={idx === messages.length - 1 ? suggestions : undefined}
              isLast={idx === messages.length - 1}
              onTriggerShip30={onTriggerShip30}
              onTriggerPrototype={onTriggerPrototype}
              onOpenArtifact={onOpenArtifact}
              onSelectPromptChip={onSelectPromptChip}
            />
          ))}

          {/* Active Real-Time Streaming State */}
          {isLoading && (
            <div className="py-5 px-3 md:px-8 bg-stone-950">
              <div className="max-w-3xl xl:max-w-4xl mx-auto flex gap-3 md:gap-4">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shadow-amber-950/30">
                    <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-200">Lenny Growth Assistant</span>
                    {streamingStatus && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 text-amber-400 border border-stone-800 font-medium animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{streamingStatus}</span>
                        {streamingCitations && streamingCitations.length > 0 && ` (${streamingCitations.length} sources)`}
                      </span>
                    )}
                  </div>

                  {streamingMessage ? (
                    <div className="text-xs md:text-sm text-stone-200 leading-relaxed whitespace-pre-wrap">
                      {streamingMessage}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      {/* Floating Scroll-to-Bottom Pill when user scrolls up during output */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="sticky bottom-4 self-center z-20 px-3 py-1.5 rounded-full bg-stone-900/95 hover:bg-stone-850 text-stone-200 border border-stone-750 shadow-xl shadow-black/80 flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer group hover:border-amber-500/50 hover:text-amber-300 animate-in fade-in duration-150 my-1"
        >
          {isLoading && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
          <span>Scroll to latest</span>
          <ArrowDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
