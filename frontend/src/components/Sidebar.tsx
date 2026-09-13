import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Search, Sparkles, Download, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Session } from '../lib/api';
import { curatedPrompts } from '../lib/curatedPrompts';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onSelectPromptChip: (prompt: string, skill?: string) => void;
  onExportCurrentChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  isMobileOpen = false,
  onCloseMobile,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onSelectPromptChip,
  onExportCurrentChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showQuickStarters, setShowQuickStarters] = useState(false);

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessionList: Session[]) => {
    const groups: { [key: string]: Session[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': [],
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

    sessionList.forEach(s => {
      const time = new Date(s.updated_at || s.created_at).getTime();
      if (time >= startOfToday) {
        groups['Today'].push(s);
      } else if (time >= startOfYesterday) {
        groups['Yesterday'].push(s);
      } else if (time >= startOf7Days) {
        groups['Previous 7 Days'].push(s);
      } else {
        groups['Older'].push(s);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const handleSelectSession = (id: string) => {
    onSelectSession(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectPrompt = (prompt: string, skill?: string) => {
    onSelectPromptChip(prompt, skill);
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewSessionClick = () => {
    onNewSession();
    if (onCloseMobile) onCloseMobile();
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  // Sidebar Inner Content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-stone-950 text-stone-200 select-none">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-stone-800/80 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewSessionClick}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Session</span>
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse Sidebar"
            className="hidden md:flex p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Mobile close toggle */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              title="Close Menu"
              className="md:hidden p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-8 pr-7 py-1.5 bg-stone-900/90 border border-stone-800/80 rounded-xl text-xs text-stone-200 placeholder-stone-500 outline-none focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-amber-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="Clear Search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Session History (Grouped by Date) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500">
            {searchQuery ? 'No matching sessions found' : 'No previous strategy sessions yet'}
          </div>
        ) : (
          groupedSessions.map(([dateGroup, groupItems]) => (
            <div key={dateGroup} className="space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                {dateGroup} ({groupItems.length})
              </div>
              {groupItems.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`group relative px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30 font-medium shadow-xs'
                        : 'text-stone-400 hover:bg-stone-900/80 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isActive ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-400'
                        }`}
                      />
                      <span className="truncate">{s.title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      title="Delete Session"
                      className="opacity-70 md:opacity-0 md:group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-md text-stone-500 transition-all cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Quick Prompts Collapsible Accordion */}
      <div className="border-t border-stone-800/80 bg-stone-950/90">
        <button
          onClick={() => setShowQuickStarters(!showQuickStarters)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-[11px] font-semibold text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/90" />
            <span>Quick Starters</span>
            <span className="text-[10px] text-stone-500 font-normal">({curatedPrompts.length})</span>
          </div>
          {showQuickStarters ? (
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
          )}
        </button>

        {showQuickStarters && (
          <div className="px-3 pb-3 space-y-1 animate-in fade-in duration-150">
            {curatedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSelectPrompt(p.prompt, p.skill)}
                className="w-full text-left p-2 rounded-xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800/60 hover:border-amber-500/40 transition-all cursor-pointer group"
              >
                <div className="text-xs font-medium text-stone-300 group-hover:text-amber-300 truncate">
                  {p.title}
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  {p.subtitle}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export Footer */}
      {onExportCurrentChat && (
        <div className="p-2.5 border-t border-stone-800/80 safe-pb">
          <button
            onClick={onExportCurrentChat}
            className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-850 active:scale-98 border border-stone-800 text-xs font-medium text-stone-400 hover:text-stone-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chat as Markdown</span>
          </button>
        </div>
      )}
    </div>
  );

  // Desktop Collapsed View
  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-12 border-r border-stone-800 bg-stone-950 flex-col items-center py-3 justify-between select-none">
        <div className="flex flex-col items-center gap-2.5">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Sidebar"
            className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-stone-100 hover:bg-stone-850 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNewSession}
            title="New Session"
            className="p-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[9px] font-mono text-stone-600 -rotate-90 whitespace-nowrap tracking-wider">
          LENNY
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Drawer (Slide-over with Backdrop) */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={onCloseMobile}
          className="absolute inset-0 bg-black/70 backdrop-blur-xs"
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-stone-950 border-r border-stone-800 shadow-2xl transition-transform duration-200 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-stone-800 bg-stone-950 flex-col h-full flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
};
