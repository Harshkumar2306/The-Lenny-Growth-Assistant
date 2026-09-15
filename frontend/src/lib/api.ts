export interface Citation {
  guest: string;
  title: string;
  youtube_url?: string;
  timestamp: string;
  quote: string;
  relevance_score?: number;
}

export interface Artifact {
  id: string;
  session_id: string;
  message_id?: string;
  artifact_type: 'markdown' | 'html';
  title: string;
  content: string;
  version?: number;
  created_at?: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  provider: string;
  model_name: string;
  user_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ModelStatus {
  provider: string;
  model_name: string;
  available: boolean;
  is_local: boolean;
  is_custom?: boolean;
  details?: string;
}

export interface HealthInfo {
  status: string;
  version: string;
  database_type: string;
  database_connected: boolean;
  index_loaded?: boolean;
  total_indexed_chunks: number;
  active_provider: string;
  models: ModelStatus[];
}

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModels(): Promise<{ active_provider: string; active_model: string; models: ModelStatus[] }> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error(`Fetch models failed: ${res.statusText}`);
  return res.json();
}

export async function switchModel(provider: string, model_name?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/models/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model_name }),
  });
  if (!res.ok) throw new Error(`Switch model failed: ${res.statusText}`);
  return res.json();
}

export async function addCustomModel(params: {
  provider: string;
  model_name: string;
  api_key: string;
  base_url?: string;
}): Promise<{
  status: string;
  message: string;
  active_provider: string;
  active_model: string;
  models: ModelStatus[];
}> {
  const res = await fetch(`${API_BASE}/models/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to add model');
  }
  return res.json();
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error(`Fetch sessions failed: ${res.statusText}`);
  return res.json();
}

export async function createSession(title?: string, provider?: string, model_name?: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, provider, model_name }),
  });
  if (!res.ok) throw new Error(`Create session failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSessionHistory(sessionId: string): Promise<{ session: Session; messages: Message[]; artifacts: Artifact[] }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Fetch session history failed: ${res.statusText}`);
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Delete session failed: ${res.statusText}`);
}

export async function streamChat({
  message,
  sessionId,
  provider,
  model,
  skill = 'chat',
  onToken,
  onStatus,
  onCitations,
  onArtifact,
  onDone,
  onError,
}: {
  message: string;
  sessionId?: string;
  provider?: string;
  model?: string;
  skill?: string;
  onToken: (token: string) => void;
  onStatus: (status: string) => void;
  onCitations: (citations: Citation[]) => void;
  onArtifact: (artifact: Artifact) => void;
  onDone: (data: any) => void;
  onError: (err: string) => void;
}) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        provider,
        model,
        skill,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Chat API error (${res.status}): ${errBody}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported by browser.');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const event = JSON.parse(trimmed.slice(6));
            const { type, data } = event;

            if (type === 'token') {
              onToken(data);
            } else if (type === 'status') {
              onStatus(data);
            } else if (type === 'citations') {
              onCitations(data);
            } else if (type === 'artifact') {
              onArtifact(data);
            } else if (type === 'done') {
              onDone(data);
            } else if (type === 'error') {
              onError(data);
            }
          } catch (e) {
            console.error('Failed to parse SSE line:', trimmed, e);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err.message || 'Stream connection error');
  }
}

export async function removeCustomModel(provider: string, model_name: string): Promise<{
  active_provider: string;
  active_model: string;
  models: ModelStatus[];
}> {
  const res = await fetch(`${API_BASE}/models/remove`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model_name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to remove model');
  }
  return res.json();
}
