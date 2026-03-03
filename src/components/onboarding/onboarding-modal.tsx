import { useTranslation } from 'react-i18next';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Shortcut } from '@/components/ui/kbd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { syncNativeMenu } from '@/i18n/sync-menu';
import { useSettingsStore } from '@/stores/settings-store';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  const tips = [
    { keys: ['Mod', 'N'], key: 'onboarding.tip1' },
    { keys: ['Mod', 'P'], key: 'onboarding.tip2' },
    { keys: ['Mod', '/'], key: 'onboarding.tip3' },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onComplete();
      }}
    >
      <DialogContent className="w-[420px] max-w-none p-8 flex flex-col items-center text-center gap-4 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{t('onboarding.welcome')}</DialogTitle>
        <img src={appIcon} alt="Graphite" className="size-16" />
        <h2 className="text-lg font-semibold text-text-primary">
          {t('onboarding.welcome')}
        </h2>
        <p className="text-sm text-text-muted">{t('onboarding.description')}</p>
        <Select
          value={settings.language}
          onValueChange={(v) => {
            updateSetting('language', v as 'en' | 'ja');
            i18n.changeLanguage(v).then(() => syncNativeMenu());
          }}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-full space-y-3 mt-2 text-left">
          {tips.map((tip) => (
            <div
              key={tip.key}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-secondary/60"
            >
              <span className="text-xs text-text-secondary">{t(tip.key)}</span>
              <Shortcut keys={tip.keys} />
            </div>
          ))}
        </div>
        <Button onClick={onComplete} className="mt-4 w-full">
          {t('onboarding.getStarted')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
