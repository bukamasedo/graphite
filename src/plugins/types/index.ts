export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions?: PluginPermission[];
}

export type PluginPermission =
  | 'notes:read'
  | 'notes:write'
  | 'editor:read'
  | 'editor:write'
  | 'commands'
  | 'events'
  | 'settings';

export interface PluginContext {
  manifest: PluginManifest;
  notes: NotesAPI;
  editor: EditorAPI;
  commands: CommandsAPI;
  events: EventsAPI;
  settings: SettingsAPI;
}

export interface NotesAPI {
  list: () => { title: string; path: string }[];
  read: (path: string) => Promise<string>;
  write: (path: string, content: string) => Promise<void>;
  create: (title?: string) => Promise<{ title: string; path: string }>;
}

export interface EditorAPI {
  getContent: () => string | null;
  getCursor: () => { line: number; column: number };
}

export interface CommandsAPI {
  register: (id: string, name: string, execute: () => void) => void;
  unregister: (id: string) => void;
}

export interface EventsAPI {
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
  emit: (event: string, ...args: unknown[]) => void;
}

export interface SettingsAPI {
  get: <T>(key: string, defaultValue: T) => T;
  set: (key: string, value: unknown) => void;
}

export interface Plugin {
  manifest: PluginManifest;
  activate: (context: PluginContext) => void | Promise<void>;
  deactivate?: () => void;
}
