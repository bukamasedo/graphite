import { ArrowLeft, Info, Keyboard, Palette, Settings2, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { type SettingsSection, useAppStore } from '@/stores/app-store';

const sectionIcons: Record<SettingsSection, typeof Settings2> = {
  general: Settings2,
  editor: Type,
  appearance: Palette,
  hotkeys: Keyboard,
  about: Info,
};

const sectionKeys: SettingsSection[] = ['general', 'editor', 'appearance', 'hotkeys'];

const bottomSectionKeys: SettingsSection[] = ['about'];

export function SettingsSidebar() {
  const { t } = useTranslation();
  const settingsSection = useAppStore((s) => s.settingsSection);
  const setSettingsSection = useAppStore((s) => s.setSettingsSection);
  const exitSettings = useAppStore((s) => s.exitSettings);

  const sections = sectionKeys.map((id) => ({
    id,
    label: t('settings.' + id),
  }));

  const bottomSections = bottomSectionKeys.map((id) => ({
    id,
    label: t('settings.' + id),
  }));

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        paddingTop: 'var(--titlebar-height)',
      }}
    >
      <div className="px-3 pt-2 pb-1">
        <Button
          variant="ghost"
          size="xs"
          className="text-text-muted hover:text-text-primary gap-1.5 text-[13px] px-2"
          onClick={exitSettings}
        >
          <ArrowLeft size={14} />
          {t('common.back')}
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto flex flex-col">
        <div>
          <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1 px-2">
            {t('settings.title')}
          </div>
          <div className="flex flex-col gap-0.5">
            {sections.map((s) => {
              const Icon = sectionIcons[s.id];
              return (
                <Button
                  key={s.id}
                  variant={settingsSection === s.id ? 'secondary' : 'ghost'}
                  size="xs"
                  className={`justify-start text-[13px] px-2 ${
                    settingsSection === s.id
                      ? 'bg-bg-hover text-accent font-medium'
                      : 'text-text-secondary'
                  }`}
                  onClick={() => setSettingsSection(s.id)}
                >
                  <Icon size={14} />
                  {s.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-0.5">
          {bottomSections.map((s) => {
            const Icon = sectionIcons[s.id];
            return (
              <Button
                key={s.id}
                variant={settingsSection === s.id ? 'secondary' : 'ghost'}
                size="xs"
                className={`justify-start text-[13px] px-2 ${
                  settingsSection === s.id
                    ? 'bg-bg-hover text-accent font-medium'
                    : 'text-text-secondary'
                }`}
                onClick={() => setSettingsSection(s.id)}
              >
                <Icon size={14} />
                {s.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { sectionKeys, bottomSectionKeys };
