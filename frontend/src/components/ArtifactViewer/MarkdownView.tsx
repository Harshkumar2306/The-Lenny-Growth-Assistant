import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, BookOpen, Printer } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  // Compute word count and reading time
  const { wordCount, readingTime } = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 225));
    return { wordCount: words, readingTime: minutes };
  }, [content]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col bg-stone-950 text-stone-200">
      {/* Main Formatted Document */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8 scrollbar-thin scroll-touch print:p-0 print:bg-white print:text-black">
        <div className="max-w-2xl mx-auto prose prose-invert prose-stone">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-100 mt-1 mb-4 pb-2.5 border-b border-stone-800" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base md:text-lg font-semibold tracking-tight text-stone-100 mt-6 mb-2.5" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm md:text-base font-semibold text-stone-200 mt-4 mb-2" {...props} />
              ),
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
                <blockquote className="border-l-2 border-amber-500/60 bg-stone-900/40 px-3.5 py-2 my-3 text-xs md:text-sm text-stone-300 italic rounded-r-lg" {...props} />
              ),
              code: ({ node, className, children, ...props }) => {
                const isBlock = Boolean(className);
                return isBlock ? (
                  <pre className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 text-xs font-mono overflow-x-auto text-stone-200 my-3 shadow-inner">
                    <code {...props}>{children}</code>
                  </pre>
                ) : (
                  <code className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-mono text-amber-300" {...props}>
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4 border border-stone-800 rounded-lg">
                  <table className="w-full text-left text-xs text-stone-300" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-stone-900 text-stone-100 border-b border-stone-800 font-semibold" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="p-2.5 font-semibold" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="p-2.5 border-b border-stone-800/60" {...props} />
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

      {/* Subtle Editorial Meta Footer (Only shown when document has substantial content) */}
      {wordCount >= 50 && (
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
            {wordCount >= 1000 && wordCount <= 1500 && (
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Ship 30
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
