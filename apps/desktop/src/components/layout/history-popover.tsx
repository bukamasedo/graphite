import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore } from '@/stores/history-store';
import { useNoteStore } from '@/stores/note-store';
import { useAppStore } from '@/stores/app-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText } from 'lucide-react';

function extractDisplayInfo(path: string) {
  const withoutExt = path.replace(/\.md$/, '');
  const parts = withoutExt.split('/');
  const title = parts[parts.length - 1] || path;
  const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  return { title, folder };
}

export function HistoryPopover({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const entries = useHistoryStore((s) => s.getEntries());
  const cursor = useHistoryStore((s) => s.cursor);
  const historyOpen = useAppStore((s) => s.historyOpen);
  const toggleHistory = useAppStore((s) => s.toggleHistory);
  const navigateToHistory = useNoteStore((s) => s.navigateToHistory);
  const [focusIndex, setFocusIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Show most recent first, limit to 6
  const displayEntries = entries
    .map((path, index) => ({ path, index }))
    .reverse()
    .slice(0, 6);

  // Reset focus when popover opens
  useEffect(() => {
    if (historyOpen) setFocusIndex(0);
  }, [historyOpen]);

  const handleSelect = useCallback((path: string, index: number) => {
    useHistoryStore.setState({ cursor: index });
    navigateToHistory(path);
    toggleHistory();
  }, [navigateToHistory, toggleHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (displayEntries.length === 0) return;
    const len = displayEntries.length;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((i) => (i + 1) % len);
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((i) => (i - 1 + len) % len);
        break;
      case 'Enter': {
        e.preventDefault();
        const entry = displayEntries[focusIndex];
        if (entry) handleSelect(entry.path, entry.index);
        break;
      }
      case 'Escape':
        // Let Radix handle closing via onOpenChange
        break;
    }
  }, [displayEntries, focusIndex, handleSelect, toggleHistory]);

  // Scroll focused item into view
  useEffect(() => {
    const el = listRef.current?.children[focusIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex]);

  return (
    <Popover
      open={historyOpen}
      onOpenChange={(open) => {
        if (open !== useAppStore.getState().historyOpen) toggleHistory();
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="max-w-96 py-0 px-1" onKeyDown={handleKeyDown}>
        {displayEntries.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-text-muted">
            {t('history.noHistory')}
          </div>
        ) : (
          <div className="py-1" ref={listRef}>
            {displayEntries.map(({ path, index }, i) => {
              const { title, folder } = extractDisplayInfo(path);
              const isCurrent = index === cursor;
              const isFocused = i === focusIndex;
              return (
                <button
                  key={`${index}-${path}`}
                  onClick={() => handleSelect(path, index)}
                  className={`w-full flex rounded-md items-center gap-2 px-3 py-1.5 text-left transition-colors focus:outline-none ${
                    isFocused ? 'bg-bg-hover' : ''
                  }`}
                >
                  <FileText size={14} className="shrink-0 text-text-muted" />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs truncate ${isCurrent ? 'text-accent-blue font-medium' : 'text-text-primary'}`}
                    >
                      {title}
                    </div>
                    {folder && <div className="text-[10px] text-text-muted truncate">{folder}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
