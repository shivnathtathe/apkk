export type FlickerPattern = 'strobe' | 'sos' | 'police' | 'beacon' | 'candle';

export interface TorchPreset {
  id: string;
  name: string;
  level: number; // 1 to 100
  isFlicker?: boolean;
  flickerPattern?: FlickerPattern;
  flickerSpeedHz?: number;
  description: string;
  isCustom?: boolean;
}

export interface Camera2HardwareProfile {
  name: string;
  model: string;
  androidVersion: string;
  maxStrengthLevel: number;
  defaultStrengthLevel: number;
  notes: string;
}

export interface ScreenTorchSettings {
  enabled: boolean;
  colorMode: 'white' | 'warm' | 'amber' | 'red' | 'blue';
  brightness: number; // 0 to 100
  customHex?: string;
}
