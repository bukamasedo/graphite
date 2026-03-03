import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { check } from '@tauri-apps/plugin-updater';
import { ExternalLink, Github, Loader2, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  const { t } = useTranslation();
  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'up-to-date' | 'available' | 'failed'
  >('idle');
  const [updateVersion, setUpdateVersion] = useState('');

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
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch {
      setUpdateStatus('up-to-date');
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
          <p className="text-xs text-primary mt-2">
            {t('about.updateAvailable', { version: updateVersion })}
          </p>
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
