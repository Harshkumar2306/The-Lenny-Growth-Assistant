import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, Youtube, ExternalLink, BookOpen, Copy, Check, ChevronDown, ChevronUp, Layers, ArrowRight } from 'lucide-react';
import { Message, Artifact } from '../../lib/api';

interface MessageItemProps {
  message: Message;
  artifacts?: Artifact[];
  suggestions?: string[];
  isLast?: boolean;
  onTriggerShip30: (content: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onSelectPromptChip?: (prompt: string, skill?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  artifacts = [],
  suggestions = [],
  isLast = false,
  onTriggerShip30,
  onOpenArtifact,
  onSelectPromptChip,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);

  const isUser = message.role === 'user';
  const citations = message.citations || [];

  const relatedArtifacts = artifacts.filter(
    a => a.message_id === message.id || message.content.includes(a.id)
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Strip artifact markers from inline chat to keep conversation clean and point to side panel
  let cleanContent = message.content.replace(
    /:::artifact\s*(?:\{([^}]*)\}|[^\n]*)\s*([\s\S]*?)(?::::|$)/g,
    (match, p1) => {
      const attrs = p1 || match;
      const titleMatch = attrs.match(/title=["']?([^"'\n}]+)["']?/);
      const title = titleMatch ? titleMatch[1] : 'Generated Artifact';
      const typeMatch = attrs.match(/type=["']?([^"'\s}]+)["']?/);
      const type = typeMatch ? typeMatch[1] : 'markdown';
      return `\n\n> 📦 **Created Artifact:** *${title}* (${type.toUpperCase()}) — Open in side-by-side Artifact Viewer.\n\n`;
    }
  );
  // Clean any leftover orphan ::: tags
  cleanContent = cleanContent.replace(/^\s*:::\s*$/gm, '').trim();

  if (isUser) {
    return (
      <div className="py-2.5 sm:py-3 px-3 sm:px-4 md:px-8 bg-transparent">
        <div className="max-w-3xl mx-auto flex justify-end">
          <div className="flex flex-col items-end max-w-[94%] sm:max-w-[85%] md:max-w-[78%] space-y-1.5">
            {/* Header: Label & Copy */}
            <div className="flex items-center gap-1.5 px-1 text-[11px] text-stone-400">
              <div className="w-4 h-4 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400">
                <User className="w-2.5 h-2.5" />
              </div>
              <span className="font-semibold text-stone-300">You</span>
              <button
                onClick={handleCopy}
                title="Copy Message"
                className="text-stone-500 hover:text-stone-300 p-0.5 rounded transition-colors cursor-pointer ml-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* User Message Bubble */}
            <div className="bg-stone-850 hover:bg-stone-800 border border-stone-750/80 rounded-2xl rounded-tr-xs px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs md:text-sm text-stone-100 leading-relaxed shadow-sm transition-colors selection:bg-amber-500/30">
              <div className="prose prose-invert prose-stone max-w-none text-xs md:text-sm text-stone-100 leading-relaxed prose-p:my-1 prose-pre:my-2 break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4 md:px-8 bg-stone-950/60 transition-colors">
      <div className="max-w-3xl mx-auto flex gap-2.5 sm:gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-0.5 shadow-md shadow-amber-950/30">
            <div className="w-full h-full bg-stone-950 rounded-[7px] sm:rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-200">
                The Lenny Growth Assistant
              </span>
              {citations.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Verified Podcast Grounding
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              title="Copy Message"
              className="text-stone-500 hover:text-stone-300 p-1 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Formatted Markdown */}
          <div className="text-xs md:text-sm text-stone-200 leading-relaxed prose prose-invert prose-stone max-w-none prose-p:my-2 prose-headings:text-amber-300 prose-strong:text-amber-100 prose-strong:font-bold prose-code:text-amber-300 prose-code:bg-stone-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          </div>

          {/* Rendered Artifact Card */}
          {relatedArtifacts.length > 0 && (
            <div className="pt-2 space-y-2">
              {relatedArtifacts.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onOpenArtifact(art)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/40 hover:border-amber-500/70 active:scale-[0.99] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group transition-all shadow-md shadow-amber-950/20"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-100 group-hover:text-amber-300 transition-colors truncate">
                        {art.title}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 truncate">
                        {art.artifact_type.toUpperCase()} • Click to open in side-by-side Artifact Viewer
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 self-end sm:self-auto flex-shrink-0">
                    Open Artifact &rarr;
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Verified Podcast Citations & Timestamps */}
          {!isUser && citations.length > 0 && (
            <div className="pt-2 border-t border-stone-800/80">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
              >
                <Youtube className="w-4 h-4 text-red-400" />
                <span>Verified Podcast Sources ({citations.length})</span>
                {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCitations && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
                  {citations.map((c, idx) => (
                    <a
                      key={idx}
                      href={c.youtube_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 transition-all flex flex-col justify-between group text-left shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-stone-200">
                          <span className="truncate group-hover:text-amber-300">{c.guest}</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-amber-400 flex-shrink-0 ml-1" />
                        </div>
                        <div className="text-[11px] text-stone-400 truncate mt-0.5">{c.title}</div>
                        <p className="text-[11px] text-stone-300/90 italic mt-2 line-clamp-2 border-l-2 border-amber-500/40 pl-2">
                          "{c.quote}"
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                        <span className="text-amber-400/90 flex items-center gap-1">
                          <Youtube className="w-3 h-3 text-red-500" />
                          <span>Timestamp: {c.timestamp}</span>
                        </span>
                        {c.relevance_score && (
                          <span className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800 text-stone-400">
                            Match: {Math.round(c.relevance_score * 100)}%
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Buttons & Suggestions for Assistant Message */}
          {!isUser && (
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onTriggerShip30(message.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/40 text-xs font-semibold text-stone-300 hover:text-amber-300 transition-all cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Turn into Ship 30 for 30 Essay (~1,250 words)</span>
                </button>
              </div>

              {isLast && suggestions && suggestions.length > 0 && (
                <div className="pt-2 border-t border-stone-900/60 space-y-2">
                  <div className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Suggested Follow-ups</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectPromptChip && onSelectPromptChip(sug, sug.toLowerCase().includes('ship 30') ? 'ship30' : 'chat')}
                        className="text-left text-xs px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-200 transition-all cursor-pointer group flex items-center gap-2"
                      >
                        <span>{sug}</span>
                        <ArrowRight className="w-3 h-3 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
