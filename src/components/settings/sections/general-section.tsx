import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import i18n from '@/i18n';
import { syncNativeMenu } from '@/i18n/sync-menu';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingRow } from '../setting-row';

export function GeneralSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();

  return (
    <div className="space-y-1">
      <SettingRow
        label={t('settings.language')}
        description={t('settings.languageDescription')}
      >
        <Select
          value={settings.language}
          onValueChange={(v) => {
            updateSetting('language', v as 'en' | 'ja');
            i18n.changeLanguage(v).then(() => syncNativeMenu());
          }}
        >
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
      <SettingRow
        label={t('settings.trashRetention')}
        description={t('settings.trashRetentionDescription')}
      >
        <Input
          type="number"
          value={settings.trashRetentionDays}
          onChange={(e) =>
            updateSetting(
              'trashRetentionDays',
              Math.max(1, parseInt(e.target.value) || 30)
            )
          }
          className="w-24 h-8"
          min={1}
          max={365}
        />
      </SettingRow>
    </div>
  );
}
