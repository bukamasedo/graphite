import { corePlugins } from '../core';
import { createPluginContext } from '../api';
import type { Plugin } from '../types';

const activePlugins: Map<string, Plugin> = new Map();

export async function loadCorePlugins(): Promise<void> {
  for (const plugin of corePlugins) {
    try {
      const context = createPluginContext(plugin.manifest);
      await plugin.activate(context);
      activePlugins.set(plugin.manifest.id, plugin);
    } catch (e) {
      console.error(`Failed to activate plugin ${plugin.manifest.id}:`, e);
    }
  }
}

export function getActivePlugins(): Plugin[] {
  return Array.from(activePlugins.values());
}
