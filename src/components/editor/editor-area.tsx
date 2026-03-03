import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { EmptyState } from '../common/empty-state';
import { SettingsContent } from '../settings/settings-content';
import { Editor } from './editor';
import { EditorStatusFooter } from './editor-status-footer';

export function EditorArea() {
  const viewMode = useAppStore((s) => s.viewMode);

  if (viewMode === 'settings') {
    return <SettingsContent />;
  }

  return <NoteEditorArea />;
}

function NoteEditorArea() {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const createNote = useNoteStore((s) => s.createNote);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--editor-bg)' }}
    >
      {activeNote ? (
        <>
          <Editor />
          <EditorStatusFooter />
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title={t('emptyState.noNoteSelected')}
          description={t('emptyState.noNoteHint')}
          action={{
            label: t('emptyState.createNote'),
            onClick: () => createNote(),
          }}
          shortcut={['Mod', 'N']}
        />
      )}
    </div>
  );
}
