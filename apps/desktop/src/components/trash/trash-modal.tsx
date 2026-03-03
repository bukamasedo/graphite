import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import type { TrashItem } from '@graphite/shared';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatTimeAgo } from '@/lib/utils';

export function TrashModal() {
  const { t } = useTranslation();
  const trashOpen = useAppStore((s) => s.trashOpen);
  const toggleTrash = useAppStore((s) => s.toggleTrash);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const result = await invoke<TrashItem[]>('list_trash');
      setItems(result);
    } catch (e) {
      console.error('Failed to load trash:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trashOpen) loadTrash();
  }, [trashOpen]);

  const handleRestore = async (id: string) => {
    try {
      await invoke('restore_note', { id });
      setItems((prev) => prev.filter((i) => i.id !== id));
      await loadNotes();
      toast.success(t('toast.noteRestored'));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await invoke('permanently_delete_trash', { id });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success(t('toast.noteDeletedPermanently'));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await invoke('empty_trash');
      setItems([]);
      toast.success(t('toast.trashEmptied'));
    } catch (e) {
      toast.error(String(e));
    }
    setConfirmEmpty(false);
  };

  return (
    <>
      <Dialog open={trashOpen} onOpenChange={toggleTrash}>
        <DialogContent className="w-[560px] h-[480px] max-w-none p-0 gap-0 flex flex-col overflow-hidden [&>button:last-child]:hidden">
          <DialogTitle className="sr-only">{t('trash.title')}</DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Trash2 size={14} className="text-text-muted" />
              <span className="text-xs font-semibold text-text-primary">
                {t('trash.title')}
              </span>
              {items.length > 0 && (
                <span className="text-[10px] text-text-muted">
                  ({items.length})
                </span>
              )}
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmEmpty(true)}
              >
                {t('trash.emptyTrash')}
              </Button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-text-muted">{t('common.loading')}</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Trash2 size={32} className="text-text-muted/30" />
                <span className="text-xs text-text-muted">{t('sidebar.trashEmpty')}</span>
              </div>
            ) : (
              <div className="p-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-bg-hover/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-primary truncate">
                        {item.title}
                      </div>
                      {item.preview && (
                        <div className="text-[11px] text-text-muted truncate mt-0.5">
                          {item.preview}
                        </div>
                      )}
                      <div className="text-[10px] text-text-muted/70 mt-0.5">
                        {t('trash.deleted', { time: formatTimeAgo(item.deleted_at) })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6"
                        onClick={() => handleRestore(item.id)}
                        title={t('trash.restoreTooltip')}
                      >
                        <RotateCcw size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handlePermanentDelete(item.id)}
                        title={t('trash.deleteTooltip')}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
