import { FileText, Folder } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { showNativeContextMenu } from '@/lib/native-context-menu';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { computeTrashGroups, useSidebarStore } from '@/stores/sidebar-store';

export function TrashList() {
  const { t } = useTranslation();
  const items = useSidebarStore((s) => s.trashItems);
  const loadTrash = useSidebarStore((s) => s.loadTrash);
  const restoreNote = useSidebarStore((s) => s.restoreNote);
  const permanentlyDeleteTrash = useSidebarStore(
    (s) => s.permanentlyDeleteTrash
  );
  const emptyTrash = useSidebarStore((s) => s.emptyTrash);
  const section = useSidebarStore((s) => s.section);
  const activeIndex = useSidebarStore((s) => s.activeTrashIndex);
  const setSection = useSidebarStore((s) => s.setSection);
  const setActiveTrashIndex = useSidebarStore((s) => s.setActiveTrashIndex);
  const focusedPanel = useAppStore((s) => s.focusedPanel);
  const vaultPath = useAppStore((s) => s.vaultPath);
  const selectTrashGroup = useNoteStore((s) => s.selectTrashGroup);

  const activeRef = useRef<HTMLDivElement>(null);

  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(
    null
  );
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadFolders = useNoteStore((s) => s.loadFolders);
  const _notes = useNoteStore((s) => s.notes);

  const groups = useMemo(
    () => computeTrashGroups(items, vaultPath),
    [items, vaultPath]
  );

  useEffect(() => {
    if (section === 'trash')
      activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [section]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Listen for restore/delete events from keyboard shortcuts
  useEffect(() => {
    const handleRestore = async () => {
      if (
        section !== 'trash' ||
        activeIndex < 0 ||
        activeIndex >= groups.length
      )
        return;
      const group = groups[activeIndex];
      for (const item of group.items) {
        await restoreNote(item.id);
      }
      await loadNotes();
      await loadFolders();
    };

    const handleDelete = () => {
      if (
        section !== 'trash' ||
        activeIndex < 0 ||
        activeIndex >= groups.length
      )
        return;
      setConfirmDeleteGroup(groups[activeIndex].folder);
    };

    document.addEventListener('graphite:restore-trash', handleRestore);
    document.addEventListener(
      'graphite:delete-trash-permanently',
      handleDelete
    );
    return () => {
      document.removeEventListener('graphite:restore-trash', handleRestore);
      document.removeEventListener(
        'graphite:delete-trash-permanently',
        handleDelete
      );
    };
  }, [section, activeIndex, groups, loadFolders, loadNotes, restoreNote]);

  const handleRestoreGroup = async (groupFolder: string) => {
    const group = groups.find((g) => g.folder === groupFolder);
    if (!group) return;
    for (const item of group.items) {
      await restoreNote(item.id);
    }
    await loadNotes();
    await loadFolders();
  };

  const handleDeleteGroup = async (groupFolder: string) => {
    const group = groups.find((g) => g.folder === groupFolder);
    if (!group) return;
    for (const item of group.items) {
      await permanentlyDeleteTrash(item.id);
    }
    setConfirmDeleteGroup(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setConfirmEmpty(false);
  };

  const handleGroupContextMenu = async (
    e: React.MouseEvent,
    group: (typeof groups)[0]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    await showNativeContextMenu([
      {
        id: 'restore',
        text: t('trash.restoreAll'),
        accelerator: 'Return',
        action: () => handleRestoreGroup(group.folder),
      },
      { separator: true },
      {
        id: 'delete',
        text: t('trash.deleteAllPermanently'),
        accelerator: 'CmdOrCtrl+Backspace',
        action: () => setConfirmDeleteGroup(group.folder),
      },
    ]);
  };

  const handleSectionContextMenu = async (e: React.MouseEvent) => {
    if (items.length === 0) return;
    e.preventDefault();
    await showNativeContextMenu([
      {
        id: 'empty',
        text: t('trash.emptyTrash'),
        action: () => setConfirmEmpty(true),
      },
    ]);
  };

  const handleClick = (index: number) => {
    setSection('trash');
    setActiveTrashIndex(index);
    selectTrashGroup(groups[index].folder);
  };

  const isGroupActive = (index: number) =>
    focusedPanel === 'sidebar' && section === 'trash' && activeIndex === index;

  if (items.length === 0) {
    return (
      <div className="px-2 py-2">
        <span className="text-text-muted text-[12px]">
          {t('emptyState.trashEmpty')}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className="space-y-0.5"
        role="listbox"
        aria-label="Trash"
        onContextMenu={handleSectionContextMenu}
      >
        {groups.map((group, index) => (
          // biome-ignore lint/a11y/useFocusableInteractive: keyboard navigation handled at list level
          // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard navigation handled at list level
          <div
            key={group.folder === '' ? '__all__' : group.folder}
            ref={isGroupActive(index) ? activeRef : undefined}
            role="option"
            aria-selected={isGroupActive(index)}
            className={`flex items-center gap-2 h-7 px-2 rounded text-[13px] cursor-default transition-colors duration-100 ${
              isGroupActive(index)
                ? 'bg-bg-hover text-accent font-medium'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            onClick={() => handleClick(index)}
            onContextMenu={(e) => handleGroupContextMenu(e, group)}
          >
            {group.folder === '' ? (
              <FileText
                size={14}
                className={`flex-shrink-0 ${isGroupActive(index) ? 'text-accent' : 'text-text-muted'}`}
              />
            ) : (
              <Folder
                size={14}
                className={`flex-shrink-0 ${isGroupActive(index) ? 'text-accent' : 'text-text-muted'}`}
              />
            )}
            <span className="truncate flex-1 min-w-0">
              {group.folder === '' ? t('sidebar.allNotes') : group.label}
            </span>
            <span
              className={`text-[10px] flex-shrink-0 min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center ${
                isGroupActive(index)
                  ? 'bg-accent/20 text-accent'
                  : 'text-text-muted'
              }`}
            >
              {group.count}
            </span>
          </div>
        ))}
      </div>

      <AlertDialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trash.emptyConfirmTitle')}</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-xs text-text-muted">
            {t('trash.emptyConfirmMessage', { count: items.length })}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash}>
              {t('trash.emptyTrash')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeleteGroup !== null}
        onOpenChange={() => setConfirmDeleteGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('trash.deleteGroupConfirmTitle')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-xs text-text-muted">
            {t('trash.deleteGroupConfirmMessage')}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDeleteGroup !== null &&
                handleDeleteGroup(confirmDeleteGroup)
              }
            >
              {t('trash.deletePermanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
