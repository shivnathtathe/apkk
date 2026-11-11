import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Check, Moon, Compass, SunMedium, Flame, LifeBuoy } from 'lucide-react';
import { TorchPreset, FlickerPattern } from '../types/torch';
import { torchEngine } from '../utils/torchEngine';

interface PresetsManagerProps {
  currentBrightness: number;
  isStrobeActive: boolean;
  currentPattern: FlickerPattern;
  currentFreqHz: number;
  onApplyPreset: (preset: TorchPreset) => void;
  activePresetId?: string;
}

const DEFAULT_PRESETS: TorchPreset[] = [
  {
    id: 'reading',
    name: 'Bedside / Soft',
    level: 10,
    isFlicker: false,
    description: '10% Soft glow, eye-friendly'
  },
  {
    id: 'indoor',
    name: 'Indoor Walk',
    level: 30,
    isFlicker: false,
    description: '30% Balanced room illumination'
  },
  {
    id: 'standard',
    name: 'Standard Trail',
    level: 60,
    isFlicker: false,
    description: '60% Outdoor navigation'
  },
  {
    id: 'ultra',
    name: 'Ultra Boost',
    level: 100,
    isFlicker: false,
    description: '100% Maximum LED current'
  },
  {
    id: 'candle_mode',
    name: 'Candle Light',
    level: 35,
    isFlicker: true,
    flickerPattern: 'candle',
    flickerSpeedHz: 8,
    description: 'Organic warm flame flicker'
  },
  {
    id: 'sos_distress',
    name: 'SOS Distress',
    level: 100,
    isFlicker: true,
    flickerPattern: 'sos',
    flickerSpeedHz: 6,
    description: 'Morse distress beacon'
  }
];

export const PresetsManager: React.FC<PresetsManagerProps> = ({
  currentBrightness,
  isStrobeActive,
  currentPattern,
  currentFreqHz,
  onApplyPreset,
  activePresetId
}) => {
  const [customPresets, setCustomPresets] = useState<TorchPreset[]>(() => {
    try {
      const saved = localStorage.getItem('lumentorch_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const saveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: TorchPreset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      level: currentBrightness,
      isFlicker: isStrobeActive,
      flickerPattern: isStrobeActive ? currentPattern : undefined,
      flickerSpeedHz: isStrobeActive ? currentFreqHz : undefined,
      description: `${currentBrightness}% ${isStrobeActive ? `· ${currentPattern}` : 'Steady'}`,
      isCustom: true
    };

    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    try {
      localStorage.setItem('lumentorch_custom_presets', JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }

    setNewPresetName('');
    setIsAddingNew(false);
    torchEngine.triggerHaptic(20);
    onApplyPreset(newPreset);
  };

  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('lumentorch_custom_presets', JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }
    torchEngine.triggerHaptic(10);
  };

  const getPresetIcon = (preset: TorchPreset) => {
    if (preset.flickerPattern === 'candle') return <Flame className="w-4 h-4 text-amber-400" />;
    if (preset.flickerPattern === 'sos') return <LifeBuoy className="w-4 h-4 text-red-400" />;
    if (preset.level <= 15) return <Moon className="w-4 h-4 text-sky-400" />;
    if (preset.level >= 90) return <SunMedium className="w-4 h-4 text-amber-400" />;
    return <Compass className="w-4 h-4 text-neutral-400" />;
  };

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  return (
    <div className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-lg backdrop-blur-md">
      {/* Title & Save Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Brightness Presets</h3>
            <p className="text-xs text-neutral-400">Quick Recall Profiles</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Save Current</span>
        </button>
      </div>

      {/* Inline Save Form */}
      {isAddingNew && (
        <form onSubmit={saveCustomPreset} className="mb-4 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-medium">Save Current Setting as Preset</span>
            <span className="font-mono text-amber-400 tabular-nums">
              {currentBrightness}% {isStrobeActive ? `· ${currentPattern} (${currentFreqHz}Hz)` : 'Steady'}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Dog Walking, Tent Reading..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              maxLength={24}
              autoFocus
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {allPresets.map((preset) => {
          const isActive = activePresetId === preset.id || (!activePresetId && preset.level === currentBrightness && preset.isFlicker === isStrobeActive);
          return (
            <div
              key={preset.id}
              onClick={() => {
                torchEngine.triggerHaptic(18);
                onApplyPreset(preset);
              }}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                  : 'bg-neutral-800/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {getPresetIcon(preset)}
                  <span className="font-mono text-xs font-bold text-neutral-200 tabular-nums">
                    {preset.level}%
                  </span>
                </div>

                {preset.isCustom ? (
                  <button
                    onClick={(e) => deleteCustomPreset(preset.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded transition-opacity"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                ) : (
                  isActive && <Check className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {preset.name}
                </p>
                <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                  {preset.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
