import { cn } from "@/lib/utils";
import { MOD_KEY, SHIFT_KEY, ALT_KEY, CTRL_KEY } from "@/lib/platform";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[1.25em] h-[18px] border border-border/60 bg-bg-secondary/80 px-1 rounded text-[11px] text-text-secondary font-sans shadow-[0_1px_0_0_rgba(0,0,0,0.15)]",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

/**
 * Resolve symbolic key names to platform-specific display strings.
 *
 * Supported tokens:
 * - "Mod" → ⌘ (macOS) / Ctrl (Windows)
 * - "Shift" → ⇧ (macOS) / Shift (Windows)
 * - "Alt" → ⌥ (macOS) / Alt (Windows)
 * - "Ctrl" → ⌃ (macOS) / Ctrl (Windows)
 * - Any other string is passed through as-is (e.g. "1", "N", "\\")
 */
function resolveKey(key: string): string {
  switch (key) {
    case 'Mod': return MOD_KEY;
    case 'Shift': return SHIFT_KEY;
    case 'Alt': return ALT_KEY;
    case 'Ctrl': return CTRL_KEY;
    case 'Escape': return 'Esc';
    case 'Backspace': return '⌫';
    default: return key;
  }
}

interface ShortcutProps {
  /** Key tokens: ["Mod", "Shift", "F"] → "⌘⇧F" on macOS, "Ctrl+Shift+F" on Windows */
  keys: string[];
  className?: string;
}

export function Shortcut({ keys, className }: ShortcutProps) {
  const resolved = keys.map(resolveKey);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {resolved.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded border border-white/[0.08] bg-white/[0.04] text-[11px] text-text-muted font-sans"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
