import i18n from '@/i18n';
import { menuApi } from '@/lib/api/menu-api';

export async function syncNativeMenu() {
  const t = i18n.t.bind(i18n);
  document.documentElement.lang = i18n.language;
  try {
    await menuApi.rebuildMenu({
      file: t('menu.file'),
      new_note: t('menu.newNote'),
      move_to_trash: t('menu.moveToTrash'),
      open_trash: t('menu.openTrash'),
      edit: t('menu.edit'),
      view: t('menu.view'),
      command_palette: t('menu.commandPalette'),
      search_notes: t('menu.searchNotes'),
      history: t('menu.history'),
      history_back: t('menu.historyBack'),
      history_forward: t('menu.historyForward'),
      show_history: t('menu.showHistory'),
      window: t('menu.window'),
      settings: t('menu.settings'),
    });
  } catch (e) {
    console.error('Failed to sync native menu:', e);
  }
}
