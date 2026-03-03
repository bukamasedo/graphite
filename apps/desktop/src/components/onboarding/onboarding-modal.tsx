import { useTranslation } from 'react-i18next';
import { Gem } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { formatHotkey } from '@/lib/platform';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { t } = useTranslation();

  const tips = [
    { shortcut: 'Cmd+N', key: 'onboarding.tip1' },
    { shortcut: 'Cmd+P', key: 'onboarding.tip2' },
    { shortcut: 'Cmd+/', key: 'onboarding.tip3' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onComplete(); }}>
      <DialogContent className="w-[420px] max-w-none p-8 flex flex-col items-center text-center gap-4 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">{t('onboarding.welcome')}</DialogTitle>
        <Gem size={48} className="text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">{t('onboarding.welcome')}</h2>
        <p className="text-sm text-text-muted">{t('onboarding.description')}</p>
        <div className="w-full space-y-3 mt-2 text-left">
          {tips.map((tip) => (
            <div key={tip.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-secondary/60">
              <span className="text-xs text-text-secondary">
                {t(tip.key, { shortcut: '' }).replace(/^\s+/, '')}
              </span>
              <Kbd>{formatHotkey(tip.shortcut)}</Kbd>
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
