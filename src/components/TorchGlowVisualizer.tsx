import React from 'react';
import { Zap, Power, ShieldAlert } from 'lucide-react';

interface TorchGlowVisualizerProps {
  isOn: boolean;
  brightness: number; // 1 to 100
  maxLevel: number;
  isStrobeActive: boolean;
  flickerVisualTick: boolean;
  flickerPattern: string;
  onToggle: () => void;
  hardwareTorchActive: boolean;
  hardwareTorchAvailable: boolean;
  onConnectHardware: () => void;
}

export const TorchGlowVisualizer: React.FC<TorchGlowVisualizerProps> = ({
  isOn,
  brightness,
  maxLevel,
  isStrobeActive,
  flickerVisualTick,
  flickerPattern,
  onToggle,
  hardwareTorchActive,
  hardwareTorchAvailable,
  onConnectHardware
}) => {
  // Compute visual luminescence factor
  const effectiveLightOn = isOn && (!isStrobeActive || flickerVisualTick);
  const normalizedLevel = brightness / 100;
  
  // Estimated Lumens (standard smartphone LED flashlight ~ 20 lm to 120 lm)
  const estimatedLumens = Math.round(15 + normalizedLevel * 105);
  // Estimated LUX at 1 meter (~ 10 to 80 lux)
  const estimatedLux = Math.round(8 + normalizedLevel * 72);

  // Dynamic glow calculation based on brightness level
  const glowSpread = effectiveLightOn ? Math.round(20 + normalizedLevel * 80) : 0;
  const glowOpacity = effectiveLightOn ? 0.35 + normalizedLevel * 0.55 : 0;
  const bulbBrightness = effectiveLightOn ? 0.4 + normalizedLevel * 0.6 : 0.15;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4 select-none">
      {/* Background Luminescent Atmospheric Cone */}
      <div
        className="pointer-events-none absolute -top-12 w-72 h-72 rounded-full transition-all duration-300 ease-out"
        style={{
          background: effectiveLightOn
            ? `radial-gradient(circle, rgba(251, 191, 36, ${glowOpacity * 0.8}) 0%, rgba(245, 158, 11, ${glowOpacity * 0.35}) 40%, rgba(217, 119, 6, 0) 70%)`
            : 'none',
          transform: `scale(${effectiveLightOn ? 1 + normalizedLevel * 0.6 : 0.8})`,
          filter: `blur(${effectiveLightOn ? 24 : 0}px)`
        }}
      />

      {/* Main Center Torch Core Unit */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Lamp Bezel Frame */}
        <div
          className="relative flex items-center justify-center w-48 h-48 rounded-full border border-neutral-700/60 bg-neutral-900/90 shadow-2xl backdrop-blur-xl transition-all duration-200"
          style={{
            boxShadow: effectiveLightOn
              ? `0 0 ${glowSpread}px ${glowSpread / 2}px rgba(251, 191, 36, ${glowOpacity * 0.5}), inset 0 0 24px rgba(251, 191, 36, ${glowOpacity * 0.4})`
              : '0 10px 30px -10px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.06)'
          }}
        >
          {/* Outer Lens Rings */}
          <div className="absolute inset-2 rounded-full border border-neutral-800/80" />
          <div className="absolute inset-5 rounded-full border border-neutral-700/40" />

          {/* Interactive Center Power Switch Button */}
          <button
            onClick={onToggle}
            type="button"
            aria-label={isOn ? 'Turn flashlight off' : 'Turn flashlight on'}
            className="group relative flex items-center justify-center w-32 h-32 rounded-full transition-transform duration-150 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/50 cursor-pointer"
            style={{
              background: effectiveLightOn
                ? 'radial-gradient(circle at 35% 35%, #fef3c7 0%, #f59e0b 60%, #b45309 100%)'
                : 'radial-gradient(circle at 35% 35%, #262626 0%, #171717 70%, #0a0a0a 100%)',
              boxShadow: effectiveLightOn
                ? '0 0 35px rgba(245, 158, 11, 0.7), inset 0 2px 4px rgba(255,255,255,0.8)'
                : 'inset 0 2px 4px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            {/* LED Emitter Core pattern */}
            <div
              className="absolute w-12 h-12 rounded-lg border transition-all duration-200"
              style={{
                borderColor: effectiveLightOn ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: effectiveLightOn ? '#fffbeb' : '#1c1917',
                opacity: bulbBrightness,
                boxShadow: effectiveLightOn ? '0 0 16px #fbbf24' : 'none'
              }}
            />

            {/* Icon */}
            <Power
              className="relative z-10 w-10 h-10 transition-colors duration-200"
              style={{
                color: effectiveLightOn ? '#451a03' : '#737373',
                strokeWidth: 2.4
              }}
            />
          </button>
        </div>

        {/* Status Indicators & Metrology Readout */}
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-neutral-400">
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: effectiveLightOn ? '#f59e0b' : '#525252'
              }}
            />
            <span className="text-neutral-200 font-semibold tracking-wide">
              {effectiveLightOn ? (isStrobeActive ? `STROBE (${flickerPattern.toUpperCase()})` : 'TORCH ACTIVE') : 'STANDBY'}
            </span>
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="font-mono tabular-nums text-neutral-300">
            {isOn ? `${Math.round((brightness / 100) * maxLevel)}/${maxLevel} STRENGTH` : 'OFF'}
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="font-mono tabular-nums text-amber-400 font-medium">
            {isOn ? `~${estimatedLumens} lm` : '0 lm'}
          </span>
        </div>

        {/* Hardware Status & Connect Button */}
        <div className="mt-3 flex items-center gap-3">
          {hardwareTorchActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Hardware LED Connected</span>
            </div>
          ) : (
            <button
              onClick={onConnectHardware}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
              title="Connect real smartphone rear LED flash via Web Camera API"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{hardwareTorchAvailable ? 'Enable Rear LED Flash' : 'Try Real Phone LED'}</span>
            </button>
          )}

          {brightness >= 90 && isOn && (
            <div className="flex items-center gap-1 text-[11px] text-amber-500/90 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>High Current</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
