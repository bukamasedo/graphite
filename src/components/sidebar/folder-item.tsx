import { ChevronDown, ChevronRight, Folder as FolderIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIMEGuard } from '@/hooks/use-ime-guard';
import { showNativeContextMenu } from '@/lib/native-context-menu';
import { useNoteStore } from '@/stores/note-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import type { Folder } from '../../types/note';

interface FolderItemProps {
  folder: Folder;
  depth: number;
  activeFolder: string;
  onSelect: (path: string) => void;
  onRefresh: () => void;
}

export function FolderItem({
  folder,
  depth,
  activeFolder,
  onSelect,
  onRefresh,
}: FolderItemProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();
  const isActive = activeFolder === folder.path;
  const hasChildren = folder.children.length > 0;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const moveNote = useNoteStore((s) => s.moveNote);
  const deleteFolder = useNoteStore((s) => s.deleteFolder);
  const renameFolder = useNoteStore((s) => s.renameFolder);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const notePath = e.dataTransfer.getData('text/plain');
    if (!notePath) return;
    try {
      await moveNote(notePath, folder.path);
    } catch {
      toast.error(t('toast.noteMoveFailed'));
    }
  };

  useEffect(() => {
    if (isActive) itemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isActive]);

  useEffect(() => {
    if (renaming) {
      renameRef.current?.focus();
      renameRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!isActive) return;
    const handleRename = () => {
      setRenameValue(folder.name);
      setRenaming(true);
    };
    const handleDelete = () => setConfirmingDelete(true);
    document.addEventListener('graphite:rename-folder', handleRename);
    document.addEventListener('graphite:delete-folder', handleDelete);
    return () => {
      document.removeEventListener('graphite:rename-folder', handleRename);
      document.removeEventListener('graphite:delete-folder', handleDelete);
    };
  }, [isActive, folder.name]);

  const handleConfirmDelete = async () => {
    setConfirmingDelete(false);
    try {
      await deleteFolder(folder.path);
      onRefresh();
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleStartRename = () => {
    setRenameValue(folder.name);
    setRenaming(true);
  };

  const handleSubmitRename = async () => {
    const newName = renameValue.trim();
    setRenaming(false);
    if (!newName || newName === folder.name) return;
    try {
      await renameFolder(folder.path, newName);
      onRefresh();
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'Enter') {
      handleSubmitRename();
    } else if (e.key === 'Escape') {
      setRenaming(false);
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    await showNativeContextMenu([
      {
        id: 'rename',
        text: t('common.rename'),
        accelerator: 'Return',
        action: () => handleStartRename(),
      },
      { separator: true },
      {
        id: 'delete',
        text: t('common.delete'),
        accelerator: 'CmdOrCtrl+Backspace',
        action: () => setConfirmingDelete(true),
      },
    ]);
  };

  return (
    <div>
      <div
        ref={itemRef}
        role="option"
        aria-selected={isActive}
        className={`flex items-center gap-2 h-7 px-2 rounded text-[13px] cursor-pointer transition-colors duration-100 ${
          dragOver
            ? 'bg-primary/15 border border-primary/40'
            : isActive
              ? 'bg-bg-hover text-accent font-medium'
              : 'text-text-secondary hover:bg-bg-hover'
        }`}
        style={
          depth > 0 ? { paddingLeft: `${0.5 + depth * 0.875}rem` } : undefined
        }
        onClick={() => onSelect(folder.path)}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <span
            className="-mr-1 text-text-muted hover:text-text-secondary transition-colors duration-100"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
        <FolderIcon
          size={14}
          className={`flex-shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`}
        />
        {renaming ? (
          <input
            ref={renameRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onBlur={handleSubmitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-bg-secondary text-text-primary text-xs px-1.5 py-0 rounded-md border border-primary outline-none min-w-0"
          />
        ) : (
          <>
            <span className="truncate flex-1 min-w-0">{folder.name}</span>
            {folder.noteCount > 0 && (
              <span
                className={`text-[10px] flex-shrink-0 min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center ${
                  isActive ? 'bg-accent/20 text-accent' : 'text-text-muted'
                }`}
              >
                {folder.noteCount}
              </span>
            )}
          </>
        )}
      </div>
      {expanded &&
        folder.children.map((child: Folder) => (
          <FolderItem
            key={child.path}
            folder={child}
            depth={depth + 1}
            activeFolder={activeFolder}
            onSelect={onSelect}
            onRefresh={onRefresh}
          />
        ))}

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialog.deleteFolderTitle', { name: folder.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.deleteFolderMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
