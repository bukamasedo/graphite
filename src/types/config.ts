export interface GraphiteConfig {
  vaultPath: string;
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  editorFontFamily: string;
  lineHeight: number;
  editorPadding: number;
  spellCheck: boolean;
  codeBlockWordWrap: boolean;
  sidebarWidth: number;
  noteListWidth: number;
  trashRetentionDays: number;
  language: 'en' | 'ja';
  hasSeenOnboarding: boolean;
  mcpClients: string[];
}

export const DEFAULT_CONFIG: GraphiteConfig = {
  vaultPath: '',
  theme: 'dark',
  fontSize: 15,
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  editorFontFamily: 'SF Mono, Menlo, monospace',
  lineHeight: 1.7,
  editorPadding: 24,
  spellCheck: false,
  codeBlockWordWrap: false,
  sidebarWidth: 220,
  noteListWidth: 280,
  trashRetentionDays: 30,
  language: 'en',
  hasSeenOnboarding: false,
  mcpClients: [],
};

export interface HotkeyConfig {
  [commandId: string]: string;
}

export interface PluginConfig {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}
