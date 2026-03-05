import { RotateCcw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatTimeAgo } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import type { TrashItem } from '../../types/note';

export function TrashModal() {
  const { t } = useTranslation();
  const trashOpen = useAppStore((s) => s.trashOpen);
  const toggleTrash = useAppStore((s) => s.toggleTrash);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const trashItems = useSidebarStore((s) => s.trashItems);
  const loadTrash = useSidebarStore((s) => s.loadTrash);
  const restoreNote = useSidebarStore((s) => s.restoreNote);
  const permanentlyDeleteTrash = useSidebarStore(
    (s) => s.permanentlyDeleteTrash
  );
  const emptyTrash = useSidebarStore((s) => s.emptyTrash);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    if (trashOpen) {
      setLoading(true);
      loadTrash().finally(() => setLoading(false));
    }
  }, [trashOpen, loadTrash]);

  useEffect(() => {
    setItems(trashItems);
  }, [trashItems]);

  const handleRestore = async (id: string) => {
    await restoreNote(id);
    await loadNotes();
  };

  const handlePermanentDelete = async (id: string) => {
    await permanentlyDeleteTrash(id);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
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
                <span className="text-xs text-text-muted">
                  {t('common.loading')}
                </span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Trash2 size={32} className="text-text-muted/30" />
                <span className="text-xs text-text-muted">
                  {t('sidebar.trashEmpty')}
                </span>
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
                        {t('trash.deleted', {
                          time: formatTimeAgo(item.deleted_at),
                        })}
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
