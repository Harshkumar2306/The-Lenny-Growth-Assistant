import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, Check, Eye, EyeOff, Sparkles, AlertCircle, Server } from 'lucide-react';
import { addCustomModel } from '../lib/api';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (provider: string, modelName: string) => void;
}

type ProviderType = 'groq' | 'openai' | 'anthropic' | 'custom';

const PROVIDER_PRESETS: Record<ProviderType, { defaultModel: string; suggestions: string[]; baseUrl: string }> = {
  groq: {
    defaultModel: 'llama-3.3-70b-versatile',
    suggestions: ['llama-3.3-70b-versatile', 'qwen-2.5-32b', 'deepseek-r1-distill-llama-70b', 'llama-3.1-8b-instant'],
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  openai: {
    defaultModel: 'gpt-4o',
    suggestions: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    suggestions: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    baseUrl: 'https://api.anthropic.com/v1',
  },
  custom: {
    defaultModel: 'deepseek-chat',
    suggestions: ['deepseek-chat', 'meta-llama/llama-3.3-70b-instruct', 'mistral-large-latest'],
    baseUrl: 'https://api.deepseek.com/v1',
  },
};

export const AddModelModal: React.FC<AddModelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [provider, setProvider] = useState<ProviderType>('groq');
  const [modelName, setModelName] = useState(PROVIDER_PRESETS.groq.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleProviderSelect = (p: ProviderType) => {
    setProvider(p);
    setModelName(PROVIDER_PRESETS[p].defaultModel);
    if (p === 'custom') {
      setBaseUrl(PROVIDER_PRESETS.custom.baseUrl);
    } else {
      setBaseUrl('');
    }
    setErrorMsg('');
  };

  const handlePresetSelect = (preset: string) => {
    setModelName(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) {
      setErrorMsg('Please specify a model name.');
      return;
    }
    if (!apiKey.trim()) {
      setErrorMsg('Please provide a valid API key.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await addCustomModel({
        provider,
        model_name: modelName.trim(),
        api_key: apiKey.trim(),
        base_url: baseUrl.trim() || undefined,
      });

      setSuccessMsg(res.message || `Activated ${modelName}!`);
      setTimeout(() => {
        onSuccess(provider, modelName.trim());
        onClose();
        setSuccessMsg('');
        setApiKey('');
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect model');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative my-auto bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-stone-200 flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-800 flex items-center justify-between flex-shrink-0 bg-stone-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-100">Connect Custom Model</h2>
              <p className="text-[11px] text-stone-400">Add any cloud LLM runtime with your API key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['groq', 'openai', 'anthropic', 'custom'] as ProviderType[]).map((p) => {
                const isSelected = provider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderSelect(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-xs'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {p === 'custom' ? 'OpenAI-Comp' : p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-300">Model Name</label>
              <span className="text-[10px] text-stone-500">Pick preset or type custom</span>
            </div>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. llama-3.3-70b-versatile, gpt-4o, claude-3-5-sonnet"
              className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs text-stone-100 placeholder-stone-600 outline-none focus:outline-none font-mono"
            />

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PROVIDER_PRESETS[provider].suggestions.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    modelName === preset
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-300'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              {provider.toUpperCase()} API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${provider} API key...`}
                className="w-full px-3 py-2 pr-10 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs text-stone-100 placeholder-stone-600 outline-none focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer p-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Optional Base URL (especially for Custom / OpenRouter / DeepSeek) */}
          {(provider === 'custom' || baseUrl) && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                API Base URL <span className="text-[10px] text-stone-500 font-normal">(OpenAI Compatible)</span>
              </label>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com/v1"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs text-stone-100 placeholder-stone-600 outline-none focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !modelName.trim() || !apiKey.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Connect & Activate</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
