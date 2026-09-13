import React, { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
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
  onOpenArtifact,
  onSelectPromptChip,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, streamingStatus]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin scroll-touch flex flex-col">
      {messages.length === 0 && !isLoading ? (
        /* Empty State Hero */
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 max-w-2xl mx-auto text-center my-auto">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-950/40 mb-4">
            <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-stone-100 tracking-tight">
            How can I help you grow today?
          </h2>
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
              onOpenArtifact={onOpenArtifact}
              onSelectPromptChip={onSelectPromptChip}
            />
          ))}

          {/* Active Real-Time Streaming State */}
          {isLoading && (
            <div className="py-5 px-3 md:px-8 bg-stone-950">
              <div className="max-w-3xl mx-auto flex gap-3 md:gap-4">
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
    </div>
  );
};
