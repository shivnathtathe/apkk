import React from 'react';
import { Sun, Minus, Plus, Gauge } from 'lucide-react';
import { torchEngine } from '../utils/torchEngine';

interface BrightnessSliderProps {
  brightness: number; // 1 to 100
  onChange: (val: number) => void;
  maxStrengthLevel: number;
  onMaxStrengthChange: (max: number) => void;
  isTorchOn: boolean;
}

export const BrightnessSlider: React.FC<BrightnessSliderProps> = ({
  brightness,
  onChange,
  maxStrengthLevel,
  onMaxStrengthChange,
  isTorchOn
}) => {
  // Convert percentage (1-100) to device strength level (1-maxStrengthLevel)
  const currentLevelInt = Math.max(1, Math.round((brightness / 100) * maxStrengthLevel));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = Number(e.target.value);
    onChange(rawVal);
    torchEngine.triggerHaptic(8);
  };

  const handleStep = (delta: number) => {
    const newPercent = Math.min(100, Math.max(1, brightness + delta));
    onChange(newPercent);
    torchEngine.triggerHaptic(12);
  };

  const hardwareProfilePresets = [
    { label: 'Pixel (64)', val: 64 },
    { label: 'Pixel 7 (32)', val: 32 },
    { label: 'Galaxy (5)', val: 5 },
    { label: 'Standard (100)', val: 100 }
  ];

  return (
    <div className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-lg backdrop-blur-md">
      {/* Header with Camera2 Metric */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Camera2 Brightness Level</h3>
            <p className="text-xs text-neutral-400">Android 13+ Strength Regulation</p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-xl font-bold tabular-nums text-amber-400">
            {brightness}%
          </span>
          <p className="font-mono text-[11px] text-neutral-500 tabular-nums">
            Level {currentLevelInt} / {maxStrengthLevel}
          </p>
        </div>
      </div>

      {/* Main Slider Track */}
      <div className="relative py-2">
        <input
          type="range"
          min="1"
          max="100"
          value={brightness}
          onChange={handleSliderChange}
          aria-label="Torch brightness level"
          className="w-full h-3.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          style={{
            background: `linear-gradient(to right, #f59e0b 0%, #fbbf24 ${brightness}%, #262626 ${brightness}%, #262626 100%)`
          }}
        />

        {/* Graduation Tick Markers */}
        <div className="flex justify-between px-1 mt-2 text-[10px] font-mono text-neutral-500 select-none">
          <span>MIN (1)</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>MAX ({maxStrengthLevel})</span>
        </div>
      </div>

      {/* Stepping controls for micro-adjustments */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStep(-10)}
            type="button"
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors active:scale-95"
            title="Decrease 10%"
          >
            -10%
          </button>
          <button
            onClick={() => handleStep(-1)}
            type="button"
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-colors active:scale-95"
            title="Decrease 1%"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          <Gauge className="w-3.5 h-3.5 text-neutral-500" />
          <span>Profile:</span>
          <select
            value={maxStrengthLevel}
            onChange={(e) => onMaxStrengthChange(Number(e.target.value))}
            className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 border border-neutral-700 focus:outline-none cursor-pointer"
          >
            {hardwareProfilePresets.map(p => (
              <option key={p.val} value={p.val}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStep(1)}
            type="button"
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-colors active:scale-95"
            title="Increase 1%"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStep(10)}
            type="button"
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors active:scale-95"
            title="Increase 10%"
          >
            +10%
          </button>
        </div>
      </div>
    </div>
  );
};
