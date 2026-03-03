import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '@/stores/settings-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SettingRow } from '../setting-row';

export function AppearanceSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow label={t('settings.fontFamily')} description={t('settings.fontFamilyDescription')}>
        <Input
          type="text"
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          className="w-52 h-8"
        />
      </SettingRow>
      <SettingRow label={t('settings.editorFont')} description={t('settings.editorFontDescription')}>
        <Input
          type="text"
          value={settings.editorFontFamily}
          onChange={(e) => updateSetting('editorFontFamily', e.target.value)}
          className="w-52 h-8"
        />
      </SettingRow>
      <SettingRow label={t('settings.customCSS')} description={t('settings.customCSSDescription')}>
        <Button
          variant="outline"
          size="xs"
          onClick={async () => {
            try {
              const path = await invoke<string>('open_custom_css_file');
              const { open } = await import('@tauri-apps/plugin-shell');
              await open(path);
            } catch (e) {
              console.error('Failed to open custom CSS:', e);
            }
          }}
        >
          {t('settings.openFile')}
        </Button>
      </SettingRow>
    </div>
  );
}
