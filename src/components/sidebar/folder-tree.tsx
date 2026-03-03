import { FileText, FolderPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useIMEGuard } from '@/hooks/use-ime-guard';
import { useNoteStore } from '@/stores/note-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { FolderItem } from './folder-item';
import { FolderTreeSkeleton } from './folder-tree-skeleton';

export function FolderTree() {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [foldersLoading, setFoldersLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const allNotesRef = useRef<HTMLButtonElement>(null);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();
  const loadFolders = useNoteStore((s) => s.loadFolders);
  const folders = useNoteStore((s) => s.folders);
  const selectFolder = useNoteStore((s) => s.selectFolder);
  const activeFolder = useNoteStore((s) => s.activeFolder);
  const moveNote = useNoteStore((s) => s.moveNote);
  const createFolder = useNoteStore((s) => s.createFolder);
  const section = useSidebarStore((s) => s.section);
  const isFolderSection = section === 'folders';

  const isAllNotesActive = isFolderSection && activeFolder === '';

  useEffect(() => {
    if (isAllNotesActive)
      allNotesRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isAllNotesActive]);

  const [rootDragOver, setRootDragOver] = useState(false);

  const refresh = () => {
    loadFolders();
  };

  const handleRootDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setRootDragOver(false);
      const notePath = e.dataTransfer.getData('text/plain');
      if (!notePath) return;
      try {
        await moveNote(notePath, '');
      } catch {
        toast.error(t('toast.noteMoveFailed'));
      }
    },
    [moveNote, t]
  );

  useEffect(() => {
    loadFolders().finally(() => setFoldersLoading(false));
  }, []);

  const handleSelect = (folder: string) => {
    useSidebarStore.getState().setSection('folders');
    selectFolder(folder);
  };

  const handleStartCreate = () => {
    setCreating(true);
    setNewName('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmitCreate = async () => {
    const name = newName.trim();
    setCreating(false);
    setNewName('');
    if (!name) return;
    try {
      await createFolder(name, null);
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'Enter') {
      handleSubmitCreate();
    } else if (e.key === 'Escape') {
      setCreating(false);
      setNewName('');
    }
  };

  if (foldersLoading) {
    return <FolderTreeSkeleton />;
  }

  return (
    <div className="space-y-0.5" role="listbox" aria-label="Folders">
      <button
        ref={allNotesRef}
        role="option"
        aria-selected={isAllNotesActive}
        className={`flex items-center gap-2 w-full h-7 px-2 rounded text-[13px] transition-colors duration-100 ${
          rootDragOver
            ? 'bg-primary/15 border border-primary/40'
            : isAllNotesActive
              ? 'bg-bg-hover text-accent font-medium'
              : 'text-text-secondary hover:bg-bg-hover'
        }`}
        onClick={() => handleSelect('')}
        onDragOver={(e) => {
          e.preventDefault();
          setRootDragOver(true);
        }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={handleRootDrop}
      >
        <FileText
          size={14}
          className={isAllNotesActive ? 'text-accent' : 'text-text-muted'}
        />
        {t('sidebar.allNotes')}
      </button>
      {folders.map((folder) => (
        <FolderItem
          key={folder.path}
          folder={folder}
          depth={0}
          activeFolder={isFolderSection ? activeFolder : ''}
          onSelect={handleSelect}
          onRefresh={refresh}
        />
      ))}
      {creating ? (
        <div className="px-1 py-1">
          <Input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onBlur={handleSubmitCreate}
            onKeyDown={handleCreateKeyDown}
            className="h-7 text-xs"
            placeholder={t('sidebar.folderNamePlaceholder')}
          />
        </div>
      ) : (
        <button
          className="flex items-center gap-2 w-full h-7 px-2 rounded text-[13px] text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors duration-100 mt-0.5"
          onClick={handleStartCreate}
        >
          <FolderPlus size={14} />
          {t('sidebar.newFolder')}
        </button>
      )}
    </div>
  );
}
