import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatPane } from './components/Chat/ChatPane';
import { ChatInput } from './components/Chat/ChatInput';
import { ArtifactPanel } from './components/ArtifactViewer/ArtifactPanel';
import {
  fetchHealth,
  fetchModels,
  switchModel,
  fetchSessions,
  createSession,
  fetchSessionHistory,
  deleteSession,
  streamChat,
  Session,
  Message,
  Artifact,
  ModelStatus,
  HealthInfo,
  Citation,
} from './lib/api';

export const App: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Responsive Device Viewport & Active Tab (for mobile/tablet)
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'artifact'>('chat');

  // Runtime Models & Health
  const [activeProvider, setActiveProvider] = useState<string>('ollama');
  const [activeModel, setActiveModel] = useState<string>('llama3.2:1b');
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  // Streaming State
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingStatus, setStreamingStatus] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);

  // Initial Load & periodic health poll
  useEffect(() => {
    loadInitialData();

    const interval = setInterval(async () => {
      try {
        const [healthData, modelsData] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchModels().catch(() => null),
        ]);
        if (healthData) setHealth(healthData);
        if (modelsData) {
          setModels(modelsData.models);
          // Keep UI state in sync with the server (source of truth), e.g.
          // after a custom model was activated via the Add Model dialog.
          setActiveProvider(modelsData.active_provider);
          setActiveModel(modelsData.active_model);
        }
      } catch (e) {
        // ignore
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Viewport resize tracking for adaptive layouts
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileActiveTab('chat');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut: Escape closes mobile overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  const loadInitialData = async () => {
    try {
      const [healthData, modelsData, sessionsData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchModels().catch(() => ({ active_provider: 'ollama', active_model: 'llama3.2:1b', models: [] })),
        fetchSessions().catch(() => []),
      ]);

      if (healthData) setHealth(healthData);
      if (modelsData) {
        setActiveProvider(modelsData.active_provider);
        setActiveModel(modelsData.active_model);
        setModels(modelsData.models);
      }
      setSessions(sessionsData);

      if (sessionsData.length > 0) {
        loadSession(sessionsData[0].id);
      }
    } catch (e) {
      console.error('Initialization error:', e);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setActiveSessionId(sessionId);
      setSuggestions([]);
      const data = await fetchSessionHistory(sessionId);
      setMessages(data.messages);
      setArtifacts(data.artifacts);
      if (data.artifacts.length > 0) {
        setActiveArtifact(data.artifacts[data.artifacts.length - 1]);
        // Only open the side panel automatically on wide desktop screens!
        // On mobile/narrow screens, keep the Chat visible by default so users are never trapped.
        if (window.innerWidth >= 1024) {
          setIsArtifactPanelOpen(true);
        } else {
          setIsArtifactPanelOpen(false);
          setMobileActiveTab('chat');
        }
      } else {
        setActiveArtifact(null);
        setIsArtifactPanelOpen(false);
        setMobileActiveTab('chat');
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSess = await createSession('New Strategy Session', activeProvider, activeModel);
      setSessions([newSess, ...sessions]);
      setActiveSessionId(newSess.id);
      setMessages([]);
      setArtifacts([]);
      setActiveArtifact(null);
      setIsArtifactPanelOpen(false);
      setSuggestions([]);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      const remaining = sessions.filter(s => s.id !== sessionId);
      setSessions(remaining);
      setSuggestions([]);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          loadSession(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
          setArtifacts([]);
          setActiveArtifact(null);
          setIsArtifactPanelOpen(false);
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleSelectModel = async (provider: string, modelName?: string) => {
    try {
      const res = await switchModel(provider, modelName);
      setActiveProvider(res.active_provider);
      setActiveModel(res.active_model);
      setModels(res.models);
    } catch (e) {
      console.error('Failed to switch model:', e);
    }
  };

  const handleSendMessage = async (text: string, skill: string = 'chat') => {
    if (!text.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSess = await createSession(text.slice(0, 50), activeProvider, activeModel);
      setSessions([newSess, ...sessions]);
      setActiveSessionId(newSess.id);
      currentSessionId = newSess.id;
    }

    // Add optimistic user message to feed
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      session_id: currentSessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    setIsLoading(true);
    setStreamingMessage('');
    setStreamingStatus('Searching Lenny\'s Podcast knowledge base...');
    setStreamingCitations([]);
    setSuggestions([]);

    let accumulatedTokens = '';

    await streamChat({
      message: text,
      sessionId: currentSessionId,
      provider: activeProvider,
      model: activeModel,
      skill,
      onToken: (token) => {
        accumulatedTokens += token;
        setStreamingMessage(accumulatedTokens);
      },
      onStatus: (status) => {
        setStreamingStatus(status);
      },
      onCitations: (citations) => {
        setStreamingCitations(citations);
      },
      onArtifact: (art) => {
        setArtifacts(prev => {
          const exists = prev.some(a => a.id === art.id);
          return exists ? prev.map(a => (a.id === art.id ? art : a)) : [...prev, art];
        });
        setActiveArtifact(art);
        if (isDesktop) {
          setIsArtifactPanelOpen(true);
        } else {
          setMobileActiveTab('artifact');
        }
      },
      onDone: async (data: any) => {
        setIsLoading(false);
        setStreamingMessage('');
        setStreamingStatus('');
        if (data?.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
        // Refresh session to get persistent IDs and updated title
        if (currentSessionId) {
          const history = await fetchSessionHistory(currentSessionId);
          setMessages(history.messages);
          setArtifacts(history.artifacts);
          if (history.artifacts.length > 0) {
            const latest = history.artifacts[history.artifacts.length - 1];
            setActiveArtifact(latest);
            if (isDesktop) {
              setIsArtifactPanelOpen(true);
            }
          }
          const updatedSessions = await fetchSessions();
          setSessions(updatedSessions);
        }
      },
      onError: (err) => {
        setIsLoading(false);
        setStreamingMessage('');
        setStreamingStatus('');
        alert(`Error: ${err}`);
      },
    });
  };

  const handleTriggerShip30 = (content: string) => {
    const prompt = `Convert this strategic insight into a Ship 30 for 30 essay:\n\n${content.slice(0, 450)}`;
    handleSendMessage(prompt, 'ship30');
  };

  const handleTriggerPrototype = (content: string) => {
    const prompt = `Build an interactive HTML prototype and calculator widget based on this strategic insight:\n\n${content.slice(0, 450)}`;
    handleSendMessage(prompt, 'artifact');
  };

  const handleTriggerDeliverable = (prompt: string, skill: string) => {
    if (!isDesktop) {
      setMobileActiveTab('chat');
    }
    handleSendMessage(prompt, skill);
  };

  const handleOpenArtifact = (art: Artifact) => {
    setActiveArtifact(art);
    setIsArtifactPanelOpen(true);
    setMobileActiveTab('artifact');
  };

  const handleToggleArtifactPanel = () => {
    if (isDesktop) {
      if (!isArtifactPanelOpen && artifacts.length > 0 && !activeArtifact) {
        setActiveArtifact(artifacts[artifacts.length - 1]);
      }
      setIsArtifactPanelOpen(!isArtifactPanelOpen);
    } else {
      if (mobileActiveTab === 'artifact') {
        setMobileActiveTab('chat');
        setIsArtifactPanelOpen(false);
      } else {
        if (artifacts.length > 0 && !activeArtifact) {
          setActiveArtifact(artifacts[artifacts.length - 1]);
        }
        setMobileActiveTab('artifact');
        setIsArtifactPanelOpen(true);
      }
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const chatTitle = sessions.find(s => s.id === activeSessionId)?.title || 'Lenny_Session';
    let md = `# ${chatTitle}\n*Generated by The Lenny Growth Assistant*\n\n---\n\n`;
    messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'You' : 'Lenny Growth Assistant'}\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] w-full max-w-[100vw] bg-stone-950 text-stone-100 font-sans overflow-hidden overscroll-none">
      {/* Header */}
      <Header
        activeProvider={activeProvider}
        activeModel={activeModel}
        models={models}
        health={health}
        hasArtifact={artifacts.length > 0}
        isArtifactPanelOpen={isDesktop ? isArtifactPanelOpen : mobileActiveTab === 'artifact'}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onToggleArtifactPanel={handleToggleArtifactPanel}
        onSelectModel={handleSelectModel}
        onRefreshModels={loadInitialData}
      />

      {/* Mobile / Tablet Segmented View Switcher (when artifacts exist) */}
      {!isDesktop && artifacts.length > 0 && (
        <div className="bg-stone-900/95 border-b border-stone-800/80 px-3 py-1.5 flex items-center justify-center flex-shrink-0 z-20">
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs w-full max-w-xs shadow-inner">
            <button
              onClick={() => {
                setMobileActiveTab('chat');
                setIsArtifactPanelOpen(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer ${
                mobileActiveTab === 'chat'
                  ? 'bg-stone-800 text-amber-300 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => {
                setMobileActiveTab('artifact');
                setIsArtifactPanelOpen(true);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer ${
                mobileActiveTab === 'artifact'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Deliverable ({artifacts.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative w-full min-w-0">
        {/* Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSelectSession={loadSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onSelectPromptChip={(prompt, skill) => handleSendMessage(prompt, skill || 'chat')}
          onExportCurrentChat={messages.length > 0 ? handleExportChat : undefined}
        />

        {/* Content Area: Adaptive Desktop vs Mobile View */}
        {isDesktop ? (
          // Desktop: Side-by-Side Split View
          <>
            <main className="flex-1 flex flex-col h-full bg-stone-950 relative overflow-hidden min-w-0">
              <ChatPane
                messages={messages}
                artifacts={artifacts}
                suggestions={suggestions}
                streamingMessage={streamingMessage}
                streamingStatus={streamingStatus}
                streamingCitations={streamingCitations}
                isLoading={isLoading}
                onTriggerShip30={handleTriggerShip30}
                onTriggerPrototype={handleTriggerPrototype}
                onOpenArtifact={handleOpenArtifact}
                onSelectPromptChip={(prompt, skill) => handleSendMessage(prompt, skill || 'chat')}
              />

              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeProvider={activeProvider}
                activeModel={activeModel}
                totalChunks={health?.total_indexed_chunks || 11471}
              />
            </main>

            {isArtifactPanelOpen && (
              <ArtifactPanel
                artifact={activeArtifact}
                artifactsList={artifacts}
                onSelectArtifact={setActiveArtifact}
                onClose={() => setIsArtifactPanelOpen(false)}
                onTriggerDeliverable={handleTriggerDeliverable}
                isDesktop={true}
              />
            )}
          </>
        ) : (
          // Mobile / Tablet: Full-width Single View (Chat OR Artifact, never trapped, always switchable)
          mobileActiveTab === 'artifact' ? (
            <div className="flex-1 flex flex-col h-full w-full bg-stone-900 relative overflow-hidden">
              <ArtifactPanel
                artifact={activeArtifact}
                artifactsList={artifacts}
                onSelectArtifact={setActiveArtifact}
                onClose={() => {
                  setMobileActiveTab('chat');
                  setIsArtifactPanelOpen(false);
                }}
                onTriggerDeliverable={handleTriggerDeliverable}
                isDesktop={false}
              />
            </div>
          ) : (
            <main className="flex-1 flex flex-col h-full bg-stone-950 relative overflow-hidden min-w-0">
              <ChatPane
                messages={messages}
                artifacts={artifacts}
                suggestions={suggestions}
                streamingMessage={streamingMessage}
                streamingStatus={streamingStatus}
                streamingCitations={streamingCitations}
                isLoading={isLoading}
                onTriggerShip30={handleTriggerShip30}
                onTriggerPrototype={handleTriggerPrototype}
                onOpenArtifact={handleOpenArtifact}
                onSelectPromptChip={(prompt, skill) => handleSendMessage(prompt, skill || 'chat')}
              />

              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeProvider={activeProvider}
                activeModel={activeModel}
                totalChunks={health?.total_indexed_chunks || 11471}
              />
            </main>
          )
        )}
      </div>
    </div>
  );
};
export default App;
