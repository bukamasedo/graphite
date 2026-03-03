import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';

export function NoteListHeader() {
  const { t } = useTranslation();
  const createNote = useNoteStore((s) => s.createNote);
  const toggleSearch = useAppStore((s) => s.toggleSearch);
  const activeFolder = useNoteStore((s) => s.activeFolder);
  const activeTag = useNoteStore((s) => s.activeTag);
  const activeTrashGroup = useNoteStore((s) => s.activeTrashGroup);

  const isTrashView = activeTrashGroup !== null;

  const folderName = isTrashView
    ? activeTrashGroup
      ? t('trash.trashFolder', { name: activeTrashGroup.split('/').pop() })
      : t('trash.trashAllNotes')
    : activeTag
      ? `#${activeTag}`
      : activeFolder
        ? activeFolder.split('/').pop() || t('commandPalette.notes')
        : t('sidebar.allNotes');

  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ minHeight: 40 }}
    >
      <span className="text-[13px] font-medium text-text-primary">
        {folderName}
      </span>
      {!isTrashView && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={toggleSearch}>
                <Search size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('noteList.search')} <Shortcut keys={['Mod', 'Shift', 'F']} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => createNote()}
              >
                <Plus size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('noteList.newNote')} <Shortcut keys={['Mod', 'N']} />
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
