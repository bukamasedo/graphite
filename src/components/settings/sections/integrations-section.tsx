import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { mcpApi } from '@/lib/api/mcp-api';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingRow } from '../setting-row';

export function IntegrationsSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleToggle = async (enabled: boolean) => {
    setMessage(null);
    try {
      if (enabled) {
        await mcpApi.configureClaude();
        setMessage({ type: 'success', text: t('settings.mcpConfigured') });
      } else {
        await mcpApi.removeClaude();
        setMessage({ type: 'success', text: t('settings.mcpRemoved') });
      }
      updateSetting('mcpEnabled', enabled);
    } catch (e) {
      setMessage({
        type: 'error',
        text: t('settings.mcpError', {
          error: e instanceof Error ? e.message : String(e),
        }),
      });
    }
  };

  return (
    <div className="space-y-1">
      <div className="px-3 pb-2">
        <p className="text-xs text-text-muted">
          {t('settings.mcpServerDescription')}
        </p>
      </div>
      <SettingRow
        label={t('settings.mcpServer')}
        description={t('settings.mcpEnabled')}
      >
        <Switch checked={settings.mcpEnabled} onCheckedChange={handleToggle} />
      </SettingRow>
      {message && (
        <p
          className={`text-xs px-3 pt-1 ${
            message.type === 'success' ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
