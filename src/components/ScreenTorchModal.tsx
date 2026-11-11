import React, { useState } from 'react';
import { X, Sun, Eye, Sliders, Moon } from 'lucide-react';
import { torchEngine } from '../utils/torchEngine';

interface ScreenTorchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenTorchModal: React.FC<ScreenTorchModalProps> = ({
  isOpen,
  onClose
}) => {
  const [screenBrightness, setScreenBrightness] = useState<number>(100);
  const [colorMode, setColorMode] = useState<'white' | 'warm' | 'amber' | 'red'>('white');
  const [isMinimalMode, setIsMinimalMode] = useState<boolean>(false);

  if (!isOpen) return null;

  const colorPalettes = {
    white: {
      bg: '#ffffff',
      label: '6500K Cool Daylight',
      textColor: '#171717',
      panelBg: 'rgba(0, 0, 0, 0.75)',
      panelText: '#ffffff'
    },
    warm: {
      bg: '#fff7ed', // Soft warm 3500K
      label: '3500K Warm Neutral',
      textColor: '#451a03',
      panelBg: 'rgba(0, 0, 0, 0.75)',
      panelText: '#ffffff'
    },
    amber: {
      bg: '#ffedd5', // Amber candle 2400K
      label: '2400K Candle Amber',
      textColor: '#7c2d12',
      panelBg: 'rgba(0, 0, 0, 0.75)',
      panelText: '#ffffff'
    },
    red: {
      bg: '#dc2626', // Night vision red
      label: 'Tactical Red (Dark Vision)',
      textColor: '#ffffff',
      panelBg: 'rgba(0, 0, 0, 0.85)',
      panelText: '#ffffff'
    }
  };

  const currentTheme = colorPalettes[colorMode];
  const opacityFactor = screenBrightness / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between transition-colors duration-200 select-none overflow-hidden"
      style={{
        backgroundColor: currentTheme.bg,
        opacity: Math.max(0.2, opacityFactor)
      }}
      onDoubleClick={() => setIsMinimalMode(!isMinimalMode)}
    >
      {/* Top Header / Dismiss */}
      {!isMinimalMode && (
        <div
          className="m-4 p-3 rounded-2xl flex items-center justify-between backdrop-blur-md transition-opacity duration-200"
          style={{ backgroundColor: currentTheme.panelBg, color: currentTheme.panelText }}
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs font-semibold">High-CRI Screen Lantern</p>
              <p className="text-[10px] text-neutral-300">Double-tap anywhere to hide controls</p>
            </div>
          </div>

          <button
            onClick={() => {
              torchEngine.triggerHaptic(15);
              onClose();
            }}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Center Minimal Mode Prompt */}
      {isMinimalMode && (
        <div className="flex-1 flex items-center justify-center">
          <p
            className="text-xs font-medium px-4 py-2 rounded-full backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: currentTheme.panelBg, color: currentTheme.panelText }}
          >
            Double-tap to show controls
          </p>
        </div>
      )}

      {/* Bottom Controls Bar */}
      {!isMinimalMode && (
        <div
          className="m-4 p-4 rounded-2xl backdrop-blur-md space-y-3.5 transition-opacity duration-200"
          style={{ backgroundColor: currentTheme.panelBg, color: currentTheme.panelText }}
        >
          {/* Color Mode Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-neutral-300">Color Spectrum</span>
              <span className="text-[11px] text-amber-300 font-mono">{currentTheme.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['white', 'warm', 'amber', 'red'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setColorMode(mode);
                    torchEngine.triggerHaptic(10);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    colorMode === mode
                      ? 'border-amber-400 bg-white/20 shadow-sm'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Illumination Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Sliders className="w-3.5 h-3.5" />
                <span>Screen Illumination Intensity</span>
              </div>
              <span className="font-mono text-amber-300 font-semibold">{screenBrightness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={screenBrightness}
              onChange={(e) => {
                setScreenBrightness(Number(e.target.value));
                torchEngine.triggerHaptic(5);
              }}
              className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
