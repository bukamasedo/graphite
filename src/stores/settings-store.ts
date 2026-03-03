import { create } from 'zustand';
import { settingsApi } from '@/lib/api/settings-api';
import { DEFAULT_CONFIG, type GraphiteConfig } from '../types/config';

interface SettingsState {
  settings: GraphiteConfig;
  loaded: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof GraphiteConfig>(
    key: K,
    value: GraphiteConfig[K]
  ) => void;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_CONFIG },
  loaded: false,

  loadSettings: async () => {
    try {
      const saved = await settingsApi.readSettings();
      set({
        settings: { ...DEFAULT_CONFIG, ...saved } as GraphiteConfig,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  updateSetting: (key, value) => {
    set((s) => ({
      settings: { ...s.settings, [key]: value },
    }));
    // Debounced save
    setTimeout(() => get().saveSettings(), 500);
  },

  saveSettings: async () => {
    try {
      await settingsApi.writeSettings(get().settings);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },
}));
