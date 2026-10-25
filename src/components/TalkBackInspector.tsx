import React, { useState, useEffect } from 'react';
import {
  Accessibility,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  X,
  Trash2,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { TalkBackAnnouncement } from '../types/momo';
import { voiceService } from '../services/voiceService';

interface TalkBackInspectorProps {
  announcements: TalkBackAnnouncement[];
  onClearAnnouncements?: () => void;
  screenCurtainActive: boolean;
  onToggleScreenCurtain: () => void;
  highContrastActive: boolean;
  onToggleHighContrast: () => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export const TalkBackInspector: React.FC<TalkBackInspectorProps> = ({
  announcements,
  onClearAnnouncements,
  screenCurtainActive,
  onToggleScreenCurtain,
  highContrastActive,
  onToggleHighContrast,
  fontScale,
  onFontScaleChange,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'assertive' | 'polite'>('ALL');

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (val && controlledOnOpen) controlledOnOpen();
    else if (!val && controlledOnClose) controlledOnClose();
    else setInternalIsOpen(val);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleReplay = (text: string) => {
    voiceService.speak(text, { priority: 'assertive' });
  };

  const filteredAnnouncements = announcements.filter((item) => {
    if (filterPriority === 'ALL') return true;
    return item.priority === filterPriority;
  });

  return (
    <>
      {/* Small Floating MTN MoMo Access Button (Down at the bottom right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-2xl border-2 border-slate-900 active:scale-95 transition-all group focus:outline-none focus:ring-4 focus:ring-amber-400/50"
        aria-label={`Open MTN MoMo Accessibility and TalkBack Inspector. ${announcements.length} spoken announcements recorded.`}
        aria-expanded={isOpen}
        title="Open TalkBack & Screen Reader Inspector"
      >
        <div className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Accessibility className="w-3.5 h-3.5" />
        </div>
        <span className="tracking-wide hidden sm:inline">Access · TalkBack</span>
        <span className="tracking-wide sm:hidden">Access</span>
        {announcements.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center">
            {announcements.length}
          </span>
        )}
      </button>

      {/* Optimized Slide-Over Inspector Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="talkback-inspector-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className={`w-full max-w-md h-full bg-slate-900 border-l flex flex-col shadow-2xl transition-transform animate-slideInRight ${
              highContrastActive ? 'border-amber-400 text-amber-300 bg-black' : 'border-slate-800 text-slate-100'
            }`}
          >
            {/* Inspector Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                  <Accessibility className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="talkback-inspector-title" className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>TalkBack & Screen Reader</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live audio sync" />
                  </h2>
                  <span className="text-[11px] text-slate-400">WCAG AAA Accessibility Inspector</span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                aria-label="Close Accessibility Inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Accessibility Toggles */}
            <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
              <div className="grid grid-cols-2 gap-2">
                {/* Blind Mode Curtain */}
                <button
                  onClick={onToggleScreenCurtain}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    screenCurtainActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                  aria-pressed={screenCurtainActive}
                >
                  <div className="flex items-center gap-2 text-left">
                    <EyeOff className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-[11px]">Screen Curtain</div>
                      <div className="text-[9px] opacity-80">Blind Test</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                    {screenCurtainActive ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* High Contrast */}
                <button
                  onClick={onToggleHighContrast}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    highContrastActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                  aria-pressed={highContrastActive}
                >
                  <div className="flex items-center gap-2 text-left">
                    {highContrastActive ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                    <div>
                      <div className="text-[11px]">High Contrast</div>
                      <div className="text-[9px] opacity-80">Yellow / Dark</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                    {highContrastActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Text Scaling */}
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-300 text-[11px] font-medium">Text Scale ({Math.round(fontScale * 100)}%):</span>
                <div className="flex items-center gap-1">
                  {[1.0, 1.25, 1.5].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => onFontScaleChange(scale)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                        fontScale === scale
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {Math.round(scale * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Utterance Feed & Controls */}
            <div className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Spoken Stream ({filteredAnnouncements.length})
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setFilterPriority('ALL')}
                      className={`px-1.5 py-0.5 rounded ${filterPriority === 'ALL' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterPriority('assertive')}
                      className={`px-1.5 py-0.5 rounded ${filterPriority === 'assertive' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Assertive
                    </button>
                  </div>
                </div>

                {onClearAnnouncements && announcements.length > 0 && (
                  <button
                    onClick={onClearAnnouncements}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Clear announcement history"
                    aria-label="Clear announcement history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Stream */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {filteredAnnouncements.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
                    <Volume2 className="w-8 h-8 mb-2 stroke-slate-600 opacity-60" />
                    <span>No spoken announcements in this filter.</span>
                  </div>
                ) : (
                  filteredAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">{item.timestamp}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              item.priority === 'assertive'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleReplay(item.text)}
                            title="Replay Audio"
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            aria-label="Replay audio announcement"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopy(item.id, item.text)}
                            title="Copy Announcement"
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            aria-label="Copy spoken text"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-sans">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Compliance Checklist */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-PIN Utterance Enforced</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">WCAG 2.1 AAA</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
