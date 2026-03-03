import i18n from '@/i18n';
import { menuApi } from '@/lib/api/menu-api';

export async function syncNativeMenu() {
  const t = i18n.t.bind(i18n);
  document.documentElement.lang = i18n.language;
  try {
    await menuApi.rebuildMenu({
      file: t('menu.file'),
      new_note: t('menu.newNote'),
      new_folder: t('menu.newFolder'),
      reload: t('menu.reload'),
      edit: t('menu.edit'),
      undo: t('menu.undo'),
      redo: t('menu.redo'),
      cut: t('menu.cut'),
      copy: t('menu.copy'),
      paste: t('menu.paste'),
      select_all: t('menu.selectAll'),
      view: t('menu.view'),
      command_palette: t('menu.commandPalette'),
      search_notes: t('menu.searchNotes'),
      history: t('menu.history'),
      history_back: t('menu.historyBack'),
      history_forward: t('menu.historyForward'),
      show_history: t('menu.showHistory'),
      about: t('menu.about'),
      hide: t('menu.hide'),
      hide_others: t('menu.hideOthers'),
      show_all: t('menu.showAll'),
      quit: t('menu.quit'),
      window: t('menu.window'),
      minimize: t('menu.minimize'),
      zoom: t('menu.zoom'),
      close: t('menu.close'),
      settings: t('menu.settings'),
    });
  } catch (e) {
    console.error('Failed to sync native menu:', e);
  }
}
