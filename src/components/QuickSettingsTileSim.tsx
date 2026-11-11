import React, { useState } from 'react';
import { Flashlight, ChevronDown, Wifi, Bluetooth, Moon, Volume2 } from 'lucide-react';
import { torchEngine } from '../utils/torchEngine';

interface QuickSettingsTileSimProps {
  isTorchOn: boolean;
  brightness: number;
  maxStrengthLevel: number;
  onToggleTorch: () => void;
  onBrightnessChange: (val: number) => void;
}

export const QuickSettingsTileSim: React.FC<QuickSettingsTileSimProps> = ({
  isTorchOn,
  brightness,
  maxStrengthLevel,
  onToggleTorch,
  onBrightnessChange
}) => {
  const [showPopupSlider, setShowPopupSlider] = useState(false);
  const currentStrengthLevel = Math.max(1, Math.round((brightness / 100) * maxStrengthLevel));

  const handleTileClick = () => {
    torchEngine.triggerHaptic(15);
    onToggleTorch();
  };

  const handleTileLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    torchEngine.triggerHaptic(30);
    setShowPopupSlider(prev => !prev);
  };

  return (
    <div className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-lg backdrop-blur-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Android 13+ Quick Settings Shade</h3>
          <p className="text-xs text-neutral-400">System UI Tile & Long-Press Brightness Dialog</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
          API 33 Tiramisu
        </span>
      </div>

      {/* Simulated Android 13 Notification Shade Tiles Grid */}
      <div className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800/80 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pb-1 border-b border-neutral-800/50">
          <span>09:41 · 100% 5G</span>
          <div className="flex items-center gap-1 text-[10px]">
            <span>Pixel / OneUI Shade</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Flashlight Tile (Interactive) */}
          <div
            onClick={handleTileClick}
            onContextMenu={handleTileLongPress}
            className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
              isTorchOn
                ? 'bg-amber-400 text-neutral-950 shadow-md font-semibold'
                : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isTorchOn ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-700/60 text-neutral-300'
            }`}>
              <Flashlight className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs leading-tight truncate">Flashlight</p>
              <p className={`text-[10px] leading-tight truncate ${isTorchOn ? 'text-neutral-800 font-mono' : 'text-neutral-400'}`}>
                {isTorchOn ? `Lvl ${currentStrengthLevel}/${maxStrengthLevel}` : 'Off'}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTileLongPress(e);
              }}
              title="Expand Android 13 brightness slider"
              className={`p-1 rounded-full transition-transform ${isTorchOn ? 'hover:bg-amber-500 text-neutral-900' : 'hover:bg-neutral-700 text-neutral-400'} ${showPopupSlider ? 'rotate-180' : ''}`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dummy System Tile: Wi-Fi */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 text-neutral-400 opacity-70">
            <div className="w-8 h-8 rounded-full bg-neutral-700/40 flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-tight text-neutral-300 truncate">Internet</p>
              <p className="text-[10px] leading-tight truncate">Connected</p>
            </div>
          </div>

          {/* Dummy System Tile: Bluetooth */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 text-neutral-400 opacity-70">
            <div className="w-8 h-8 rounded-full bg-neutral-700/40 flex items-center justify-center shrink-0">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-tight text-neutral-300 truncate">Bluetooth</p>
              <p className="text-[10px] leading-tight truncate">Pixel Buds</p>
            </div>
          </div>

          {/* Dummy System Tile: Do Not Disturb */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-800/60 text-neutral-400 opacity-70">
            <div className="w-8 h-8 rounded-full bg-neutral-700/40 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-tight text-neutral-300 truncate">Do Not Disturb</p>
              <p className="text-[10px] leading-tight truncate">Off</p>
            </div>
          </div>
        </div>

        {/* Android 13 Tile Long-Press Strength Dialog */}
        {showPopupSlider && (
          <div className="mt-3 p-3 rounded-xl bg-neutral-900 border border-neutral-700 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Torch Strength Level</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {currentStrengthLevel} / {maxStrengthLevel} ({brightness}%)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={brightness}
              onChange={(e) => {
                onBrightnessChange(Number(e.target.value));
                torchEngine.triggerHaptic(6);
              }}
              className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[10px] text-neutral-400">
              In Android 13+, long-pressing the Quick Settings tile reveals this native level slider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
