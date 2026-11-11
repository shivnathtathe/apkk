import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sun,
  Zap,
  Activity,
  Bookmark,
  Code2,
  Sliders,
  Smartphone,
  Info,
  Maximize2,
  RotateCcw
} from 'lucide-react';

import { FlickerPattern, TorchPreset } from './types/torch';
import { torchEngine } from './utils/torchEngine';
import { TorchGlowVisualizer } from './components/TorchGlowVisualizer';
import { BrightnessSlider } from './components/BrightnessSlider';
import { FlickerController } from './components/FlickerController';
import { PresetsManager } from './components/PresetsManager';
import { ScreenTorchModal } from './components/ScreenTorchModal';
import { Camera2SourceCodeViewer } from './components/Camera2SourceCodeViewer';
import { QuickSettingsTileSim } from './components/QuickSettingsTileSim';
import { SafetyTimerCard } from './components/SafetyTimerCard';
import { PlayStorePublishModal } from './components/PlayStorePublishModal';
import { PackageCheck } from 'lucide-react';

export default function App() {
  // Main Torch State
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(65); // 1 to 100
  const [maxStrengthLevel, setMaxStrengthLevel] = useState<number>(64); // Pixel default

  // Flicker / Strobe State
  const [isStrobeActive, setIsStrobeActive] = useState<boolean>(false);
  const [flickerPattern, setFlickerPattern] = useState<FlickerPattern>('strobe');
  const [frequencyHz, setFrequencyHz] = useState<number>(8);
  const [dutyCycle, setDutyCycle] = useState<number>(50);
  const [flickerVisualTick, setFlickerVisualTick] = useState<boolean>(true);

  // Active Preset Tracking
  const [activePresetId, setActivePresetId] = useState<string | undefined>(undefined);

  // Hardware Torch integration state
  const [hardwareTorchAvailable, setHardwareTorchAvailable] = useState<boolean>(false);
  const [hardwareTorchActive, setHardwareTorchActive] = useState<boolean>(false);
  const [hardwareNotice, setHardwareNotice] = useState<string | null>(null);

  // Screen Torch Lantern modal
  const [isScreenTorchOpen, setIsScreenTorchOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

  // Active view section anchor
  const [activeTab, setActiveTab] = useState<'controls' | 'code' | 'system_ui'>('controls');

  // Ref to keep track of current states in asynchronous loops
  const stateRef = useRef({
    isTorchOn,
    brightness,
    isStrobeActive,
    flickerPattern,
    frequencyHz,
    dutyCycle
  });

  useEffect(() => {
    stateRef.current = {
      isTorchOn,
      brightness,
      isStrobeActive,
      flickerPattern,
      frequencyHz,
      dutyCycle
    };
  }, [isTorchOn, brightness, isStrobeActive, flickerPattern, frequencyHz, dutyCycle]);

  // Connect Real Phone LED Flash
  const connectHardware = async () => {
    torchEngine.triggerHaptic(25);
    setHardwareNotice('Connecting to rear camera flash LED...');
    const result = await torchEngine.initHardwareTorch();

    if (result.supported && result.hasTorch) {
      setHardwareTorchAvailable(true);
      setHardwareNotice('Connected! Real smartphone rear flash hardware is active.');
      if (isTorchOn) {
        await torchEngine.setHardwareTorch(true, brightness);
        setHardwareTorchActive(true);
      }
    } else {
      setHardwareTorchAvailable(false);
      setHardwareNotice(result.error || 'Hardware LED not detected. Using simulated glow & screen lantern.');
    }

    setTimeout(() => {
      setHardwareNotice(null);
    }, 4500);
  };

  // Sync Hardware Torch state when brightness or power changes
  useEffect(() => {
    if (!isStrobeActive) {
      torchEngine.stopFlickerLoop();
      setFlickerVisualTick(isTorchOn);

      if (hardwareTorchAvailable) {
        torchEngine.setHardwareTorch(isTorchOn, brightness);
        setHardwareTorchActive(isTorchOn);
      }
    } else if (isTorchOn) {
      // Start flicker loop
      torchEngine.startFlickerLoop(
        flickerPattern,
        frequencyHz,
        dutyCycle,
        brightness,
        (tickState, currentBrightnessOverride) => {
          setFlickerVisualTick(tickState);
        }
      );
    } else {
      torchEngine.stopFlickerLoop();
      setFlickerVisualTick(false);
      if (hardwareTorchAvailable) {
        torchEngine.setHardwareTorch(false);
        setHardwareTorchActive(false);
      }
    }

    return () => {
      // Cleanup on unmount or mode switch
    };
  }, [isTorchOn, isStrobeActive, flickerPattern, frequencyHz, dutyCycle, brightness, hardwareTorchAvailable]);

  // Power Toggle handler
  const handleTogglePower = useCallback(() => {
    torchEngine.triggerHaptic(30);
    setIsTorchOn(prev => !prev);
    setActivePresetId(undefined);
  }, []);

  // Brightness slider change
  const handleBrightnessChange = useCallback((newVal: number) => {
    setBrightness(newVal);
    setActivePresetId(undefined);
  }, []);

  // Apply a Preset
  const handleApplyPreset = useCallback((preset: TorchPreset) => {
    setActivePresetId(preset.id);
    setBrightness(preset.level);

    if (preset.isFlicker) {
      setIsStrobeActive(true);
      if (preset.flickerPattern) setFlickerPattern(preset.flickerPattern);
      if (preset.flickerSpeedHz) setFrequencyHz(preset.flickerSpeedHz);
    } else {
      setIsStrobeActive(false);
    }

    // Auto-turn on when preset selected
    setIsTorchOn(true);
  }, []);

  // Auto-off timer timeout handler
  const handleTimerTimeout = useCallback(() => {
    setIsTorchOn(false);
    setIsStrobeActive(false);
    torchEngine.stopFlickerLoop();
    torchEngine.setHardwareTorch(false);
    setHardwareTorchActive(false);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Bar Contract (Strict 3-zone layout) */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
              <Sun className="w-5 h-5 fill-current" />
            </div>
            <a href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>LumenTorch</span>
              <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Android 13+
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Single line) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <button
              onClick={() => setActiveTab('controls')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'controls' ? 'text-amber-400 font-semibold' : ''}`}
            >
              Torch Controller
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'code' ? 'text-amber-400 font-semibold' : ''}`}
            >
              Camera2 API Code
            </button>
            <button
              onClick={() => setActiveTab('system_ui')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === 'system_ui' ? 'text-amber-400 font-semibold' : ''}`}
            >
              Quick Settings Tile
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                torchEngine.triggerHaptic(15);
                setIsPublishModalOpen(true);
              }}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Publish App</span>
            </button>

            <button
              onClick={() => {
                torchEngine.triggerHaptic(20);
                setIsScreenTorchOpen(true);
              }}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all active:scale-95 shadow-sm shadow-amber-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Screen Lantern</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hardware Flash Notification Toast */}
      {hardwareNotice && (
        <div className="fixed top-20 right-4 z-50 max-w-sm p-3.5 rounded-xl bg-neutral-900 border border-amber-500/50 shadow-2xl text-xs text-neutral-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{hardwareNotice}</p>
          </div>
        </div>
      )}

      {/* Main Responsive Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex items-center p-1 mb-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'controls' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400'}`}
          >
            Torch
          </button>
          <button
            onClick={() => setActiveTab('system_ui')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'system_ui' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400'}`}
          >
            QS Shade
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'code' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400'}`}
          >
            Kotlin Code
          </button>
        </div>

        {/* Multi-Column Desktop Grid / Adaptive Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column A: Primary Interactive Flashlight Controls (Visible on controls view or desktop) */}
          <div className={`space-y-6 ${activeTab === 'controls' ? 'block' : 'hidden lg:block'} lg:col-span-7`}>
            {/* Visual Torch Core & Power Switch */}
            <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-2 shadow-2xl backdrop-blur-xl">
              <TorchGlowVisualizer
                isOn={isTorchOn}
                brightness={brightness}
                maxLevel={maxStrengthLevel}
                isStrobeActive={isStrobeActive}
                flickerVisualTick={flickerVisualTick}
                flickerPattern={flickerPattern}
                onToggle={handleTogglePower}
                hardwareTorchActive={hardwareTorchActive}
                hardwareTorchAvailable={hardwareTorchAvailable}
                onConnectHardware={connectHardware}
              />
            </div>

            {/* Camera2 Multi-level Brightness Slider */}
            <BrightnessSlider
              brightness={brightness}
              onChange={handleBrightnessChange}
              maxStrengthLevel={maxStrengthLevel}
              onMaxStrengthChange={setMaxStrengthLevel}
              isTorchOn={isTorchOn}
            />

            {/* Flicker & Strobe Engine with Speed Control */}
            <FlickerController
              isStrobeActive={isStrobeActive}
              onToggleStrobe={setIsStrobeActive}
              frequencyHz={frequencyHz}
              onFrequencyChange={setFrequencyHz}
              dutyCycle={dutyCycle}
              onDutyCycleChange={setDutyCycle}
              pattern={flickerPattern}
              onPatternChange={setFlickerPattern}
              flickerVisualTick={flickerVisualTick}
              brightness={brightness}
            />
          </div>

          {/* Column B: Presets, System UI Shade, Safety & Architecture Hub */}
          <div className={`space-y-6 ${activeTab !== 'controls' ? 'block' : 'hidden lg:block'} lg:col-span-5`}>
            {/* Brightness Presets (Always accessible in standard flow) */}
            <PresetsManager
              currentBrightness={brightness}
              isStrobeActive={isStrobeActive}
              currentPattern={flickerPattern}
              currentFreqHz={frequencyHz}
              onApplyPreset={handleApplyPreset}
              activePresetId={activePresetId}
            />

            {/* Quick Settings Simulation */}
            {(activeTab === 'system_ui' || activeTab === 'controls') && (
              <QuickSettingsTileSim
                isTorchOn={isTorchOn}
                brightness={brightness}
                maxStrengthLevel={maxStrengthLevel}
                onToggleTorch={handleTogglePower}
                onBrightnessChange={handleBrightnessChange}
              />
            )}

            {/* Auto-Off Safety Timer & Battery Protection */}
            <SafetyTimerCard
              isTorchOn={isTorchOn}
              brightness={brightness}
              onTimeout={handleTimerTimeout}
            />

            {/* Android 13+ Camera2 API Code Browser */}
            <Camera2SourceCodeViewer onOpenPublishModal={() => setIsPublishModalOpen(true)} />
          </div>
        </div>
      </main>

      {/* Screen Torch Lantern Modal (Warm/Amber/Red/White Fullscreen) */}
      <ScreenTorchModal
        isOpen={isScreenTorchOpen}
        onClose={() => setIsScreenTorchOpen(false)}
      />

      {/* Google Play Store Publishing Modal */}
      <PlayStorePublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Android 13+ Camera2 API Brightness Controller · API 33 Tiramisu Architecture
          </p>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>CameraManager.turnOnTorchWithStrengthLevel</span>
            <span aria-hidden="true">·</span>
            <span>Web Hardware LED Track</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
