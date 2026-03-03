import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIMEGuard } from '@/hooks/use-ime-guard';
import { translateError } from '@/i18n/translate-error';
import { useEditorStore } from '@/stores/editor-store';
import { useNoteStore } from '@/stores/note-store';
import { useSettingsStore } from '@/stores/settings-store';

export function InlineTitle() {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const renameNote = useNoteStore((s) => s.renameNote);
  const setActiveNoteTitle = useNoteStore((s) => s.setActiveNoteTitle);
  const isTrash = useNoteStore((s) => s.activeTrashGroup) !== null;
  const settings = useSettingsStore((s) => s.settings);
  const [value, setValue] = useState(activeNote?.title ?? '');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // key={activeNote.path} causes remount, so these are always for the correct note
  const pathRef = useRef(activeNote?.path);
  const titleRef = useRef(activeNote?.title ?? '');
  // Prevents onBlur from triggering save after Escape
  const skipBlurSaveRef = useRef(false);
  // Prevents re-entrant save (Enter + blur race)
  const savingRef = useRef(false);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();

  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('graphite:focus-title', handler);
    return () => document.removeEventListener('graphite:focus-title', handler);
  }, []);

  const revert = () => {
    setValue(titleRef.current);
    // Only update store if this note is still active (prevents post-unmount pollution)
    if (useNoteStore.getState().activeNote?.path === pathRef.current) {
      setActiveNoteTitle(titleRef.current);
    }
  };

  const save = async () => {
    if (savingRef.current) return;
    const newTitle = value.trim();
    if (!newTitle) {
      revert();
      return;
    }
    if (newTitle === titleRef.current) return;
    const path = pathRef.current;
    if (!path) return;
    setError('');
    savingRef.current = true;
    try {
      await renameNote(path, newTitle);
      titleRef.current = newTitle;
    } catch (e) {
      const msg = String(e);
      console.error('Rename failed:', msg);
      setError(translateError(e));
      revert();
    } finally {
      savingRef.current = false;
    }
  };

  const handleBlur = () => {
    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      return;
    }
    save();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    setActiveNoteTitle(newVal);
    setError('');
    skipBlurSaveRef.current = false;
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      skipBlurSaveRef.current = true;
      await save();
      setTimeout(() => {
        useEditorStore.getState().editor?.commands.focus('start');
      }, 0);
    } else if (e.key === 'Escape') {
      skipBlurSaveRef.current = true;
      revert();
      setError('');
      inputRef.current?.blur();
    }
  };

  if (!activeNote) return null;

  return (
    <div className="px-6" style={{ marginTop: 24, marginBottom: 16 }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        readOnly={isTrash}
        className={`w-full bg-transparent text-text-primary font-semibold outline-none placeholder-text-muted ${isTrash ? 'cursor-default' : ''}`}
        style={{
          fontSize: settings.fontSize * 2,
          fontFamily: settings.editorFontFamily,
          lineHeight: 1.25,
        }}
        placeholder={t('editor.untitled')}
        spellCheck={false}
      />
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  );
}
