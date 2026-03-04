import { relaunch } from '@tauri-apps/plugin-process';
import type { Update } from '@tauri-apps/plugin-updater';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  update: Update;
  onDismiss: () => void;
}

export function UpdateToast({ update, onDismiss }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<
    'prompt' | 'downloading' | 'ready' | 'failed'
  >('prompt');

  const handleUpdate = async () => {
    setStatus('downloading');
    try {
      await update.downloadAndInstall();
      setStatus('ready');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[340px] rounded-lg border border-border bg-bg-secondary p-3 shadow-lg text-xs animate-in slide-in-from-bottom-2 fade-in duration-300">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2 right-2 text-text-muted hover:text-text-secondary transition-colors"
      >
        <X size={12} />
      </button>

      {status === 'prompt' && (
        <>
          <div className="font-medium text-text-primary">
            {t('about.updateAvailable')}
          </div>
          <div className="text-text-muted mt-0.5">
            {t('about.updateDescription', { version: update.version })}
          </div>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleUpdate}
              className="px-2.5 py-1 rounded text-[11px] bg-primary text-white hover:opacity-90 transition-opacity"
            >
              {t('about.update')}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1 rounded text-[11px] text-text-muted border border-border hover:text-text-secondary transition-colors"
            >
              {t('about.later')}
            </button>
          </div>
        </>
      )}

      {status === 'downloading' && (
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 size={12} className="animate-spin" />
          {t('about.downloading', { version: update.version })}
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="font-medium text-text-primary">
            {t('about.restartToUpdate')}
          </div>
          <div className="text-text-muted mt-0.5">
            {t('about.restartDescription', { version: update.version })}
          </div>
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => relaunch()}
              className="px-2.5 py-1 rounded text-[11px] bg-primary text-white hover:opacity-90 transition-opacity"
            >
              {t('about.restart')}
            </button>
          </div>
        </>
      )}

      {status === 'failed' && (
        <div className="text-destructive">{t('about.checkFailed')}</div>
      )}
    </div>
  );
}
