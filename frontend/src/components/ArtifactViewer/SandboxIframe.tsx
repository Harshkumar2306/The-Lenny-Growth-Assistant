import React, { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ShieldCheck, RotateCw, ExternalLink, Smartphone, Tablet, Monitor, Maximize, Copy, Check } from 'lucide-react';

interface SandboxIframeProps {
  htmlContent: string;
  title?: string;
  isCompact?: boolean;
  isExpanded?: boolean;
}

/**
 * Security model for LLM-generated HTML artifacts
 * -----------------------------------------------
 * LLM output is untrusted code. Three independent layers contain it:
 *
 * 1. DOMPurify sanitization:
 *    - Inline <script> blocks are preserved so interactive prototype logic
 *      (calculators, reactive counters, Chart.js graphs) executes.
 *    - External <script src="..."> tags are strictly restricted to trusted CDNs
 *      (Tailwind Play CDN, jsDelivr, cdnjs, unpkg); all other external sources are stripped.
 *    - Dangerous objects, form actions, and iframe nests are neutralized.
 *
 * 2. Sandboxed <iframe sandbox="allow-scripts"> WITHOUT allow-same-origin:
 *    The browser gives the document an opaque (null) origin. Interactive JS
 *    CANNOT read cookies, localStorage, sessionStorage, or the parent window DOM.
 *
 * 3. Content-Security-Policy injected into the artifact <head>:
 *    default-src 'none' blocks outbound network/fetch exfiltration;
 *    only permitted CDN assets, fonts, and data:/https: images are reachable.
 *    object-src 'none' and base-uri 'none' eliminate injection vectors.
 *
 * "Open in New Tab" wraps the sanitized HTML inside a fresh null-origin sandboxed
 * iframe, preserving isolation even in a separate browser tab.
 */

// Strip external scripts from untrusted domains while retaining inline scripts and trusted CDNs.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'script') {
    const el = node as Element;
    const src = (el.getAttribute && el.getAttribute('src')) || '';
    if (!src) {
      // Retain inline scripts for interactive LLM prototypes
      return;
    }
    // Verify external scripts originate strictly from trusted CDNs
    const allowedCdns = /^https:\/\/(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com)\//i;
    if (!allowedCdns.test(src)) {
      el.remove();
    }
  }
});

const CSP_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com",
  "style-src 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src data: https:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP_POLICY}">`;

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['script', 'link', 'canvas', 'svg', 'button', 'input', 'form', 'table'],
    ADD_ATTR: ['onclick', 'oninput', 'onchange', 'style', 'class', 'id', 'type', 'value', 'placeholder', 'min', 'max', 'step', 'checked', 'for', 'rows', 'cols', 'name'],
  });
}

function buildDocument(htmlContent: string, title: string): string {
  let clean = (htmlContent || '').trim();

  // Strip stray leading non-HTML noise (e.g. ')}', '```html', etc.)
  const firstTag = clean.search(/<!DOCTYPE|<html|<head|<body|<div|<main|<section|<header/i);
  if (firstTag > 0) {
    clean = clean.slice(firstTag).trim();
  }

  // If </html> exists, truncate any trailing commentary or markdown that leaked
  const endHtml = clean.lastIndexOf('</html>');
  if (endHtml !== -1) {
    clean = clean.slice(0, endHtml + 7).trim();
  } else {
    // If no </html>, strip any trailing markdown explanation headers
    const mdLeak = clean.search(/\n```|\n###\s+Explanation|\n###\s+How\s+to|\n###\s+Example/i);
    if (mdLeak > 50) {
      clean = clean.slice(0, mdLeak).trim();
    }
  }

  const sanitized = sanitizeHtml(clean);
  const responsiveShield = `
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      /* Universal Responsive Reset & Layout Shield */
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 1.25rem !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        word-break: break-word;
        overflow-wrap: break-word;
        background-color: #0b0f19;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      /* Prevent horizontal overflow on flex containers: force wrapping on constrained screens */
      .flex, [class*="flex"] {
        flex-wrap: wrap !important;
        max-width: 100% !important;
      }
      /* Prevent grid overflow */
      .grid, [class*="grid"] {
        max-width: 100% !important;
      }
      /* Form elements, inputs, canvases must never spill out and have legible contrast */
      input, textarea, select, button, form, canvas, svg {
        max-width: 100% !important;
      }
      input:not([type="range"]), textarea, select {
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 6px 10px;
      }
      input[type="range"] {
        width: 100% !important;
        min-width: 0 !important;
        cursor: pointer;
      }
      label {
        word-break: break-word;
      }
      /* Tables scroll horizontally instead of expanding parent */
      table {
        display: block;
        overflow-x: auto;
        max-width: 100%;
        white-space: nowrap;
      }
    </style>
  `;

  if (sanitized.includes('<head')) {
    return sanitized.replace('<head>', `<head>${CSP_META}${responsiveShield}`);
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${CSP_META}
        ${responsiveShield}
      </head>
      <body class="bg-slate-50 text-slate-900 antialiased min-h-screen">
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

export const SandboxIframe: React.FC<SandboxIframeProps> = ({
  htmlContent,
  title = 'Artifact Preview',
  isCompact = false,
  isExpanded = true,
}) => {
  const [key, setKey] = useState(0);
  const [deviceFrame, setDeviceFrame] = useState<'fluid' | 'desktop' | 'tablet' | 'mobile'>('fluid');
  const [copiedHtml, setCopiedHtml] = useState(false);

  const secureSrcDoc = useMemo(() => buildDocument(htmlContent, title), [htmlContent, title]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

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
      <div className="px-2 sm:px-3.5 py-1.5 bg-stone-900/90 border-b border-stone-800 text-[11px] text-stone-400 flex items-center justify-between flex-shrink-0 gap-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isExpanded ? (
            <span>Sandboxed Execution</span>
          ) : !isCompact ? (
            <span>Sandboxed</span>
          ) : null}
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
            {isExpanded && <span>Fluid</span>}
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
            {isExpanded && <span>Desktop</span>}
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
            {isExpanded && <span>Tablet</span>}
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
            {isExpanded && <span>Mobile</span>}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopyHtml}
            title={copiedHtml ? "Copied HTML!" : "Copy Prototype HTML"}
            aria-label="Copy prototype HTML"
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
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
