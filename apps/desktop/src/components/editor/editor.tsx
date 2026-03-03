import { useCallback } from 'react';
import { useNoteStore } from '@/stores/note-store';
import { TiptapEditor } from './tiptap-editor';
import { InlineTitle } from './inline-title';

export function Editor() {
  const activeNote = useNoteStore((s) => s.activeNote);
  const saveNote = useNoteStore((s) => s.saveNote);
  const activeTrashGroup = useNoteStore((s) => s.activeTrashGroup);

  const handleSave = useCallback(
    (content: string) => saveNote(activeNote!.path, content),
    [activeNote?.path, saveNote],
  );

  if (!activeNote) return null;

  const isTrash = activeTrashGroup !== null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-[800px]">
          <InlineTitle key={`title-${activeNote.path}`} />
          <TiptapEditor
            key={`editor-${activeNote.path}`}
            initialContent={activeNote.content}
            onSave={handleSave}
            readOnly={isTrash}
          />
        </div>
      </div>
    </div>
  );
}
