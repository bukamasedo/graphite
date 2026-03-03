import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { syncNativeMenu } from '@/i18n/sync-menu';
import { AppLayout } from './components/layout/app-layout';
import { commandRegistry, isCommandAllowedInPanel } from './lib/commands/registry';
import { useAppStore } from './stores/app-store';
import { useNoteStore } from './stores/note-store';
import { useSettingsStore } from './stores/settings-store';
import { useHotkeyStore } from './stores/hotkey-store';
import { useCommandHotkeys } from './hooks/use-command-hotkeys';
import { usePanelNavigation } from './hooks/use-panel-navigation';
import { useCustomCSS } from './hooks/use-custom-css';
import { setupDefaultCommands } from './lib/commands/default-commands';
import { loadCorePlugins } from './plugins/loader';
import { TrashModal } from './components/trash/trash-modal';
import { CheatSheetModal } from './components/cheat-sheet/cheat-sheet-modal';
import { OnboardingModal } from './components/onboarding/onboarding-modal';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';

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
      const { trashRetentionDays, language } = useSettingsStore.getState().settings;
      invoke('purge_expired_trash', { retentionDays: trashRetentionDays }).catch(() => {});
      i18n.changeLanguage(language).then(() => syncNativeMenu());
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
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  useEffect(() => {
    if (settingsLoaded && !settings.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [settingsLoaded]);

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
      <TrashModal />
      <CheatSheetModal />
      <OnboardingModal open={showOnboarding} onComplete={handleOnboardingComplete} />
      <AlertDialog open={!!pendingDeletePath} onOpenChange={(open) => { if (!open) clearPendingDelete(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialog.moveToTrash', { title: pendingNote?.title || t('noteList.emptyNote') })}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
