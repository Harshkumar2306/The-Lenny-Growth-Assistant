import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Download, Code, Eye, FileText, Globe, Maximize2, Minimize2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Artifact } from '../../lib/api';
import { MarkdownView } from './MarkdownView';
import { SandboxIframe } from './SandboxIframe';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  artifactsList: Artifact[];
  onSelectArtifact: (art: Artifact) => void;
  onClose: () => void;
  isDesktop?: boolean;
}

const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 640; // Hard ceiling: cannot extend past this extent

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  artifactsList,
  onSelectArtifact,
  onClose,
  isDesktop = true,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(MIN_PANEL_WIDTH);
  const isResizingRef = useRef(false);

  // Drag-to-resize listener on desktop with strict extent boundary
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !isDesktop) return;
      const newWidth = window.innerWidth - e.clientX;
      // Maximum extent: strictly bounded by MAX_PANEL_WIDTH (640px) or 50% screen width
      const maxAllowed = Math.min(
        MAX_PANEL_WIDTH,
        Math.floor(window.innerWidth * 0.5),
        Math.max(MIN_PANEL_WIDTH, window.innerWidth - 500)
      );
      if (newWidth >= MIN_PANEL_WIDTH && newWidth <= maxAllowed) {
        setPanelWidth(newWidth);
      } else if (newWidth > maxAllowed) {
        setPanelWidth(maxAllowed);
      } else if (newWidth < MIN_PANEL_WIDTH) {
        setPanelWidth(MIN_PANEL_WIDTH);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isDesktop) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDesktop]);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDesktop) return;
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  if (!artifact) {
    return (
      <aside
        style={{
          width: !isDesktop || isFullscreen ? '100%' : `${panelWidth}px`,
          minWidth: isDesktop && !isFullscreen ? `${MIN_PANEL_WIDTH}px` : undefined,
          maxWidth: isDesktop && !isFullscreen ? `${MAX_PANEL_WIDTH}px` : undefined,
        }}
        className={`border-l border-stone-800 bg-stone-900 flex flex-col h-full shadow-2xl transition-all duration-75 relative z-10 flex-shrink-0 ${
          !isDesktop || isFullscreen ? 'w-full' : ''
        }`}
      >
        {/* Resizable Left Edge Drag Handle (Desktop only) */}
        {isDesktop && !isFullscreen && (
          <div
            onMouseDown={handleStartResize}
            onDoubleClick={() => setPanelWidth(MIN_PANEL_WIDTH)}
            title={`Drag to resize (${MIN_PANEL_WIDTH}px – max ${MAX_PANEL_WIDTH}px) • Double-click to reset`}
            className="absolute left-0 top-0 bottom-0 w-1 -ml-0.5 cursor-col-resize hover:w-1.5 hover:bg-amber-500/60 transition-all z-20"
          />
        )}

        {/* Top Header */}
        <div className="h-12 sm:h-13 border-b border-stone-800 px-3 sm:px-3.5 flex items-center justify-between bg-stone-900/95 backdrop-blur flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!isDesktop && (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-300 text-xs font-semibold cursor-pointer border border-stone-700/60 shadow-xs flex-shrink-0"
                title="Return to Chat"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs md:text-sm font-semibold text-stone-100 truncate">
              Artifact Viewer
            </h2>
          </div>

          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Empty State Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400 my-auto select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3.5 shadow-md shadow-amber-950/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-100 tracking-tight">No Deliverables Yet</h3>
          <p className="text-xs text-stone-400 mt-1.5 max-w-[260px] leading-relaxed">
            When the assistant generates a Ship 30 essay, strategic framework, or interactive HTML prototype, it will render here.
          </p>
          <div className="mt-5 p-3 rounded-xl bg-stone-950 border border-stone-800/80 text-left text-xs max-w-[280px] w-full space-y-2 shadow-inner">
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
              Quick Tip:
            </div>
            <p className="text-stone-300 text-[11px] leading-relaxed">
              Select the <strong className="text-amber-300">Ship 30 Essay</strong> or <strong className="text-sky-300">Interactive HTML</strong> skill pill above the chat box to create a deliverable.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const isHtml = artifact.artifact_type === 'html';

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension = isHtml ? 'html' : 'md';
    const mimeType = isHtml ? 'text/html' : 'text/markdown';
    const blob = new Blob([artifact.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentIdx = artifactsList.findIndex(a => a.id === artifact.id);

  return (
    <aside
      style={{
        width: !isDesktop || isFullscreen ? '100%' : `${panelWidth}px`,
        minWidth: isDesktop && !isFullscreen ? `${MIN_PANEL_WIDTH}px` : undefined,
        maxWidth: isDesktop && !isFullscreen ? `${MAX_PANEL_WIDTH}px` : undefined,
      }}
      className={`border-l border-stone-800 bg-stone-900 flex flex-col h-full shadow-2xl transition-all duration-75 relative z-10 flex-shrink-0 ${
        !isDesktop || isFullscreen ? 'w-full' : ''
      }`}
    >
      {/* Resizable Left Edge Drag Handle (Desktop only) */}
      {isDesktop && !isFullscreen && (
        <div
          onMouseDown={handleStartResize}
          onDoubleClick={() => setPanelWidth(MIN_PANEL_WIDTH)}
          title={`Drag to resize (${MIN_PANEL_WIDTH}px – max ${MAX_PANEL_WIDTH}px) • Double-click to reset to least expanded`}
          className="absolute left-0 top-0 bottom-0 w-1 -ml-0.5 cursor-col-resize hover:w-1.5 hover:bg-amber-500/60 transition-all z-20"
        />
      )}

      {/* Top Header */}
      <div className="h-12 sm:h-13 border-b border-stone-800 px-3 sm:px-3.5 flex items-center justify-between bg-stone-900/95 backdrop-blur flex-shrink-0 gap-2 sm:gap-3">
        {/* Artifact Title & Icon & Mobile Back */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {!isDesktop && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-300 text-xs font-semibold cursor-pointer border border-stone-700/60 shadow-xs flex-shrink-0"
              title="Return to Chat"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
          )}

          {isHtml ? (
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
          )}
          <h2 className="text-xs md:text-sm font-semibold text-stone-100 truncate min-w-0 flex-1" title={artifact.title}>
            {artifact.title}
          </h2>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Multi-Artifact Navigation */}
          {artifactsList.length > 1 && (
            <div className="flex items-center gap-0.5 bg-stone-950 px-1.5 py-0.5 rounded-lg border border-stone-800 text-[10px]">
              <button
                disabled={currentIdx <= 0}
                onClick={() => onSelectArtifact(artifactsList[currentIdx - 1])}
                className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                title="Previous artifact"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="font-mono text-stone-400 px-1">
                {currentIdx + 1}/{artifactsList.length}
              </span>
              <button
                disabled={currentIdx >= artifactsList.length - 1}
                onClick={() => onSelectArtifact(artifactsList[currentIdx + 1])}
                className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                title="Next artifact"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Preview / Source Icon Toggle */}
          <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800">
            <button
              onClick={() => setActiveTab('preview')}
              title="Preview Rendered Artifact"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-stone-800 text-amber-300 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('code')}
              title="View Raw Source Code"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-stone-800 text-amber-300 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-stone-800" />

          {/* Action Tools */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleCopy}
              title="Copy Content"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleDownload}
              title="Download File"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {isDesktop && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={onClose}
              title="Close Panel"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' ? (
          isHtml ? (
            <SandboxIframe htmlContent={artifact.content} title={artifact.title} />
          ) : (
            <MarkdownView content={artifact.content} />
          )
        ) : (
          <div className="h-full flex flex-col bg-stone-950 font-mono text-xs">
            {/* Code View Header Bar */}
            <div className="px-4 py-2 border-b border-stone-800/80 bg-stone-900/60 flex items-center justify-between text-[11px] text-stone-400 select-none flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-300 uppercase">{isHtml ? 'HTML / CSS / JS' : 'Markdown'}</span>
                <span>•</span>
                <span>{artifact.content.split('\n').length} lines</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-stone-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy code'}</span>
              </button>
            </div>

            {/* Code with Line Numbers */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin flex">
              <div className="select-none text-stone-600 pr-4 text-right border-r border-stone-850 font-mono text-[11px] leading-relaxed">
                {artifact.content.split('\n').map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>
              <pre className="pl-4 flex-1 whitespace-pre-wrap text-stone-200 selection:bg-amber-500/25 leading-relaxed text-[11px]">
                {artifact.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
