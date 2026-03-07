import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { mcpApi } from '@/lib/api/mcp-api';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingRow } from '../setting-row';

const MCP_CLIENTS = [
  { id: 'claude-desktop', name: 'Claude Desktop' },
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'windsurf', name: 'Windsurf' },
] as const;

export function IntegrationsSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleToggle = async (clientId: string, enabled: boolean) => {
    setMessage(null);
    try {
      if (enabled) {
        await mcpApi.configureClient(clientId);
        setMessage({ type: 'success', text: t('settings.mcpConfigured') });
      } else {
        await mcpApi.removeClient(clientId);
        setMessage({ type: 'success', text: t('settings.mcpRemoved') });
      }

      const current = settings.mcpClients;
      const updated = enabled
        ? [...current, clientId]
        : current.filter((id) => id !== clientId);
      updateSetting('mcpClients', updated);
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
          {t('settings.mcpDescription')}
        </p>
      </div>
      {MCP_CLIENTS.map((client) => (
        <SettingRow key={client.id} label={client.name} description="MCP">
          <Switch
            checked={settings.mcpClients.includes(client.id)}
            onCheckedChange={(checked) => handleToggle(client.id, checked)}
          />
        </SettingRow>
      ))}
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
