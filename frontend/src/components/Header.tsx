import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Cpu, Cloud, Database, PanelRight, ChevronDown, Check, Plus, Menu, X } from 'lucide-react';
import { ModelStatus, HealthInfo, removeCustomModel } from '../lib/api';
import { AddModelModal } from './AddModelModal';

interface HeaderProps {
  activeProvider: string;
  activeModel: string;
  models: ModelStatus[];
  health: HealthInfo | null;
  hasArtifact: boolean;
  isArtifactPanelOpen: boolean;
  onToggleMobileSidebar?: () => void;
  onToggleArtifactPanel: () => void;
  onSelectModel: (provider: string, modelName?: string) => void;
  onRefreshModels: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProvider,
  activeModel,
  models,
  health,
  hasArtifact,
  isArtifactPanelOpen,
  onToggleMobileSidebar,
  onToggleArtifactPanel,
  onSelectModel,
  onRefreshModels,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);

  const activeModelObj = models.find(m => m.provider === activeProvider && (!m.model_name || m.model_name === activeModel));

  const handleRemoveModel = async (provider: string, model_name: string) => {
    try {
      await removeCustomModel(provider, model_name);
      onRefreshModels();
    } catch (err: any) {
      alert(err.message || 'Failed to remove model');
    }
  };

  return (
    <header className="relative z-40 h-14 md:h-16 border-b border-stone-800/80 bg-stone-900/90 backdrop-blur-md px-2.5 sm:px-4 md:px-6 flex items-center justify-between select-none flex-shrink-0 w-full">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0 pr-2">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            title="Toggle Menu"
            className="md:hidden p-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 active:scale-95 text-stone-300 hover:text-stone-100 transition-all cursor-pointer flex items-center justify-center min-w-[38px] min-h-[38px]"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shadow-amber-950/30 flex-shrink-0">
          <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="min-w-0 truncate">
          <h1 className="font-bold text-stone-100 text-xs sm:text-sm tracking-tight truncate">
            Lenny Growth Assistant
          </h1>
          <p className="text-[10px] sm:text-[11px] text-stone-400 hidden lg:block truncate">
            Grounded in 300+ Lenny's Podcast Interviews
          </p>
        </div>
      </div>

      {/* Model Selector & Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2.5 flex-shrink-0">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 active:scale-98 border border-stone-700/70 text-xs text-stone-200 transition-all cursor-pointer shadow-xs min-h-[36px]"
          >
            {activeProvider === 'ollama' ? (
              <Cpu className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            )}
            <span className="font-semibold capitalize text-[11px] sm:text-xs">{activeProvider}</span>
            <span className="text-stone-400 text-[11px] font-mono hidden md:inline max-w-[100px] lg:max-w-[140px] truncate">
              ({activeModel})
            </span>
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                activeModelObj?.available ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'
              }`}
            />
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5 flex-shrink-0" />
          </button>

          {isDropdownOpen && (
            <>
              {/* Invisible click-outside backdrop */}
              <div
                className="fixed inset-0 z-40 cursor-default bg-black/20 md:bg-transparent"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.25rem)] bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-stone-800 text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Runtime Models</span>
                </div>

                <div className="p-1 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
                  {models
                    .filter((m) => m.available || m.is_local)
                    .map((m) => {
                      const isSelected = m.provider === activeProvider && (m.model_name === activeModel || !m.model_name);
                    return (
                      <div key={`${m.provider}-${m.model_name}`} className="relative group">
                        <button
                          onClick={() => {
                            onSelectModel(m.provider, m.model_name);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer ${m.is_custom ? 'pr-8' : ''} ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                              : 'hover:bg-stone-800/80 text-stone-200'
                          }`}
                        >
                          <div className="mt-0.5">
                            {m.is_local ? (
                              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Cloud className="w-3.5 h-3.5 text-sky-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs capitalize flex items-center gap-1.5">
                                {m.provider}
                                {m.is_local && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                                    Local
                                  </span>
                                )}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <div className="text-[11px] text-stone-300 font-mono truncate">{m.model_name}</div>
                          </div>
                        </button>
                        {!m.is_local && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleRemoveModel(m.provider, m.model_name);
                            }}
                            className="absolute -left-1.5 -top-1.5 p-0.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-red-500 border border-stone-600 hover:border-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-10"
                            title="Remove Model"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-stone-800">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowAddModelModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Model</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* System Health Button */}
        <button
          onClick={() => setShowHealthModal(!showHealthModal)}
          title="System Health"
          className="p-2 rounded-xl bg-stone-850 hover:bg-stone-800 active:scale-95 border border-stone-700/70 text-stone-400 hover:text-emerald-400 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Database className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* Artifact Panel Toggle */}
        <button
          onClick={onToggleArtifactPanel}
          title={isArtifactPanelOpen ? 'Hide Artifact Viewer' : 'Open Artifact Viewer'}
          className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer min-h-[36px] active:scale-95 shrink-0 ${
            isArtifactPanelOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
              : 'bg-stone-850 text-stone-300 border-stone-700/70 hover:bg-stone-800 hover:text-stone-100'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Artifacts</span>
          {hasArtifact && !isArtifactPanelOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* Add Model Modal */}
      <AddModelModal
        isOpen={showAddModelModal}
        onClose={() => setShowAddModelModal(false)}
        onSuccess={(provider, modelName) => {
          onSelectModel(provider, modelName);
          onRefreshModels();
        }}
      />

      {/* System Health Modal */}
      {showHealthModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-100"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHealthModal(false);
          }}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-stone-100 text-xs md:text-sm">System Health</h2>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs px-2 py-0.5 rounded-md bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Database</span>
                <span className="text-stone-200 font-mono uppercase bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                  {health?.database_type || 'unknown'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Database Status</span>
                <span className={health?.database_connected ? 'text-emerald-400 font-medium flex items-center gap-1.5' : 'text-red-400 font-medium flex items-center gap-1.5'}>
                  <span className={`w-2 h-2 rounded-full ${health?.database_connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {health?.database_connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {health?.database_type === 'sqlite' && (
                <div className="text-[11px] text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                  Running on the resilient SQLite fallback — PostgreSQL is unreachable.
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Indexed Chunks</span>
                <span className="text-amber-300 font-mono font-bold">
                  {health?.total_indexed_chunks?.toLocaleString() || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Search Index</span>
                <span className={health?.index_loaded ? 'text-emerald-400 font-medium flex items-center gap-1.5' : 'text-amber-400 font-medium flex items-center gap-1.5'}>
                  <span className={`w-2 h-2 rounded-full ${health?.index_loaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {health?.index_loaded ? 'Loaded' : 'Not loaded'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Active Runtime</span>
                <span className="text-stone-200 font-mono font-medium capitalize">
                  {activeProvider} ({activeModel})
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
