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
  onTriggerPrototype?: (content: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onSelectPromptChip?: (prompt: string, skill?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  artifacts = [],
  suggestions = [],
  isLast = false,
  onTriggerShip30,
  onTriggerPrototype,
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

  // Format artifact markers in inline chat: render markdown deliverables directly, while summarizing HTML prototypes
  let cleanContent = message.content.replace(
    /:::artifact\s*(?:\{([^}]*)\}|[^\n]*)\s*([\s\S]*?)(?::::|$)/g,
    (match, p1, p2) => {
      const attrs = p1 || match;
      const typeMatch = attrs.match(/type=["']?([^"'\s}]+)["']?/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'markdown';
      const titleMatch = attrs.match(/title=["']?([^"'\n}]+)["']?/i);
      const title = titleMatch ? titleMatch[1] : 'Generated Artifact';
      const body = (p2 || '').trim();

      // For markdown artifacts (e.g. Ship 30 essays, PRDs, frameworks), keep the full formatted essay in the chat!
      if (type === 'markdown' || type === 'essay' || (!body.includes('<!DOCTYPE') && !body.includes('<html'))) {
        return `\n\n${body}\n\n`;
      }

      // For HTML prototype artifacts, render a clean card pointing to the interactive sandbox
      return `\n\n> ⚡ **Interactive Prototype Generated:** *${title}* — Explore and interact in the Deliverables panel on the right.\n\n`;
    }
  );
  // Clean any leftover orphan ::: tags
  cleanContent = cleanContent.replace(/^\s*:::\s*$/gm, '').trim();

  // Enhance formatting for cleaner visual presentation (auto-bullet key terms & title headings)
  const enhanceFormatting = (raw: string): string => {
    if (!raw) return '';
    const lines = raw.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trim();

      if (stripped.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        result.push(line);
        continue;
      }

      if (inCodeBlock) {
        result.push(line);
        continue;
      }

      // Convert standalone unheaded section titles into styled markdown headings
      if (
        stripped &&
        !stripped.startsWith('#') &&
        !stripped.startsWith('-') &&
        !stripped.startsWith('*') &&
        !stripped.startsWith('>') &&
        !stripped.startsWith('|') &&
        !stripped.endsWith('.') &&
        !stripped.endsWith(':') &&
        !stripped.endsWith(';') &&
        !stripped.endsWith(',') &&
        stripped.length > 3 &&
        stripped.length < 55 &&
        /^[A-Z][A-Za-z0-9\s/&,–—'-]+$/.test(stripped) &&
        !/^(let|const|var|if|return|for|while|export|import|Feature|Competitor)\b/i.test(stripped)
      ) {
        result.push(`\n### ${stripped}\n`);
        continue;
      }

      // Convert unbulleted "Key Topic: Details" into clean bullet list items
      const kvMatch = stripped.match(/^([A-Z][A-Za-z0-9\s/&'-]{2,40}):\s+(.+)$/);
      if (kvMatch && !stripped.startsWith('-') && !stripped.startsWith('*') && !stripped.startsWith('>') && !stripped.startsWith('|')) {
        result.push(`- **${kvMatch[1]}**: ${kvMatch[2]}`);
        continue;
      }

      result.push(line);
    }

    return result.join('\n');
  };

  const formattedContent = isUser ? cleanContent : enhanceFormatting(cleanContent);

  if (isUser) {
    return (
      <div className="py-2.5 sm:py-3 px-3 sm:px-4 md:px-8 bg-transparent">
        <div className="max-w-3xl xl:max-w-4xl mx-auto flex justify-end">
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
      <div className="max-w-3xl xl:max-w-4xl mx-auto flex gap-2.5 sm:gap-4">
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

          {/* Formatted Markdown with Custom Styled Components */}
          <div className="text-xs md:text-sm text-stone-200 leading-relaxed prose prose-invert prose-stone max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-base sm:text-lg font-bold text-amber-300 mt-4 mb-2 pb-1 border-b border-stone-800" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-sm sm:text-base font-bold text-amber-300 mt-4 mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xs sm:text-sm font-bold text-amber-200 mt-3.5 mb-1.5 flex items-center gap-1.5" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-xs sm:text-sm leading-relaxed text-stone-200 mb-3" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-stone-200 mb-3.5 marker:text-amber-400" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-stone-200 mb-3.5 marker:text-amber-400" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-stone-200 leading-relaxed pl-0.5" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-amber-500/70 bg-stone-900/60 px-3.5 py-2.5 my-3 text-xs sm:text-sm text-stone-300 italic rounded-r-xl shadow-xs" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3.5 rounded-xl border border-stone-800 bg-stone-900/50 shadow-inner">
                    <table className="w-full text-left text-xs text-stone-200 border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-stone-900/90 text-amber-300 font-semibold border-b border-stone-800" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="px-3 py-2.5 font-semibold text-amber-300 text-xs border-r border-stone-800/60 last:border-r-0 tracking-wide" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-3 py-2 border-b border-stone-800/60 border-r border-stone-800/40 last:border-r-0 text-stone-300 text-xs" {...props} />
                ),
                code: ({ node, className, children, ...props }) => {
                  const isBlock = Boolean(className);
                  return isBlock ? (
                    <pre className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono overflow-x-auto text-stone-200 my-2.5 shadow-inner">
                      <code {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono text-amber-300" {...props}>
                      {children}
                    </code>
                  );
                },
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-amber-100" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-4 border-stone-800/80" {...props} />
                ),
              }}
            >
              {formattedContent}
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
                  {citations.map((c, idx) => {
                    const isLastOdd = idx === citations.length - 1 && citations.length % 2 !== 0;
                    return (
                      <a
                        key={idx}
                        href={c.youtube_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 transition-all flex flex-col justify-between group text-left shadow-xs ${
                          isLastOdd ? 'sm:col-span-2' : ''
                        }`}
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
                    );
                  })}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/40 text-xs font-semibold text-stone-300 hover:text-amber-300 transition-all cursor-pointer shadow-xs group"
                  title="Generate a publication-grade Ship 30 for 30 essay grounded in this answer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Turn into Ship 30 Essay (~1,250 words)</span>
                </button>

                <button
                  onClick={() =>
                    onTriggerPrototype
                      ? onTriggerPrototype(message.content)
                      : onSelectPromptChip?.(
                          `Build an interactive HTML prototype and calculator widget based on this strategic insight:\n\n${message.content.slice(0, 450)}`,
                          'artifact'
                        )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-sky-500/10 border border-stone-800 hover:border-sky-500/40 text-xs font-semibold text-stone-300 hover:text-sky-300 transition-all cursor-pointer shadow-xs group"
                  title="Generate an interactive HTML prototype or calculator widget in the Artifact Viewer"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Build Interactive HTML Prototype</span>
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
