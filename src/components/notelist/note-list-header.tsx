import { ArrowUpDown, Check, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/kbd';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/stores/app-store';
import { type SortKey, useNoteStore } from '@/stores/note-store';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'modified', label: 'noteList.sortModified' },
  { key: 'created', label: 'noteList.sortCreated' },
  { key: 'title', label: 'noteList.sortTitle' },
];

export function NoteListHeader() {
  const { t } = useTranslation();
  const createNote = useNoteStore((s) => s.createNote);
  const toggleSearch = useAppStore((s) => s.toggleSearch);
  const activeFolder = useNoteStore((s) => s.activeFolder);
  const activeTag = useNoteStore((s) => s.activeTag);
  const activeTrashGroup = useNoteStore((s) => s.activeTrashGroup);
  const sortKey = useNoteStore((s) => s.sortKey);
  const setSortKey = useNoteStore((s) => s.setSortKey);
  const [sortOpen, setSortOpen] = useState(false);

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
      <span className="text-[13px] font-medium text-text-primary truncate min-w-0">
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
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <ArrowUpDown size={14} />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('noteList.sort')}</TooltipContent>
            </Tooltip>
            <PopoverContent
              align="end"
              className="w-40 p-1"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {sortOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-text-secondary hover:bg-bg-active transition-colors cursor-pointer"
                  onClick={() => {
                    setSortKey(opt.key);
                    setSortOpen(false);
                  }}
                >
                  <Check
                    size={12}
                    className={
                      sortKey === opt.key ? 'opacity-100' : 'opacity-0'
                    }
                  />
                  {t(opt.label)}
                </button>
              ))}
            </PopoverContent>
          </Popover>
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
