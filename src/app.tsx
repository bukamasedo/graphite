import { listen } from '@tauri-apps/api/event';
import { check } from '@tauri-apps/plugin-updater';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { syncNativeMenu } from '@/i18n/sync-menu';
import { trashApi } from '@/lib/api/trash-api';
import { CheatSheetModal } from './components/cheat-sheet/cheat-sheet-modal';
import { AppLayout } from './components/layout/app-layout';
import { OnboardingModal } from './components/onboarding/onboarding-modal';
import { TrashModal } from './components/trash/trash-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { UpdateToast } from './components/update-toast';
import { useCommandHotkeys } from './hooks/use-command-hotkeys';
import { useCustomCSS } from './hooks/use-custom-css';
import { usePanelNavigation } from './hooks/use-panel-navigation';
import { zoomApi } from './lib/api/zoom-api';
import { setupDefaultCommands } from './lib/commands/default-commands';
import {
  commandRegistry,
  isCommandAllowedInPanel,
} from './lib/commands/registry';
import { loadCorePlugins } from './plugins/loader';
import { useAppStore } from './stores/app-store';
import { useHotkeyStore } from './stores/hotkey-store';
import { useNoteStore } from './stores/note-store';
import { useSettingsStore } from './stores/settings-store';

export function App() {
  const { t } = useTranslation();
  const init = useAppStore((s) => s.init);
  const initialized = useAppStore((s) => s.initialized);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadHotkeys = useHotkeyStore((s) => s.loadHotkeys);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const pendingDeletePath = useAppStore((s) => s.pendingDeletePath);
  const clearPendingDelete = useAppStore((s) => s.clearPendingDelete);
  const deleteNote = useNoteStore((s) => s.deleteNote);
  const notes = useNoteStore((s) => s.notes);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setupDefaultCommands();
    loadHotkeys().then(() => loadCorePlugins());
    loadSettings().then(() => {
      const { trashRetentionDays, language, zoomLevel } =
        useSettingsStore.getState().settings;
      trashApi.purgeExpiredTrash(trashRetentionDays).catch(() => {});
      i18n.changeLanguage(language).then(() => syncNativeMenu());
      if (zoomLevel !== 1.0) {
        zoomApi.setZoom(zoomLevel);
      }
    });
    init().then(() => loadNotes());

    // Forward native menu actions to command registry (with scope check)
    const unlisten = listen<string>('menu-action', (event) => {
      const cmd = commandRegistry.getCommand(event.payload);
      if (!cmd) return;
      const currentPanel = useAppStore.getState().focusedPanel;
      if (isCommandAllowedInPanel(cmd, currentPanel)) {
        cmd.execute();
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [init, loadHotkeys, loadNotes, loadSettings]);

  useEffect(() => {
    if (settingsLoaded && !settings.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [settingsLoaded, settings.hasSeenOnboarding]);

  // Check for updates after app is fully initialized
  const [pendingUpdate, setPendingUpdate] = useState<Awaited<
    ReturnType<typeof check>
  > | null>(null);

  useEffect(() => {
    if (!initialized || !settingsLoaded) return;
    check()
      .then((update) => {
        if (update) setPendingUpdate(update);
      })
      .catch(() => {});
  }, [initialized, settingsLoaded]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    updateSetting('hasSeenOnboarding', true);
  };

  useCustomCSS();
  useCommandHotkeys();
  usePanelNavigation();

  const pendingNote = pendingDeletePath
    ? notes.find((n) => n.path === pendingDeletePath)
    : null;

  const handleConfirmDelete = async () => {
    if (pendingDeletePath) {
      try {
        await deleteNote(pendingDeletePath);
      } catch (e) {
        console.error('Failed to delete note:', e);
      }
    }
    clearPendingDelete();
  };

  if (!initialized || !settingsLoaded) {
    return (
      <div
        className="h-screen w-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Loader2 size={24} className="animate-spin text-text-muted" />
        <div className="text-text-muted text-sm">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      <AppLayout />
      <Toaster />
      {pendingUpdate && (
        <UpdateToast
          update={pendingUpdate}
          onDismiss={() => setPendingUpdate(null)}
        />
      )}
      <TrashModal />
      <CheatSheetModal />
      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <AlertDialog
        open={!!pendingDeletePath}
        onOpenChange={(open) => {
          if (!open) clearPendingDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialog.moveToTrash', {
                title: pendingNote?.title || t('noteList.emptyNote'),
              })}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
