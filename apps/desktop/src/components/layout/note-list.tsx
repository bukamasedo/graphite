import { useTranslation } from 'react-i18next';
import { useNoteStore } from '@/stores/note-store';
import { NoteListItem } from '../notelist/note-list-item';
import { NoteListHeader } from '../notelist/note-list-header';
import { NoteListSkeleton } from '../notelist/note-list-skeleton';
import { EmptyState } from '../common/empty-state';
import { FileText } from 'lucide-react';

export function NoteList() {
  const { t } = useTranslation();
  const notes = useNoteStore((s) => s.notes);
  const loading = useNoteStore((s) => s.loading);
  const createNote = useNoteStore((s) => s.createNote);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--notelist-bg)',
      }}
    >
      <NoteListHeader />
      <div className="flex-1 overflow-y-auto p-1" role="listbox" aria-label={t('commandPalette.notes')}>
        {loading ? (
          <NoteListSkeleton />
        ) : notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('emptyState.noNotes')}
            description={t('emptyState.noNoteHint')}
            action={{
              label: t('emptyState.newNote'),
              onClick: () => createNote(),
            }}
            shortcut={['Mod', 'N']}
          />
        ) : (
          notes.map((note) => <NoteListItem key={note.path} note={note} />)
        )}
      </div>
    </div>
  );
}
