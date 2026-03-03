/**
 * Platform detection and keybinding utilities.
 *
 * ## Keybinding Conventions (see memory/keybinding-conventions.md)
 *
 * Three navigation paradigms are supported: Vi, Emacs, Arrow keys.
 * Platform-aware modifier: "Mod" resolves to Cmd (macOS) or Ctrl (Windows/Linux).
 *
 * Use `isMod(e)` to check the platform modifier key.
 * Use `MOD_KEY` for display strings ("⌘" or "Ctrl").
 */

export const IS_MAC = navigator.platform.toUpperCase().includes('MAC');

/** The platform-appropriate primary modifier: Cmd on macOS, Ctrl elsewhere */
export function isMod(e: KeyboardEvent): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey;
}

/** Display symbol for the platform modifier */
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

/** Display symbol for Shift */
export const SHIFT_KEY = IS_MAC ? '⇧' : 'Shift';

/** Display symbol for Alt/Option */
export const ALT_KEY = IS_MAC ? '⌥' : 'Alt';

/** Display symbol for Ctrl (always Ctrl, not the "Mod" alias) */
export const CTRL_KEY = IS_MAC ? '⌃' : 'Ctrl';

/**
 * Checks if an event matches a navigation key.
 * Supports Vi (h/j/k/l), Emacs (Ctrl+n/p/f/b), and Arrow keys.
 *
 * @returns 'up' | 'down' | 'left' | 'right' | null
 */
export type NavDirection = 'up' | 'down' | 'left' | 'right';

export function getNavDirection(e: KeyboardEvent): NavDirection | null {
  // Arrow keys (no modifier required)
  if (!e.metaKey && !e.altKey) {
    if (e.key === 'ArrowUp') return 'up';
    if (e.key === 'ArrowDown') return 'down';
    if (e.key === 'ArrowLeft') return 'left';
    if (e.key === 'ArrowRight') return 'right';
  }

  // Vi keys: h/j/k/l (no modifier)
  if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    if (e.key === 'k') return 'up';
    if (e.key === 'j') return 'down';
    if (e.key === 'h') return 'left';
    if (e.key === 'l') return 'right';
  }

  // Emacs keys: Ctrl+p/n/b/f
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    if (e.key === 'p') return 'up';
    if (e.key === 'n') return 'down';
    if (e.key === 'b') return 'left';
    if (e.key === 'f') return 'right';
  }

  return null;
}

/**
 * Format a hotkey string (e.g. "Mod+Shift+F") into a platform-specific display string.
 * macOS: "⌘⇧F"  Windows/Linux: "Ctrl+Shift+F"
 */
export function formatHotkey(hotkey: string): string {
  const tokens = hotkey.split('+');
  const resolved = tokens.map((key) => {
    switch (key) {
      case 'Mod': return MOD_KEY;
      case 'Shift': return SHIFT_KEY;
      case 'Alt': return ALT_KEY;
      case 'Ctrl': return CTRL_KEY;
      default: return key;
    }
  });
  return IS_MAC ? resolved.join('') : resolved.join('+');
}

/**
 * Returns true if the event target is an editable element (input, textarea, contenteditable).
 */
export function isEditableTarget(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement).tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
}
