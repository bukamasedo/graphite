import { useRef } from 'react';

/**
 * Handles IME composition guarding for both Chromium and WebKit (Tauri/macOS WKWebView).
 *
 * Event ordering differs by engine:
 *   Chromium: keydown (isComposing=true) → compositionend
 *   WebKit:   compositionend → keydown (isComposing=false)  ← the tricky case
 *
 * Strategy:
 *   - composingRef:      true while between compositionstart and compositionend
 *   - enterBlockedRef:   true if we already blocked an Enter keydown during composition
 *                        (means Chromium path; no need for pendingGuard after compositionend)
 *   - pendingGuardRef:   true if compositionend fired before any Enter keydown
 *                        (means WebKit path; block the very next keydown)
 */
export function useIMEGuard() {
  const composingRef = useRef(false);
  const enterBlockedRef = useRef(false);
  const pendingGuardRef = useRef(false);

  const onCompositionStart = () => {
    composingRef.current = true;
    enterBlockedRef.current = false;
    pendingGuardRef.current = false;
  };

  const onCompositionEnd = () => {
    composingRef.current = false;
    if (!enterBlockedRef.current) {
      // WebKit path: the confirming Enter keydown hasn't arrived yet
      pendingGuardRef.current = true;
    }
    enterBlockedRef.current = false;
  };

  /**
   * Call at the top of onKeyDown handlers.
   * Returns true if the event should be suppressed (IME composition in progress or just finished).
   */
  const isComposing = (key: string): boolean => {
    if (composingRef.current) {
      if (key === 'Enter') enterBlockedRef.current = true;
      return true;
    }
    if (pendingGuardRef.current) {
      pendingGuardRef.current = false;
      return true;
    }
    return false;
  };

  return { onCompositionStart, onCompositionEnd, isComposing };
}
