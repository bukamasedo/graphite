import { Plus, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIMEGuard } from '@/hooks/use-ime-guard';
import { useNoteStore } from '@/stores/note-store';

interface TagEditorProps {
  className?: string;
}

export function TagEditor({ className }: TagEditorProps = {}) {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const updateTags = useNoteStore((s) => s.updateTags);
  const isTrash = useNoteStore((s) => s.activeTrashGroup) !== null;
  const [inputValue, setInputValue] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();

  const addTag = useCallback(
    (raw: string) => {
      if (!activeNote) return;
      const tag = raw.trim().toLowerCase().replace(/^#/, '');
      if (!tag || activeNote.tags.includes(tag)) {
        setInputValue('');
        return;
      }
      updateTags(activeNote.path, [...activeNote.tags, tag]);
      setInputValue('');
    },
    [activeNote, updateTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      if (!activeNote) return;
      updateTags(
        activeNote.path,
        activeNote.tags.filter((t) => t !== tag)
      );
    },
    [activeNote, updateTags]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (
      e.key === 'Backspace' &&
      !inputValue &&
      activeNote?.tags.length
    ) {
      removeTag(activeNote.tags[activeNote.tags.length - 1]);
    } else if (e.key === 'Escape') {
      setInputValue('');
      setEditing(false);
      inputRef.current?.blur();
    }
  };

  if (!activeNote) return null;

  return (
    <div
      className={
        className ??
        'px-12 pb-2 flex-shrink-0 flex flex-wrap items-center gap-1.5'
      }
    >
      {activeNote.tags.map((tag) => (
        <Badge
          key={tag}
          variant="default"
          className={`max-w-full truncate ${isTrash ? '' : 'gap-1 pr-1'}`}
        >
          <span className="truncate">#{tag}</span>
          {!isTrash && (
            <button
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </Badge>
      ))}
      {!isTrash &&
        (editing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue);
              setEditing(false);
            }}
            placeholder={t('editor.addTagPlaceholder')}
            autoFocus
            className="bg-transparent outline-none text-[11px] text-text-secondary placeholder:text-text-muted w-20"
          />
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-[11px] text-text-muted hover:text-text-secondary gap-1 w-auto px-1.5 h-5 rounded-full"
            onClick={() => setEditing(true)}
          >
            <Plus size={10} />
            {activeNote.tags.length === 0 && t('editor.addTag')}
          </Button>
        ))}
    </div>
  );
}
