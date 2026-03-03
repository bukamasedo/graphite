import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cssApi } from '@/lib/api/css-api';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingRow } from '../setting-row';

export function AppearanceSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow
        label={t('settings.fontFamily')}
        description={t('settings.fontFamilyDescription')}
      >
        <Input
          type="text"
          value={settings.fontFamily}
          onChange={(e) => updateSetting('fontFamily', e.target.value)}
          className="w-52 h-8"
        />
      </SettingRow>
      <SettingRow
        label={t('settings.editorFont')}
        description={t('settings.editorFontDescription')}
      >
        <Input
          type="text"
          value={settings.editorFontFamily}
          onChange={(e) => updateSetting('editorFontFamily', e.target.value)}
          className="w-52 h-8"
        />
      </SettingRow>
      <SettingRow
        label={t('settings.customCSS')}
        description={t('settings.customCSSDescription')}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={async () => {
              try {
                const path = await cssApi.openCustomCssFile();
                const { open } = await import('@tauri-apps/plugin-shell');
                await open(path);
              } catch (e) {
                console.error('Failed to open custom CSS:', e);
              }
            }}
          >
            {t('settings.openFile')}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={async () => {
              try {
                const css = await cssApi.readCustomCss();
                const content = css.trim()
                  ? css
                  : '/* Custom CSS for Graphite */\n\n/* Example: customize editor appearance */\n/* .tiptap-editor { font-size: 16px; } */\n';
                const blob = new Blob([content], { type: 'text/css' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'custom.css';
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('Failed to download custom CSS:', e);
              }
            }}
          >
            {t('settings.downloadCSS')}
          </Button>
        </div>
      </SettingRow>
    </div>
  );
}
