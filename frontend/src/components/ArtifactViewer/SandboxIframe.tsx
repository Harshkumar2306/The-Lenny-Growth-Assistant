import React, { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ShieldCheck, RotateCw, ExternalLink, Smartphone, Tablet, Monitor, Maximize } from 'lucide-react';

interface SandboxIframeProps {
  htmlContent: string;
  title?: string;
}

/**
 * Security model for LLM-generated HTML artifacts
 * -----------------------------------------------
 * LLM output is untrusted code. Three independent layers contain it:
 *
 * 1. DOMPurify sanitization: inline <script> blocks are removed; only
 *    <script src="https://..."> (the Tailwind Play CDN) survives, because a
 *    "uponSanitizeElement" hook strips every other script element. Inline
 *    event handlers (onclick/oninput/onchange) are kept ONLY so prototypes
 *    stay interactive - they are inert without layer 2.
 *
 * 2. Sandboxed <iframe sandbox="allow-scripts"> WITHOUT allow-same-origin:
 *    the browser gives the document an opaque (null) origin, so even
 *    interactive JS cannot read cookies, localStorage, or the parent window
 *    DOM. (allow-scripts enables the prototype interactions the feature
 *    exists for; omitting allow-same-origin is what makes it safe.)
 *
 * 3. Content-Security-Policy injected into the artifact <head>:
 *    default-src 'none' blocks outbound network/fetch; only the Tailwind CDN,
 *    fonts, and data:/https: images are reachable. object-src 'none' and
 *    base-uri 'none' close plugin/embed and <base> tricks.
 *
 * "Open in New Tab" does NOT hand the sanitized HTML to the browser
 * directly (a blob URL would run with the app's origin). It opens a minimal
 * wrapper document that embeds the artifact inside a NEW sandboxed iframe,
 * so the isolation holds even outside the app shell.
 */

// Strip every <script> element except external https CDN scripts.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'script') {
    const el = node as Element;
    const src = (el.getAttribute && el.getAttribute('src')) || '';
    if (!/^https:\/\//i.test(src)) {
      el.remove();
    }
  }
});

const CSP_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
  "style-src 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src data: https:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP_POLICY}">`;

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    // 'script' is allow-listed so external CDN scripts survive; the hook
    // above strips every script element without an https:// src, and the
    // CSP restricts which https hosts may actually load.
    ADD_TAGS: ['script', 'link', 'canvas', 'svg', 'button', 'input', 'form', 'table'],
    ADD_ATTR: ['onclick', 'oninput', 'onchange', 'style', 'class', 'id', 'type', 'value', 'placeholder'],
  });
}

function buildDocument(htmlContent: string, title: string): string {
  const sanitized = sanitizeHtml(htmlContent);

  if (sanitized.includes('<head')) {
    return sanitized.replace('<head>', `<head>${CSP_META}`);
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        ${CSP_META}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 1.25rem;
          }
        </style>
      </head>
      <body class="bg-slate-900 text-slate-100 antialiased min-h-screen">
        ${sanitized}
      </body>
    </html>
  `;
}

/**
 * A blob-URL document that renders the artifact inside a fresh sandboxed
 * iframe. The wrapper itself contains zero LLM content, so inheriting the
 * app's origin when opened in a new tab is harmless.
 */
function buildWrapperDocument(innerDoc: string): string {
  const escaped = innerDoc
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lenny Growth Assistant - Artifact</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0c0a09; }
    iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${escaped}"></iframe>
</body>
</html>`;
}

export const SandboxIframe: React.FC<SandboxIframeProps> = ({ htmlContent, title = 'Artifact Preview' }) => {
  const [key, setKey] = useState(0);
  const [deviceFrame, setDeviceFrame] = useState<'fluid' | 'desktop' | 'tablet' | 'mobile'>('fluid');

  const secureSrcDoc = useMemo(() => buildDocument(htmlContent, title), [htmlContent, title]);

  const handleOpenInNewTab = () => {
    const wrapper = buildWrapperDocument(secureSrcDoc);
    const blob = new Blob([wrapper], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Give the browser a moment to load the blob before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full w-full bg-stone-950 overflow-hidden select-none">
      {/* Responsive Control Bar */}
      <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-stone-900/90 border-b border-stone-800 text-[11px] text-stone-400 flex items-center justify-between flex-shrink-0 gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400 font-medium flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sandboxed Execution</span>
          <span className="sm:hidden">Sandboxed</span>
        </div>

        {/* Viewport Frame Presets (Fluid, Desktop, Tablet, Mobile) */}
        <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-[10px] flex-shrink-0">
          <button
            onClick={() => setDeviceFrame('fluid')}
            title="Fluid Viewport (100%)"
            className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              deviceFrame === 'fluid'
                ? 'bg-stone-800 text-amber-300 font-medium shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Maximize className="w-3 h-3" />
            <span className="hidden md:inline">Fluid</span>
          </button>
          <button
            onClick={() => setDeviceFrame('desktop')}
            title="Desktop Viewport (1024px)"
            className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              deviceFrame === 'desktop'
                ? 'bg-stone-800 text-amber-300 font-medium shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceFrame('tablet')}
            title="Tablet Viewport (768px)"
            className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              deviceFrame === 'tablet'
                ? 'bg-stone-800 text-amber-300 font-medium shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tablet className="w-3 h-3" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceFrame('mobile')}
            title="Mobile Viewport (375px)"
            className={`px-1.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              deviceFrame === 'mobile'
                ? 'bg-stone-800 text-amber-300 font-medium shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRefresh}
            title="Reload Prototype"
            aria-label="Reload prototype"
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            title="Open in New Tab (still sandboxed)"
            aria-label="Open artifact in new tab (still sandboxed)"
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewport Frame Container (Adaptive canvas) */}
      <div className="flex-1 w-full h-full bg-stone-950 overflow-auto p-2 sm:p-4 flex items-center justify-center">
        <div
          className={`transition-all duration-200 ${
            deviceFrame === 'fluid'
              ? 'w-full h-full'
              : deviceFrame === 'desktop'
              ? 'w-full max-w-[1024px] h-full shadow-2xl rounded-xl border border-stone-800 overflow-hidden'
              : deviceFrame === 'tablet'
              ? 'w-full max-w-[768px] h-full max-h-[920px] shadow-2xl rounded-2xl border-2 border-stone-750 overflow-hidden'
              : 'w-full max-w-[375px] h-full max-h-[720px] shadow-2xl rounded-[28px] border-[6px] border-stone-800 overflow-hidden'
          }`}
        >
          <iframe
            key={key}
            title={title}
            srcDoc={secureSrcDoc}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className="w-full h-full border-0 bg-stone-900"
          />
        </div>
      </div>
    </div>
  );
};
