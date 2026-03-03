import { useEffect } from 'react';
import { commandRegistry, isCommandAllowedInPanel } from '@/lib/commands/registry';
import { useHotkeyStore } from '@/stores/hotkey-store';
import { useAppStore } from '@/stores/app-store';
import { IS_MAC, isEditableTarget } from '@/lib/platform';

interface ParsedHotkey {
  key: string;
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

/**
 * Parse a hotkey string into a structured object.
 *
 * Supported modifiers:
 * - "Mod" — Cmd on macOS, Ctrl on Windows/Linux (platform-aware)
 * - "Cmd" / "Meta" — always metaKey
 * - "Ctrl" — always ctrlKey
 * - "Alt" — altKey
 * - "Shift" — shiftKey
 */
function parseHotkey(str: string): ParsedHotkey {
  const parts = str.split('+');
  const key = parts[parts.length - 1];
  const hasMod = parts.some((p) => p === 'Mod');
  const hasCmd = parts.some((p) => p === 'Cmd' || p === 'Meta');
  const hasCtrl = parts.some((p) => p === 'Ctrl');
  return {
    key: key.toLowerCase(),
    // "Mod" resolves to meta on macOS, ctrl on others.
    // "Cmd" always means meta.
    mod: hasMod || hasCmd,
    ctrl: hasCtrl,
    alt: parts.some((p) => p === 'Alt'),
    shift: parts.some((p) => p === 'Shift'),
  };
}

function matchesEvent(parsed: ParsedHotkey, e: KeyboardEvent): boolean {
  const eventKey = e.key === ' ' ? 'space' : e.key.toLowerCase();

  // Resolve "mod" to the platform modifier
  const expectMeta = parsed.mod ? IS_MAC : false;
  const expectCtrl = parsed.mod ? !IS_MAC : parsed.ctrl;

  return (
    eventKey === parsed.key &&
    e.metaKey === expectMeta &&
    e.ctrlKey === expectCtrl &&
    e.altKey === parsed.alt &&
    e.shiftKey === parsed.shift
  );
}

export function useCommandHotkeys() {
  const overrides = useHotkeyStore((s) => s.overrides);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const commands = commandRegistry.getCommands();
      for (const cmd of commands) {
        if (!cmd.hotkey) continue;
        const parsed = parseHotkey(cmd.hotkey);
        if (matchesEvent(parsed, e)) {
          // Single-key shortcuts (no modifiers): skip in editable targets
          const hasModifier = parsed.mod || parsed.ctrl || parsed.alt || parsed.shift;
          if (!hasModifier && isEditableTarget(e)) continue;

          // Scope check: only fire if current panel matches command scope
          const currentPanel = useAppStore.getState().focusedPanel;
          if (!isCommandAllowedInPanel(cmd, currentPanel)) continue;

          e.preventDefault();
          cmd.execute();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overrides]);
}
