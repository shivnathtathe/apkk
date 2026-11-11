import React, { useState } from 'react';
import { Code2, Copy, Check, Download, Smartphone, Info, Layers } from 'lucide-react';
import { ANDROID_CAMERA2_FILES, DEVICE_PROFILES } from '../data/camera2Code';
import { torchEngine } from '../utils/torchEngine';

interface Camera2SourceCodeViewerProps {
  onOpenPublishModal?: () => void;
}

export const Camera2SourceCodeViewer: React.FC<Camera2SourceCodeViewerProps> = ({
  onOpenPublishModal
}) => {
  const [activeTab, setActiveTab] = useState<string>('TorchManager.kt');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const currentFile = ANDROID_CAMERA2_FILES.find(f => f.filename === activeTab) || ANDROID_CAMERA2_FILES[0];

  const handleCopy = (code: string, filename: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    torchEngine.triggerHaptic(15);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    torchEngine.triggerHaptic(20);
  };

  return (
    <div className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-lg backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Android 13+ Camera2 API Architecture</h3>
            <p className="text-xs text-neutral-400">Production Native Kotlin & Jetpack Compose</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPublishModal && (
            <button
              onClick={onOpenPublishModal}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Android Project (.zip)</span>
            </button>
          )}
          <button
            onClick={() => handleCopy(currentFile.code, currentFile.filename)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedFile === currentFile.filename ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* API 33 Technical Insight Box */}
      <div className="mb-4 p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60 text-xs text-neutral-300 space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Camera2 API 33 (Android 13 Tiramisu) Breakthrough:</span>
        </div>
        <p className="text-neutral-400 leading-relaxed text-[11px]">
          In Android 13, Google introduced <code className="text-amber-300 font-mono">CameraManager.turnOnTorchWithStrengthLevel(cameraId, strength)</code> alongside characteristics key <code className="text-amber-300 font-mono">FLASH_INFO_STRENGTH_MAXIMUM_LEVEL</code>. Prior to this, Android APIs only supported binary on/off via <code className="text-neutral-300 font-mono">setTorchMode()</code>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-neutral-800 scrollbar-none">
        {ANDROID_CAMERA2_FILES.map(f => (
          <button
            key={f.filename}
            onClick={() => {
              setActiveTab(f.filename);
              torchEngine.triggerHaptic(8);
            }}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === f.filename
                ? 'bg-neutral-800 text-amber-400 font-semibold border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            {f.filename}
          </button>
        ))}
        <button
          onClick={() => {
            setActiveTab('device_matrix');
            torchEngine.triggerHaptic(8);
          }}
          type="button"
          className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'device_matrix'
              ? 'bg-neutral-800 text-amber-400 font-semibold border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          Device Profiles
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'device_matrix' ? (
        <div className="space-y-2.5">
          <p className="text-xs text-neutral-400">
            Hardware Camera2 strength level reporting across major Android 13+ devices:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEVICE_PROFILES.map((dev) => (
              <div key={dev.name} className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-white">{dev.name}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Max: {dev.maxStrengthLevel}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono mb-1">{dev.androidVersion} · {dev.model}</p>
                <p className="text-[11px] text-neutral-300 leading-snug">{dev.notes}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <p className="text-[11px] text-neutral-400 mb-2">{currentFile.description}</p>
          <pre className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto max-h-96 leading-relaxed select-text">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
