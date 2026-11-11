import React from 'react';
import { Activity, Flame, Radio, LifeBuoy, Zap, Sliders } from 'lucide-react';
import { FlickerPattern } from '../types/torch';
import { torchEngine } from '../utils/torchEngine';

interface FlickerControllerProps {
  isStrobeActive: boolean;
  onToggleStrobe: (active: boolean) => void;
  frequencyHz: number;
  onFrequencyChange: (hz: number) => void;
  dutyCycle: number;
  onDutyCycleChange: (pct: number) => void;
  pattern: FlickerPattern;
  onPatternChange: (p: FlickerPattern) => void;
  flickerVisualTick: boolean;
  brightness: number;
}

export const FlickerController: React.FC<FlickerControllerProps> = ({
  isStrobeActive,
  onToggleStrobe,
  frequencyHz,
  onFrequencyChange,
  dutyCycle,
  onDutyCycleChange,
  pattern,
  onPatternChange,
  flickerVisualTick,
  brightness
}) => {
  const periodMs = Math.round(1000 / frequencyHz);
  const bpm = Math.round(frequencyHz * 60);

  const patterns: { id: FlickerPattern; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'strobe',
      label: 'Strobe',
      desc: 'Uniform high-speed pulse',
      icon: <Activity className="w-4 h-4" />
    },
    {
      id: 'sos',
      label: 'SOS Morse',
      desc: '... --- ... Distress',
      icon: <LifeBuoy className="w-4 h-4" />
    },
    {
      id: 'beacon',
      label: 'Beacon',
      desc: '120ms flash every 1.6s',
      icon: <Radio className="w-4 h-4" />
    },
    {
      id: 'candle',
      label: 'Candle',
      desc: 'Organic warm flicker',
      icon: <Flame className="w-4 h-4" />
    },
    {
      id: 'police',
      label: 'Double Pulse',
      desc: 'Rapid tactical flash',
      icon: <Zap className="w-4 h-4" />
    }
  ];

  const handleToggle = () => {
    torchEngine.triggerHaptic(20);
    onToggleStrobe(!isStrobeActive);
  };

  const handlePatternSelect = (p: FlickerPattern) => {
    torchEngine.triggerHaptic(15);
    onPatternChange(p);
  };

  return (
    <div className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-lg backdrop-blur-md">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isStrobeActive ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Flicker & Strobe Engine</h3>
            <p className="text-xs text-neutral-400">Variable Speed & Tactical Patterns</p>
          </div>
        </div>

        {/* Master Strobe Switch */}
        <button
          onClick={handleToggle}
          type="button"
          role="switch"
          aria-checked={isStrobeActive}
          className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isStrobeActive ? 'bg-amber-500' : 'bg-neutral-800'
          }`}
        >
          <span className="sr-only">Toggle flicker mode</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isStrobeActive ? 'translate-x-6 bg-neutral-950' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Pattern Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {patterns.map((item) => {
          const isSelected = pattern === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePatternSelect(item.id)}
              type="button"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                  : 'bg-neutral-800/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className={`shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                <p className="text-[10px] text-neutral-500 truncate leading-tight">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Speed (Frequency) & Duty Cycle Controls - when applicable */}
      {pattern !== 'candle' && (
        <div className="space-y-4 pt-3 border-t border-neutral-800/80">
          {/* Frequency (Hz) Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-neutral-300 font-medium">Flash Speed (Frequency)</span>
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <span className="text-amber-400 font-bold">{frequencyHz} Hz</span>
                <span className="text-neutral-500 text-[11px]">({periodMs}ms · {bpm} BPM)</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={frequencyHz}
              onChange={(e) => {
                onFrequencyChange(Number(e.target.value));
                torchEngine.triggerHaptic(6);
              }}
              aria-label="Flicker frequency in Hertz"
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
              <span>1 Hz (Slow)</span>
              <span>8 Hz</span>
              <span>15 Hz</span>
              <span>25 Hz (Ultra Fast)</span>
            </div>
          </div>

          {/* Duty Cycle Slider (for standard Strobe mode) */}
          {pattern === 'strobe' && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-1 text-neutral-300">
                  <Sliders className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Pulse Duty Cycle (Light On Ratio)</span>
                </div>
                <span className="font-mono tabular-nums text-neutral-300 font-semibold">{dutyCycle}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={dutyCycle}
                onChange={(e) => onDutyCycleChange(Number(e.target.value))}
                aria-label="Strobe duty cycle percentage"
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
                <span>10% (Sharp Flash)</span>
                <span>50% (Symmetric)</span>
                <span>90% (Blip Off)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Oscilloscope Signal Monitor */}
      <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              isStrobeActive && flickerVisualTick ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-neutral-700'
            }`}
          />
          <span className="text-[11px] font-mono text-neutral-400">
            {isStrobeActive
              ? (flickerVisualTick ? 'PULSE HIGH (ON)' : 'PULSE LOW (OFF)')
              : 'ENGINE IDLE'}
          </span>
        </div>

        {/* Quick SOS Trigger Button */}
        {pattern !== 'sos' && (
          <button
            onClick={() => {
              onPatternChange('sos');
              onToggleStrobe(true);
              torchEngine.triggerHaptic(30);
            }}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-white text-xs font-semibold transition-colors active:scale-95"
          >
            <LifeBuoy className="w-3 h-3" />
            <span>Quick SOS</span>
          </button>
        )}
      </div>
    </div>
  );
};
