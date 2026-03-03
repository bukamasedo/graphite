import { noteApi } from '@/lib/api/note-api';
import { commandRegistry } from '@/lib/commands/registry';
import { useEditorStore } from '@/stores/editor-store';
import { useNoteStore } from '@/stores/note-store';
import type { PluginContext, PluginManifest, PluginPermission } from '../types';

class EventBus {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  on(event: string, handler: (...args: unknown[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((handler) => handler(...args));
  }
}

const globalEventBus = new EventBus();

function hasPermission(
  manifest: PluginManifest,
  permission: PluginPermission
): boolean {
  return manifest.permissions?.includes(permission) ?? false;
}

export function createPluginContext(manifest: PluginManifest): PluginContext {
  const prefixedCommandIds: string[] = [];

  return {
    manifest,

    notes: {
      list: () => {
        return useNoteStore
          .getState()
          .notes.map((n) => ({ title: n.title, path: n.path }));
      },
      read: async (path) => {
        if (!hasPermission(manifest, 'notes:read'))
          throw new Error('Missing notes:read permission');
        const note = await noteApi.readNote(path);
        return note.content;
      },
      write: async (path, content) => {
        if (!hasPermission(manifest, 'notes:write'))
          throw new Error('Missing notes:write permission');
        await noteApi.writeNote(
          path,
          content,
          null as string | null,
          null as string[] | null,
          null as boolean | null
        );
      },
      create: async (title) => {
        if (!hasPermission(manifest, 'notes:write'))
          throw new Error('Missing notes:write permission');
        const note = await useNoteStore.getState().createNote(undefined, title);
        return { title: note.title, path: note.path };
      },
    },

    editor: {
      getContent: () => {
        const { editor } = useEditorStore.getState();
        if (!editor) return null;
        return editor.storage.markdown.getMarkdown();
      },
      getCursor: () => {
        const { lineNumber, column } = useEditorStore.getState();
        return { line: lineNumber, column };
      },
    },

    commands: {
      register: (id, name, execute) => {
        const fullId = `plugin:${manifest.id}:${id}`;
        commandRegistry.register({ id: fullId, name, execute });
        prefixedCommandIds.push(fullId);
      },
      unregister: (id) => {
        const fullId = `plugin:${manifest.id}:${id}`;
        commandRegistry.unregister(fullId);
      },
    },

    events: {
      on: (event, handler) => globalEventBus.on(event, handler),
      emit: (event, ...args) => globalEventBus.emit(event, ...args),
    },

    settings: {
      get: <T>(key: string, defaultValue: T): T => {
        // Plugin settings stored in localStorage for now
        const val = localStorage.getItem(`plugin:${manifest.id}:${key}`);
        if (val === null) return defaultValue;
        try {
          return JSON.parse(val) as T;
        } catch {
          return defaultValue;
        }
      },
      set: (key, value) => {
        localStorage.setItem(
          `plugin:${manifest.id}:${key}`,
          JSON.stringify(value)
        );
      },
    },
  };
}
