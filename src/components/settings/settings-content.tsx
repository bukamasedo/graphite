import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { AboutSection } from './sections/about-section';
import { AppearanceSection } from './sections/appearance-section';
import { EditorSection } from './sections/editor-section';
import { GeneralSection } from './sections/general-section';
import { HotkeysSection } from './sections/hotkeys-section';

export function SettingsContent() {
  const { t } = useTranslation();
  const settingsSection = useAppStore((s) => s.settingsSection);
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--editor-bg)' }}
    >
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          {settingsSection !== 'about' && (
            <h2 className="text-base font-semibold text-text-secondary capitalize mb-6">
              {t(`settings.${settingsSection}`)}
            </h2>
          )}
          {settingsSection === 'general' && <GeneralSection />}
          {settingsSection === 'editor' && <EditorSection />}
          {settingsSection === 'appearance' && <AppearanceSection />}
          {settingsSection === 'hotkeys' && <HotkeysSection />}
          {settingsSection === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  );
}
