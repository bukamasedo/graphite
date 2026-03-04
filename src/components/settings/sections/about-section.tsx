import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { open } from '@tauri-apps/plugin-shell';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { Download, ExternalLink, Github, Loader2, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  const { t } = useTranslation();
  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<
    | 'idle'
    | 'checking'
    | 'up-to-date'
    | 'available'
    | 'downloading'
    | 'ready'
    | 'failed'
  >('idle');
  const [updateVersion, setUpdateVersion] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'));
  }, []);

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    try {
      const update = await check();
      if (update) {
        setUpdateStatus('available');
        setUpdateVersion(update.version);
        setPendingUpdate(update);
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch {
      setUpdateStatus('failed');
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!pendingUpdate) return;
    setUpdateStatus('downloading');
    try {
      await pendingUpdate.downloadAndInstall();
      setUpdateStatus('ready');
    } catch {
      setUpdateStatus('failed');
    }
  };

  return (
    <div className="flex flex-col items-center text-center pt-12">
      <img src={appIcon} alt="Graphite" className="w-16 h-16 mb-4" />
      <h3 className="text-lg font-semibold text-text-secondary">Graphite</h3>
      <p className="text-xs text-text-muted mt-1">
        {t('about.version', { version })}
      </p>

      <div className="flex gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => open('https://github.com/bukamasedo/graphite')}
        >
          <Github size={14} />
          GitHub
          <ExternalLink size={10} className="text-text-muted" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            open('https://github.com/bukamasedo/graphite/blob/main/LICENSE')
          }
        >
          <Scale size={14} />
          {t('about.license')}
          <ExternalLink size={10} className="text-text-muted" />
        </Button>
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckUpdate}
          disabled={updateStatus === 'checking'}
        >
          {updateStatus === 'checking' && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {t('about.checkForUpdates')}
        </Button>
        {updateStatus === 'up-to-date' && (
          <p className="text-xs text-green-500 mt-2">{t('about.upToDate')}</p>
        )}
        {updateStatus === 'available' && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-xs text-primary">
              {t('about.updateDescription', { version: updateVersion })}
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAndInstall}
            >
              <Download size={14} />
              {t('about.update')}
            </Button>
          </div>
        )}
        {updateStatus === 'downloading' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
            <Loader2 size={14} className="animate-spin" />
            {t('about.downloading', { version: updateVersion })}
          </div>
        )}
        {updateStatus === 'ready' && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-xs text-green-500">
              {t('about.restartDescription', { version: updateVersion })}
            </p>
            <Button variant="default" size="sm" onClick={() => relaunch()}>
              {t('about.restart')}
            </Button>
          </div>
        )}
        {updateStatus === 'failed' && (
          <p className="text-xs text-destructive mt-2">
            {t('about.checkFailed')}
          </p>
        )}
      </div>

      <div className="max-w-sm space-y-3 text-left mt-12">
        <p className="text-xs text-text-muted/70 leading-relaxed">
          {t('about.story1')}
        </p>
        <p className="text-xs text-text-muted/70 leading-relaxed">
          {t('about.story2')}
        </p>
        <p className="text-xs text-text-muted/70 leading-relaxed">
          {t('about.story3')}
        </p>
      </div>
    </div>
  );
}
