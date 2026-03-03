import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useNoteStore } from '@/stores/note-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { Pin } from 'lucide-react';
import type { NoteListItem as NoteListItemType } from '@graphite/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { showNativeContextMenu } from '@/lib/native-context-menu';
import { exportNote, type ExportFormat } from '@/lib/export';
import { formatTimeAgo } from '@/lib/utils';

interface Props {
  note: NoteListItemType;
}

export function NoteListItem({ note }: Props) {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const selectNote = useNoteStore((s) => s.selectNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const pinNote = useNoteStore((s) => s.pinNote);
  const renameNote = useNoteStore((s) => s.renameNote);
  const activeTrashGroup = useNoteStore((s) => s.activeTrashGroup);
  const selectTrashNote = useNoteStore((s) => s.selectTrashNote);
  const loadTrash = useSidebarStore((s) => s.loadTrash);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadFolders = useNoteStore((s) => s.loadFolders);
  const isTrashView = activeTrashGroup !== null;
  const isActive = isTrashView ? activeNote?.id === note.id : activeNote?.path === note.path;
  const itemRef = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isActive) itemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isActive]);

  useEffect(() => {
    if (renaming) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [renaming]);

  const handlePin = async () => {
    try {
      await pinNote(note.path, !note.pinned);
    } catch (e) {
      console.error('Failed to pin note:', e);
    }
  };

  const handleStartRename = () => {
    setRenameValue(note.title);
    setRenaming(true);
  };

  const handleSubmitRename = async () => {
    const newTitle = renameValue.trim();
    setRenaming(false);
    if (!newTitle || newTitle === note.title) return;
    try {
      await renameNote(note.path, newTitle);
    } catch (e) {
      console.error('Failed to rename note:', e);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitRename();
    } else if (e.key === 'Escape') {
      setRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmingDelete(false);
    if (isTrashView) {
      try {
        await invoke('permanently_delete_trash', { id: note.id });
        await loadTrash();
        // Re-select the group to refresh the note list
        const group = useNoteStore.getState().activeTrashGroup;
        if (group !== null) {
          useNoteStore.getState().selectTrashGroup(group);
        }
        toast.success(t('toast.noteDeletedPermanently'));
      } catch (e) {
        toast.error(String(e));
      }
      return;
    }
    try {
      await deleteNote(note.path);
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const handleTrashRestore = async () => {
    try {
      await invoke('restore_note', { id: note.id });
      await loadTrash();
      await loadNotes();
      await loadFolders();
      // Re-select the group to refresh the note list
      const group = useNoteStore.getState().activeTrashGroup;
      if (group !== null) {
        useNoteStore.getState().selectTrashGroup(group);
      }
      toast.success(t('toast.noteRestored'));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      const data = await invoke<{ content: string }>('read_note', { path: note.path });
      const exported = await exportNote(note.title, data.content, format);
      if (exported) {
        toast.success(t('toast.exported'));
      }
    } catch {
      toast.error(t('toast.exportFailed'));
    }
  };

  const timeAgo = formatTimeAgo(note.modified);

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isTrashView) {
      await showNativeContextMenu([
        { id: 'restore', text: t('common.restore'), action: handleTrashRestore },
        { separator: true },
        { id: 'delete', text: t('trash.deletePermanently'), action: () => setConfirmingDelete(true) },
      ]);
      return;
    }
    await showNativeContextMenu([
      { id: 'pin', text: note.pinned ? t('contextMenu.unpin') : t('contextMenu.pin'), accelerator: 'CmdOrCtrl+Shift+P', action: () => handlePin() },
      { id: 'rename', text: t('common.rename'), accelerator: 'Return', action: () => handleStartRename() },
      { separator: true },
      { id: 'export-md', text: t('contextMenu.exportMarkdown'), action: () => handleExport('markdown') },
      { id: 'export-html', text: t('contextMenu.exportHTML'), action: () => handleExport('html') },
      { separator: true },
      { id: 'delete', text: t('common.delete'), accelerator: 'CmdOrCtrl+Backspace', action: () => setConfirmingDelete(true) },
    ]);
  };

  const handleClick = () => {
    if (isTrashView) {
      selectTrashNote(note.id);
    } else {
      selectNote(note.path);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isTrashView) return;
    e.dataTransfer.setData('text/plain', note.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <div
        ref={itemRef}
        role="option"
        aria-selected={isActive}
        draggable={!isTrashView}
        onDragStart={handleDragStart}
        className={`group px-3 py-2 mx-1 rounded-md cursor-pointer transition-colors duration-75 ${
          isActive
            ? 'bg-white/[0.06]'
            : 'hover:bg-white/[0.03]'
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center justify-between mb-0.5">
          {renaming ? (
            <input
              ref={renameRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleSubmitRename}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-bg-secondary text-text-primary text-xs font-medium px-2 py-0.5 rounded-md border border-primary outline-none min-w-0"
            />
          ) : (
            <>
              <span className="text-[13px] font-medium text-text-primary truncate">
                {note.title}
              </span>
              {!isTrashView && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={`flex-shrink-0 h-5 w-5 ${
                    note.pinned
                      ? 'text-primary opacity-100'
                      : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pinNote(note.path, !note.pinned);
                  }}
                  title={note.pinned ? t('contextMenu.unpin') : t('contextMenu.pin')}
                >
                  <Pin size={11} />
                </Button>
              )}
            </>
          )}
        </div>
        <div className="text-[12px] text-text-secondary truncate">{note.preview || t('noteList.emptyNote')}</div>
        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
          <span className="text-[10px] text-text-muted flex-shrink-0">{timeAgo}</span>
          {note.tags.slice(0, 2).map((t: string) => (
            <Badge key={t} variant="default" className="text-[10px] px-1.5 py-0 h-4 truncate max-w-[80px]">
              {t}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className="text-[9px] text-text-muted flex-shrink-0">+{note.tags.length - 2}</span>
          )}
        </div>
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isTrashView ? t('dialog.deleteNotePermanentlyTitle', { title: note.title }) : t('dialog.deleteNoteTitle', { title: note.title })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.cannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>{isTrashView ? t('trash.deletePermanently') : t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

