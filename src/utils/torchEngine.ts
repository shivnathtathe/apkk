import { FlickerPattern } from '../types/torch';

class TorchEngine {
  private mediaStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private isTorchSupported: boolean = false;
  private isStrengthSupported: boolean = false;
  private maxHardwareStrength: number = 100;
  private isHardwareActive: boolean = false;
  private strobeTimer: number | null = null;
  private animFrameId: number | null = null;
  private isStrobeLightStateOn: boolean = false;
  private stateChangeListeners: Set<(active: boolean, physicalState: boolean) => void> = new Set();
  private errorListeners: Set<(err: string) => void> = new Set();

  constructor() {
    this.checkBasicSupport();
  }

  private checkBasicSupport(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  public subscribeState(listener: (active: boolean, physicalState: boolean) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  public subscribeError(listener: (err: string) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private notify(active: boolean, physicalState: boolean) {
    this.stateChangeListeners.forEach(listener => listener(active, physicalState));
  }

  private notifyError(err: string) {
    this.errorListeners.forEach(listener => listener(err));
  }

  public async initHardwareTorch(): Promise<{ supported: boolean; hasTorch: boolean; error?: string }> {
    if (!this.checkBasicSupport()) {
      return { supported: false, hasTorch: false, error: 'Camera API not available in this browser environment.' };
    }

    try {
      if (!this.mediaStream) {
        // Request rear-facing camera stream to access LED flash hardware
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
      }

      this.videoTrack = this.mediaStream.getVideoTracks()[0];
      if (!this.videoTrack) {
        throw new Error('No video track found for rear camera.');
      }

      // Check capabilities for 'torch'
      // Note: TypeScript standard lib doesn't always have getCapabilities in MediaStreamTrack type
      const trackWithCaps = this.videoTrack as any;
      const capabilities = trackWithCaps.getCapabilities ? trackWithCaps.getCapabilities() : {};
      
      this.isTorchSupported = Boolean(capabilities.torch);
      this.isStrengthSupported = Boolean(capabilities.torchStrength || capabilities.fillLightMode);

      if (capabilities.torchStrength && typeof capabilities.torchStrength === 'object') {
        this.maxHardwareStrength = capabilities.torchStrength.max || 100;
      }

      return {
        supported: true,
        hasTorch: this.isTorchSupported
      };
    } catch (err: any) {
      console.warn('Hardware torch init notice:', err);
      return {
        supported: false,
        hasTorch: false,
        error: err.name === 'NotAllowedError' 
          ? 'Camera permission denied. The app will use high-intensity screen illumination.' 
          : err.message || 'Unable to access camera hardware.'
      };
    }
  }

  public async setHardwareTorch(on: boolean, strengthLevel: number = 100): Promise<boolean> {
    if (!this.videoTrack || !this.isTorchSupported) {
      return false;
    }

    try {
      const trackAny = this.videoTrack as any;
      const constraints: any = {
        advanced: [{ torch: on }]
      };

      if (this.isStrengthSupported && on) {
        constraints.advanced[0].torchStrength = strengthLevel;
      }

      await trackAny.applyConstraints(constraints);
      this.isHardwareActive = on;
      return true;
    } catch (err: any) {
      console.warn('Failed to apply torch constraints:', err);
      return false;
    }
  }

  public triggerHaptic(durationMs: number = 20) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {
        // Ignore vibration errors on unsupported environments
      }
    }
  }

  public triggerHapticPattern(pattern: number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore
      }
    }
  }

  // --- Strobe / Flicker Engine ---
  public startFlickerLoop(
    pattern: FlickerPattern,
    frequencyHz: number,
    dutyCyclePercent: number,
    brightness: number,
    onTick: (state: boolean, brightnessOverride?: number) => void
  ) {
    this.stopFlickerLoop();

    if (pattern === 'strobe') {
      const periodMs = Math.max(25, Math.round(1000 / Math.max(1, Math.min(30, frequencyHz))));
      const onTimeMs = Math.max(10, Math.round(periodMs * (Math.max(10, Math.min(90, dutyCyclePercent)) / 100)));
      const offTimeMs = Math.max(10, periodMs - onTimeMs);

      let isLightOn = false;

      const cycle = () => {
        isLightOn = !isLightOn;
        this.isStrobeLightStateOn = isLightOn;
        onTick(isLightOn);
        this.setHardwareTorch(isLightOn, brightness);

        const nextDelay = isLightOn ? onTimeMs : offTimeMs;
        this.strobeTimer = window.setTimeout(cycle, nextDelay);
      };

      cycle();
    } else if (pattern === 'sos') {
      // Standard Morse SOS: ... --- ...
      // Timing: Dot = 1 unit, Dash = 3 units, Gap between symbols = 1 unit,
      // Gap between letters = 3 units, Word pause = 7 units.
      const unitMs = Math.max(60, Math.round(1500 / Math.max(1, frequencyHz * 4)));
      
      // Sequence array: [isOn, durationUnits]
      const sequence: [boolean, number][] = [
        // S (...)
        [true, 1], [false, 1],
        [true, 1], [false, 1],
        [true, 1], [false, 3], // 3 units between letters
        // O (---)
        [true, 3], [false, 1],
        [true, 3], [false, 1],
        [true, 3], [false, 3], // 3 units between letters
        // S (...)
        [true, 1], [false, 1],
        [true, 1], [false, 1],
        [true, 1], [false, 7]  // 7 units between words / loop
      ];

      let stepIndex = 0;
      const playStep = () => {
        const [state, durationUnits] = sequence[stepIndex];
        this.isStrobeLightStateOn = state;
        onTick(state);
        this.setHardwareTorch(state, brightness);

        stepIndex = (stepIndex + 1) % sequence.length;
        this.strobeTimer = window.setTimeout(playStep, durationUnits * unitMs);
      };

      playStep();
    } else if (pattern === 'police') {
      // Double flash pattern
      const flashFast = 50;
      const pauseShort = 60;
      const pauseLong = 250;

      const policeSeq: [boolean, number][] = [
        [true, flashFast], [false, pauseShort],
        [true, flashFast], [false, pauseLong],
        [true, flashFast], [false, pauseShort],
        [true, flashFast], [false, pauseLong * 1.5]
      ];

      let stepIndex = 0;
      const playStep = () => {
        const [state, durationMs] = policeSeq[stepIndex];
        this.isStrobeLightStateOn = state;
        onTick(state);
        this.setHardwareTorch(state, brightness);

        stepIndex = (stepIndex + 1) % policeSeq.length;
        this.strobeTimer = window.setTimeout(playStep, durationMs);
      };

      playStep();
    } else if (pattern === 'beacon') {
      // Emergency beacon: 100ms flash every 1500ms
      let state = false;
      const beaconCycle = () => {
        state = !state;
        this.isStrobeLightStateOn = state;
        onTick(state);
        this.setHardwareTorch(state, brightness);

        const duration = state ? 120 : 1600;
        this.strobeTimer = window.setTimeout(beaconCycle, duration);
      };

      beaconCycle();
    } else if (pattern === 'candle') {
      // Organic candle flame flicker simulation
      let baseBrightness = brightness;
      const flickerCandle = () => {
        // Random fluctuation between 30% and 100% of target brightness
        const randomFactor = 0.35 + Math.random() * 0.65;
        const currentCandleLevel = Math.round(baseBrightness * randomFactor);
        const candleState = Math.random() > 0.08; // Rarely dips completely

        onTick(candleState, currentCandleLevel);
        this.setHardwareTorch(candleState, currentCandleLevel);

        const nextDelay = 40 + Math.floor(Math.random() * 140);
        this.strobeTimer = window.setTimeout(flickerCandle, nextDelay);
      };

      flickerCandle();
    }
  }

  public stopFlickerLoop() {
    if (this.strobeTimer !== null) {
      clearTimeout(this.strobeTimer);
      this.strobeTimer = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isStrobeLightStateOn = false;
  }

  public cleanup() {
    this.stopFlickerLoop();
    if (this.videoTrack) {
      try {
        this.setHardwareTorch(false);
        this.videoTrack.stop();
      } catch (e) {
        // Ignore
      }
      this.videoTrack = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {
        // Ignore
      }
      this.mediaStream = null;
    }
  }
}

export const torchEngine = new TorchEngine();
