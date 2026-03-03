export interface GraphiteConfig {
  vaultPath: string;
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  editorFontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  sidebarWidth: number;
  noteListWidth: number;
  trashRetentionDays: number;
  language: 'en' | 'ja';
  hasSeenOnboarding: boolean;
}

export const DEFAULT_CONFIG: GraphiteConfig = {
  vaultPath: '',
  theme: 'dark',
  fontSize: 15,
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  editorFontFamily: 'SF Mono, Menlo, monospace',
  tabSize: 2,
  wordWrap: true,
  autoSave: true,
  autoSaveInterval: 3000,
  spellCheck: false,
  sidebarWidth: 220,
  noteListWidth: 280,
  trashRetentionDays: 30,
  language: 'en',
  hasSeenOnboarding: false,
};

export interface HotkeyConfig {
  [commandId: string]: string;
}

export interface PluginConfig {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}
