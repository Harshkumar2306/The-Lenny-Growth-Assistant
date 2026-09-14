import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, BookOpen, Printer, Copy, Check, ListFilter, Sparkles, ChevronDown } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const textContent = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3">
      <div className="absolute right-2.5 top-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="px-2 py-1 rounded-md bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-stone-100 text-[10px] font-mono flex items-center gap-1 border border-stone-750 shadow-xs cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs font-mono overflow-x-auto text-stone-200 shadow-inner">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);

  // Compute word count and reading time
  const { wordCount, readingTime } = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 225));
    return { wordCount: words, readingTime: minutes };
  }, [content]);

  // Extract headings for outline navigation
  const headings: HeadingItem[] = useMemo(() => {
    const lines = content.split('\n');
    const items: HeadingItem[] = [];
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*_`]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (text && id) {
          items.push({ id, text, level });
        }
      }
    });
    return items;
  }, [content]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsOutlineOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-stone-950 text-stone-200">
      {/* Quick Outline Navigator (When document has 2+ headings) */}
      {headings.length >= 2 && (
        <div className="border-b border-stone-800/80 bg-stone-900/60 px-3.5 py-1.5 flex items-center justify-between text-xs text-stone-400 select-none flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setIsOutlineOpen(!isOutlineOpen)}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors flex-shrink-0 cursor-pointer"
            >
              <ListFilter className="w-3 h-3" />
              <span>Outline ({headings.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isOutlineOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Chips for First 3 Major Sections */}
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              {headings.slice(0, 3).map((h) => (
                <button
                  key={h.id}
                  onClick={() => scrollToHeading(h.id)}
                  className="px-2 py-0.5 rounded-md hover:bg-stone-800 text-stone-400 hover:text-stone-200 truncate max-w-[130px] cursor-pointer transition-colors"
                  title={h.text}
                >
                  {h.text}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[10px] font-mono text-stone-500 hidden md:inline">
            Executive Deliverable
          </span>
        </div>
      )}

      {/* Expanded Table of Contents Drawer */}
      {isOutlineOpen && headings.length >= 2 && (
        <div className="border-b border-stone-800 bg-stone-900/95 p-3 max-h-48 overflow-y-auto space-y-1 text-xs shadow-lg animate-fadeIn flex-shrink-0">
          <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1.5 px-1">
            Document Structure
          </div>
          {headings.map((h, idx) => (
            <button
              key={`${h.id}-${idx}`}
              onClick={() => scrollToHeading(h.id)}
              className={`w-full text-left px-2 py-1 rounded-md transition-colors hover:bg-stone-800 hover:text-amber-300 flex items-center gap-2 cursor-pointer ${
                h.level === 1
                  ? 'font-semibold text-stone-200'
                  : h.level === 2
                  ? 'pl-4 text-stone-300'
                  : 'pl-6 text-stone-400 text-[11px]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 flex-shrink-0" />
              <span className="truncate">{h.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Formatted Document */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8 scrollbar-thin scroll-touch print:p-0 print:bg-white print:text-black">
        <div className="max-w-2xl mx-auto prose prose-invert prose-stone">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h1
                    id={id}
                    className="scroll-mt-6 text-xl md:text-2xl font-bold tracking-tight text-stone-100 mt-2 mb-4 pb-2.5 border-b border-stone-800"
                    {...props}
                  >
                    {children}
                  </h1>
                );
              },
              h2: ({ node, children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h2
                    id={id}
                    className="scroll-mt-6 text-base md:text-lg font-semibold tracking-tight text-amber-300 mt-6 mb-2.5 flex items-center gap-2"
                    {...props}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                    <span>{children}</span>
                  </h2>
                );
              },
              h3: ({ node, children, ...props }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h3
                    id={id}
                    className="scroll-mt-6 text-sm md:text-base font-semibold text-stone-200 mt-4 mb-2"
                    {...props}
                  >
                    {children}
                  </h3>
                );
              },
              p: ({ node, ...props }) => (
                <p className="text-xs md:text-sm leading-relaxed text-stone-300 mb-3.5" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm text-stone-300 mb-4" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-stone-300 mb-4" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-stone-300 leading-relaxed" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-2 border-amber-400/80 bg-gradient-to-r from-amber-500/10 to-transparent px-3.5 py-2.5 my-3.5 text-xs md:text-sm text-stone-200 italic rounded-r-lg shadow-inner"
                  {...props}
                />
              ),
              code: ({ node, className, children, ...props }) => {
                const isBlock = Boolean(className);
                return isBlock ? (
                  <CodeBlock className={className}>{children}</CodeBlock>
                ) : (
                  <code className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono text-amber-300" {...props}>
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4 border border-stone-800 rounded-xl bg-stone-900/40">
                  <table className="w-full text-left text-xs text-stone-300" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-stone-900/90 text-stone-100 border-b border-stone-800 font-semibold" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="p-2.5 font-semibold text-stone-200" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="p-2.5 border-b border-stone-850/60" {...props} />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-5 border-stone-800" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Subtle Editorial Meta Footer */}
      {wordCount >= 30 && (
        <div className="px-5 py-2 border-t border-stone-800/80 bg-stone-900/40 text-[11px] text-stone-400 flex items-center justify-between select-none flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-stone-400 font-mono">
              <BookOpen className="w-3 h-3 text-stone-500" />
              <span>{wordCount.toLocaleString()} words</span>
            </span>
            <span className="text-stone-600">•</span>
            <span className="flex items-center gap-1.5 text-stone-400 font-mono">
              <Clock className="w-3 h-3 text-stone-500" />
              <span>~{readingTime} min read</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {wordCount >= 800 && wordCount <= 1600 && (
              <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Ship 30</span>
              </span>
            )}
            <button
              onClick={handlePrint}
              title="Print or Save as PDF"
              className="p-1 rounded-md hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
