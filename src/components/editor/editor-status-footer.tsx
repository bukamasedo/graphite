import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/stores/editor-store';
import { useNoteStore } from '@/stores/note-store';

export function EditorStatusFooter() {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const { lineNumber, column, wordCount, charCount, dirty } = useEditorStore();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!dirty && activeNote) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [dirty, activeNote]);

  if (!activeNote) return null;

  return (
    <div
      className="flex items-center justify-end px-3 text-[11px] text-text-muted/70 select-none flex-shrink-0"
      style={{ height: 28 }}
    >
      <div className="flex items-center gap-3">
        {showSaved && (
          <span className="flex items-center gap-1 text-green-400">
            <Check size={11} />
            {t('statusBar.saved')}
          </span>
        )}
        <span>{t('statusBar.words', { count: wordCount })}</span>
        <span>{t('statusBar.chars', { count: charCount })}</span>
        <span>{t('statusBar.lineCol', { line: lineNumber, col: column })}</span>
      </div>
    </div>
  );
}
