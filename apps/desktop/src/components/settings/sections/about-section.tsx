import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function AboutSection() {
  const { t } = useTranslation();
  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'available' | 'failed'>('idle');
  const [updateVersion, setUpdateVersion] = useState('');

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion('unknown'));
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
    <div className="flex flex-col items-center text-center pt-4">
      <img src={appIcon} alt="Graphite" className="w-12 h-12 mb-3" />
      <h3 className="text-base font-semibold text-text-secondary">Graphite</h3>
      <p className="text-xs text-text-muted mt-1">{t('about.version', { version })}</p>
      <div className="mt-5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckUpdate}
          disabled={updateStatus === 'checking'}
        >
          {updateStatus === 'checking' && <Loader2 size={14} className="animate-spin" />}
          {t('about.checkForUpdates')}
        </Button>
        {updateStatus === 'up-to-date' && (
          <p className="text-xs text-green-500 mt-2">{t('about.upToDate')}</p>
        )}
        {updateStatus === 'available' && (
          <p className="text-xs text-primary mt-2">{t('about.updateAvailable', { version: updateVersion })}</p>
        )}
        {updateStatus === 'failed' && (
          <p className="text-xs text-destructive mt-2">{t('about.checkFailed')}</p>
        )}
      </div>
      <Separator className="!my-5 opacity-50" />
      <div className="max-w-md space-y-3 text-left">
        <p className="text-xs text-text-muted leading-relaxed">{t('about.story1')}</p>
        <p className="text-xs text-text-muted leading-relaxed">{t('about.story2')}</p>
        <p className="text-xs text-text-muted leading-relaxed">{t('about.story3')}</p>
      </div>
    </div>
  );
}
