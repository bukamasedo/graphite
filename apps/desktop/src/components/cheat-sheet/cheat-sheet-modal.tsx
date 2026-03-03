import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { commandRegistry } from '@/lib/commands/registry';
import { Shortcut } from '@/components/ui/kbd';
import { groupCommandsByPrefix } from '@/lib/commands/command-groups';
import { X } from 'lucide-react';

function hotkeyToKeys(hotkey: string): string[] {
  return hotkey.split('+').map((k) => k.trim());
}

export function CheatSheetModal() {
  const { t } = useTranslation();
  const open = useAppStore((s) => s.cheatSheetOpen);
  const toggle = useAppStore((s) => s.toggleCheatSheet);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  const commands = commandRegistry.getCommands().filter((c) => c.hotkey);
  const groups = groupCommandsByPrefix(commands);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, toggle]);

  if (!open && !animating) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-200"
        style={{
          backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
        }}
        onClick={toggle}
      />

      <div
        className="fixed top-3 right-3 bottom-3 z-[61] transition-transform duration-200 ease-out"
        style={{
          width: 380,
          transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 12px))',
        }}
      >
        <div className="h-full flex flex-col rounded-2xl bg-bg-secondary border border-white/[0.07] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold text-text-primary">
              {t('cheatSheet.title')}
            </span>
            <button
              className="text-text-muted hover:text-text-secondary transition-colors"
              onClick={toggle}
            >
              <X size={14} />
            </button>
          </div>

          {/* Groups */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  {t(group.label)}
                </h3>
                <div className="space-y-1">
                  {group.commands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="flex items-center justify-between py-1 px-2 -mx-2 rounded hover:bg-white/[0.03]"
                    >
                      <span className="text-[13px] text-text-muted">{t(cmd.name)}</span>
                      <Shortcut keys={hotkeyToKeys(cmd.hotkey!)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                {t('commandGroups.trash')}
              </h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1 px-2 -mx-2 rounded hover:bg-white/[0.03]">
                  <span className="text-[13px] text-text-muted">{t('common.restore')}</span>
                  <Shortcut keys={['Enter']} />
                </div>
                <div className="flex items-center justify-between py-1 px-2 -mx-2 rounded hover:bg-white/[0.03]">
                  <span className="text-[13px] text-text-muted">{t('trash.deletePermanently')}</span>
                  <Shortcut keys={['Mod', 'Backspace']} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
