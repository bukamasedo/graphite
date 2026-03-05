import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingRow } from '../setting-row';

export function EditorSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow
        label={t('settings.fontSize')}
        description={t('settings.fontSizeDescription')}
      >
        <Input
          type="number"
          value={settings.fontSize}
          onChange={(e) =>
            updateSetting('fontSize', parseInt(e.target.value, 10) || 15)
          }
          className="w-24 h-8"
          min={10}
          max={30}
        />
      </SettingRow>
      <SettingRow
        label={t('settings.spellCheck')}
        description={t('settings.spellCheckDescription')}
      >
        <Switch
          checked={settings.spellCheck}
          onCheckedChange={(v) => updateSetting('spellCheck', v)}
        />
      </SettingRow>
      <SettingRow
        label={t('settings.lineHeight')}
        description={t('settings.lineHeightDescription')}
      >
        <Input
          type="number"
          value={settings.lineHeight}
          onChange={(e) =>
            updateSetting('lineHeight', parseFloat(e.target.value) || 1.7)
          }
          className="w-24 h-8"
          min={1.4}
          max={2.0}
          step={0.1}
        />
      </SettingRow>
      <SettingRow
        label={t('settings.editorPadding')}
        description={t('settings.editorPaddingDescription')}
      >
        <Input
          type="number"
          value={settings.editorPadding}
          onChange={(e) =>
            updateSetting('editorPadding', parseInt(e.target.value, 10) || 24)
          }
          className="w-24 h-8"
          min={0}
          max={120}
        />
      </SettingRow>
    </div>
  );
}
