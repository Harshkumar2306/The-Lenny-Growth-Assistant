import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Code,
  Eye,
  FileText,
  Globe,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Artifact } from '../../lib/api';
import { MarkdownView } from './MarkdownView';
import { SandboxIframe } from './SandboxIframe';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  artifactsList: Artifact[];
  onSelectArtifact: (art: Artifact) => void;
  onClose: () => void;
  onTriggerDeliverable?: (prompt: string, skill: string) => void;
  isDesktop?: boolean;
}

const MIN_PANEL_WIDTH = 380;
const MAX_PANEL_WIDTH = 680; // Hard ceiling: cannot extend past this extent

interface StarterTemplate {
  title: string;
  badge: string;
  badgeType: 'html' | 'essay' | 'framework';
  description: string;
  skill: string;
  prompt: string;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    title: "Rahul Vohra's 40% PMF Engine",
    badge: 'Interactive HTML',
    badgeType: 'html',
    description: "Calculate Rahul Vohra's 40% 'Very Disappointed' benchmark and cohort breakdowns with real-time sliders.",
    skill: 'artifact',
    prompt: "Build an interactive Product-Market Fit (PMF) Survey Calculator based on Rahul Vohra's 40% rule with real-time sliders, visual progress bar, and customer segment analysis.",
  },
  {
    title: 'Casey Winters on Retention Flywheels',
    badge: 'Ship 30 Essay',
    badgeType: 'essay',
    description: "1,200-word publication-ready essay dissecting why user retention compounds while acquisition channels decay.",
    skill: 'ship30',
    prompt: "Write a Ship 30 for 30 style essay on how Casey Winters defines user retention loops vs acquisition flywheels, with practical diagnostic questions.",
  },
  {
    title: "Shreyas Doshi's Risk Pre-Mortem",
    badge: 'Strategic Framework',
    badgeType: 'framework',
    description: "Product risk classification matrix distinguishing fatal Tigers, harmless Paper Tigers, and ignored Elephants.",
    skill: 'ship30',
    prompt: "Generate a comprehensive Pre-Mortem Risk Assessment Matrix using Shreyas Doshi's framework distinguishing between Tigers, Paper Tigers, and Elephants for product launches.",
  },
];

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  artifactsList,
  onSelectArtifact,
  onClose,
  onTriggerDeliverable,
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
      const maxAllowed = Math.min(
        MAX_PANEL_WIDTH,
        Math.floor(window.innerWidth * 0.5),
        Math.max(MIN_PANEL_WIDTH, window.innerWidth - 480)
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

  const handleTrigger = (template: StarterTemplate) => {
    if (onTriggerDeliverable) {
      onTriggerDeliverable(template.prompt, template.skill);
    } else {
      navigator.clipboard.writeText(template.prompt);
    }
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
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs md:text-sm font-semibold text-stone-100 truncate">
                Artifact Viewer
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-750 font-mono hidden sm:inline">
                Launchpad
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close Panel"
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Launchpad Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-center select-none scrollbar-thin">
          <div className="text-center max-w-sm mx-auto mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-amber-950/30">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-stone-100 tracking-tight">
              Executive Deliverables Canvas
            </h3>
            <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
              Generate publication-grade Ship 30 essays, diagnostic frameworks, or interactive HTML prototypes grounded in Lenny's podcast archives.
            </p>
          </div>

          {/* 1-Click Starter Deliverable Cards */}
          <div className="space-y-2.5 max-w-sm mx-auto w-full">
            <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Featured Deliverable Starters</span>
              <span className="text-amber-400 font-mono">1-Click</span>
            </div>

            {STARTER_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleTrigger(tmpl)}
                className="w-full text-left p-3 rounded-xl bg-stone-950/80 hover:bg-stone-950 border border-stone-800/80 hover:border-amber-500/40 transition-all group cursor-pointer shadow-xs hover:shadow-md hover:shadow-amber-950/20 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      tmpl.badgeType === 'html'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                        : tmpl.badgeType === 'essay'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                </div>
                <div className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors">
                  {tmpl.title}
                </div>
                <p className="text-[11px] text-stone-400 mt-1 leading-relaxed line-clamp-2">
                  {tmpl.description}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 p-2.5 rounded-xl bg-stone-950/50 border border-stone-850 text-stone-400 text-[11px] text-center max-w-sm mx-auto w-full">
            Tip: You can also select the <strong className="text-amber-300">Ship 30</strong> or <strong className="text-sky-300">Artifact</strong> chip above the chat box for any custom request.
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

  const currentIdx = artifactsList.findIndex((a) => a.id === artifact.id);

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs md:text-sm font-semibold text-stone-100 truncate" title={artifact.title}>
                {artifact.title}
              </h2>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded font-mono hidden sm:inline flex-shrink-0 ${
                  isHtml
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isHtml ? 'HTML Prototype' : 'Ship 30 Deliverable'}
              </span>
            </div>
          </div>
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

      {/* Multi-Artifact Tab Switcher Strip (When 2+ deliverables generated) */}
      {artifactsList.length > 1 && (
        <div className="bg-stone-950/90 border-b border-stone-800/80 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider pl-1 pr-1 flex items-center gap-1 flex-shrink-0">
            <Layers className="w-3 h-3 text-stone-400" />
            <span>Deliverables ({artifactsList.length}):</span>
          </div>
          {artifactsList.map((art, idx) => {
            const isCurrent = art.id === artifact.id;
            const isHtmlArt = art.artifact_type === 'html';
            return (
              <button
                key={art.id || idx}
                onClick={() => onSelectArtifact(art)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex-shrink-0 ${
                  isCurrent
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-semibold'
                    : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800/60'
                }`}
              >
                {isHtmlArt ? (
                  <Globe className={`w-3 h-3 ${isCurrent ? 'text-sky-400' : 'text-sky-500/70'}`} />
                ) : (
                  <FileText className={`w-3 h-3 ${isCurrent ? 'text-amber-400' : 'text-amber-500/70'}`} />
                )}
                <span className="max-w-[130px] truncate">{art.title}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isHtmlArt ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {isHtmlArt ? 'HTML' : 'MD'}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
