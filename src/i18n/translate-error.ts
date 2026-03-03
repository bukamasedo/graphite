import i18n from '@/i18n';

const ERROR_MAP: Record<string, string> = {
  'Folder already exists': 'errors.folderAlreadyExists',
  'Folder does not exist': 'errors.folderNotExist',
  'A note with this name already exists': 'errors.noteAlreadyExists',
  'A folder with this name already exists': 'errors.folderNameAlreadyExists',
  'Trash item not found': 'errors.trashItemNotFound',
  'Trash file no longer exists': 'errors.trashFileNotExist',
};

export function translateError(error: unknown): string {
  const msg = String(error);
  const key = ERROR_MAP[msg];
  return key ? i18n.t(key) : msg;
}
