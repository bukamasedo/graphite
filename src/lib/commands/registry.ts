import type { FocusPanel } from '@/stores/app-store';

export type CommandScope = 'global' | FocusPanel[];

export interface Command {
  id: string;
  name: string;
  description?: string;
  hotkey?: string;
  scope?: CommandScope;
  execute: () => void;
}

export function isCommandAllowedInPanel(
  command: Command,
  currentPanel: FocusPanel
): boolean {
  const scope = command.scope;
  if (!scope || scope === 'global') return true;
  return scope.includes(currentPanel);
}

export function scopesOverlap(
  a: CommandScope | undefined,
  b: CommandScope | undefined
): boolean {
  const aGlobal = !a || a === 'global';
  const bGlobal = !b || b === 'global';
  if (aGlobal || bGlobal) return true;
  return (a as FocusPanel[]).some((p) => (b as FocusPanel[]).includes(p));
}

class CommandRegistryImpl {
  private commands: Map<string, Command> = new Map();
  private defaults: Map<string, string> = new Map();

  register(command: Command) {
    if (!this.defaults.has(command.id) && command.hotkey) {
      this.defaults.set(command.id, command.hotkey);
    }
    this.commands.set(command.id, command);
  }

  getDefaultHotkey(id: string): string | undefined {
    return this.defaults.get(id);
  }

  unregister(id: string) {
    this.commands.delete(id);
  }

  execute(id: string) {
    const cmd = this.commands.get(id);
    if (cmd) cmd.execute();
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }
}

export const commandRegistry = new CommandRegistryImpl();
