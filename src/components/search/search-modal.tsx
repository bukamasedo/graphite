import { Loader2, Search, SearchX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useIMEGuard } from '@/hooks/use-ime-guard';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { useSearchStore } from '@/stores/search-store';

export function SearchModal() {
  const { t } = useTranslation();
  const searchOpen = useAppStore((s) => s.searchOpen);
  const toggleSearch = useAppStore((s) => s.toggleSearch);
  const { query, results, loading, setQuery, search, clear } = useSearchStore();
  const selectNote = useNoteStore((s) => s.selectNote);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => {
      clearTimeout(timerRef.current);
      clear();
    };
  }, [searchOpen]);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 200);
  };

  const handleSelect = (path: string) => {
    selectNote(path);
    toggleSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx].path);
    }
  };

  return (
    <Dialog open={searchOpen} onOpenChange={toggleSearch}>
      <DialogContent className="max-w-[560px] max-h-[60vh] p-0 gap-0 top-[15vh] translate-y-0 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{t('search.title')}</DialogTitle>
        <div className="flex items-center px-4 border-b border-border">
          <Search size={16} className="text-text-muted mr-2 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-text-primary placeholder:text-text-muted"
          />
          {loading && (
            <Loader2 size={14} className="animate-spin text-text-muted" />
          )}
        </div>
        <div className="overflow-y-auto max-h-[50vh]">
          {results.map((result, idx) => (
            <div
              key={result.path}
              className={`px-4 py-2.5 cursor-pointer transition-colors ${
                idx === selectedIdx ? 'bg-bg-active' : 'hover:bg-bg-hover'
              }`}
              onClick={() => handleSelect(result.path)}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              <div className="text-sm text-text-primary font-medium">
                {result.title}
              </div>
              {result.matches
                .slice(0, 2)
                .map((match: { line: number; content: string }, mi: number) => (
                  <div
                    key={mi}
                    className="text-xs text-text-secondary mt-0.5 truncate"
                  >
                    <span className="text-text-muted mr-1">L{match.line}:</span>
                    {match.content}
                  </div>
                ))}
            </div>
          ))}
          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <SearchX size={28} className="text-text-muted/30" />
              <div className="text-sm text-text-muted">
                {t('emptyState.noResults')}
              </div>
              <div className="text-xs text-text-muted/60">
                {t('emptyState.tryDifferentQuery')}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
