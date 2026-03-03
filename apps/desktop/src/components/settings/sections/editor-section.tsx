import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings-store';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SettingRow } from '../setting-row';

export function EditorSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow label={t('settings.fontSize')} description={t('settings.fontSizeDescription')}>
        <Input
          type="number"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value) || 15)}
          className="w-24 h-8"
          min={10}
          max={30}
        />
      </SettingRow>
      <SettingRow label={t('settings.tabSize')} description={t('settings.tabSizeDescription')}>
        <Input
          type="number"
          value={settings.tabSize}
          onChange={(e) => updateSetting('tabSize', parseInt(e.target.value) || 2)}
          className="w-24 h-8"
          min={1}
          max={8}
        />
      </SettingRow>
      <SettingRow label={t('settings.wordWrap')} description={t('settings.wordWrapDescription')}>
        <Switch checked={settings.wordWrap} onCheckedChange={(v) => updateSetting('wordWrap', v)} />
      </SettingRow>
    </div>
  );
}
