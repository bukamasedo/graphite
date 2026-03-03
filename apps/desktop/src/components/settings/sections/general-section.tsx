import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { syncNativeMenu } from '@/i18n/sync-menu';
import { useSettingsStore } from '@/stores/settings-store';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SettingRow } from '../setting-row';

export function GeneralSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow label={t('settings.language')} description={t('settings.languageDescription')}>
        <Select value={settings.language} onValueChange={(v) => {
          updateSetting('language', v as 'en' | 'ja');
          i18n.changeLanguage(v).then(() => syncNativeMenu());
        }}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <Separator className="!my-3 opacity-50" />
      <SettingRow label={t('settings.autoSave')} description={t('settings.autoSaveDescription')}>
        <Switch checked={settings.autoSave} onCheckedChange={(v) => updateSetting('autoSave', v)} />
      </SettingRow>
      <SettingRow label={t('settings.autoSaveInterval')} description={t('settings.autoSaveIntervalDescription')}>
        <Input
          type="number"
          value={settings.autoSaveInterval}
          onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value) || 3000)}
          className="w-24 h-8"
        />
      </SettingRow>
      <SettingRow label={t('settings.spellCheck')} description={t('settings.spellCheckDescription')}>
        <Switch checked={settings.spellCheck} onCheckedChange={(v) => updateSetting('spellCheck', v)} />
      </SettingRow>
      <Separator className="!my-3 opacity-50" />
      <SettingRow label={t('settings.trashRetention')} description={t('settings.trashRetentionDescription')}>
        <Input
          type="number"
          value={settings.trashRetentionDays}
          onChange={(e) => updateSetting('trashRetentionDays', Math.max(1, parseInt(e.target.value) || 30))}
          className="w-24 h-8"
          min={1}
          max={365}
        />
      </SettingRow>
    </div>
  );
}
