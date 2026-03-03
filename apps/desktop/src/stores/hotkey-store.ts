import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { HotkeyConfig } from '@graphite/shared';
import { commandRegistry, scopesOverlap, type Command } from '@/lib/commands/registry';

interface HotkeyState {
  overrides: HotkeyConfig;
  loaded: boolean;

  loadHotkeys: () => Promise<void>;
  setHotkey: (commandId: string, hotkey: string) => void;
  resetHotkey: (commandId: string) => void;
  resetAllHotkeys: () => void;
  getEffectiveHotkey: (commandId: string) => string | undefined;
  findConflict: (hotkey: string, excludeId: string) => Command | undefined;
}

export const useHotkeyStore = create<HotkeyState>((set, get) => ({
  overrides: {},
  loaded: false,

  loadHotkeys: async () => {
    try {
      const saved = await invoke<HotkeyConfig>('read_hotkeys');
      set({ overrides: saved ?? {}, loaded: true });
      // Apply overrides to command registry
      for (const [id, hotkey] of Object.entries(saved ?? {})) {
        const cmd = commandRegistry.getCommand(id);
        if (cmd) {
          commandRegistry.register({ ...cmd, hotkey });
        }
      }
    } catch {
      set({ loaded: true });
    }
  },

  setHotkey: (commandId, hotkey) => {
    const overrides = { ...get().overrides, [commandId]: hotkey };
    set({ overrides });
    // Update registry
    const cmd = commandRegistry.getCommand(commandId);
    if (cmd) {
      commandRegistry.register({ ...cmd, hotkey });
    }
    invoke('write_hotkeys', { hotkeys: overrides }).catch(console.error);
  },

  resetHotkey: (commandId) => {
    const overrides = { ...get().overrides };
    delete overrides[commandId];
    set({ overrides });
    const cmd = commandRegistry.getCommand(commandId);
    const defaultHotkey = commandRegistry.getDefaultHotkey(commandId);
    if (cmd) {
      commandRegistry.register({ ...cmd, hotkey: defaultHotkey ?? '' });
    }
    invoke('write_hotkeys', { hotkeys: overrides }).catch(console.error);
  },

  resetAllHotkeys: () => {
    set({ overrides: {} });
    for (const cmd of commandRegistry.getCommands()) {
      const defaultHotkey = commandRegistry.getDefaultHotkey(cmd.id);
      if (defaultHotkey !== undefined) {
        commandRegistry.register({ ...cmd, hotkey: defaultHotkey });
      }
    }
    invoke('write_hotkeys', { hotkeys: {} }).catch(console.error);
  },

  getEffectiveHotkey: (commandId) => {
    return commandRegistry.getCommand(commandId)?.hotkey;
  },

  findConflict: (hotkey, excludeId) => {
    const normalized = hotkey.toLowerCase();
    const source = commandRegistry.getCommand(excludeId);
    return commandRegistry
      .getCommands()
      .find((c) => c.id !== excludeId && c.hotkey?.toLowerCase() === normalized && scopesOverlap(source?.scope, c.scope));
  },
}));
