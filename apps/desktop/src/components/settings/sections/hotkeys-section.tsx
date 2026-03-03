import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeyStore } from '@/stores/hotkey-store';
import { commandRegistry, type Command } from '@/lib/commands/registry';
import { groupCommandsByPrefix } from '@/lib/commands/command-groups';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd, Shortcut } from '@/components/ui/kbd';
import { IS_MAC } from '@/lib/platform';

export function HotkeysSection() {
  const { t } = useTranslation();
  const commands = commandRegistry.getCommands();
  const { overrides, setHotkey, resetHotkey, resetAllHotkeys, findConflict } = useHotkeyStore();
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ commandId: string; conflictName: string } | null>(null);
  const recordRef = useRef<string | null>(null);

  const handleRecord = useCallback(
    (e: KeyboardEvent) => {
      if (!recordRef.current) return;
      if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;

      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (IS_MAC) {
        if (e.metaKey) parts.push('Mod');
        if (e.ctrlKey) parts.push('Ctrl');
      } else {
        if (e.ctrlKey) parts.push('Mod');
        if (e.metaKey) parts.push('Meta');
      }
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      let key = e.key;
      if (key === ' ') key = 'Space';
      else if (key.length === 1) key = key.toUpperCase();
      parts.push(key);

      const hotkeyStr = parts.join('+');
      const conflicting = findConflict(hotkeyStr, recordRef.current);

      if (conflicting) {
        setConflict({ commandId: recordRef.current, conflictName: conflicting.name });
        setRecordingId(null);
        recordRef.current = null;
        return;
      }

      setHotkey(recordRef.current, hotkeyStr);
      setConflict(null);
      setRecordingId(null);
      recordRef.current = null;
    },
    [findConflict, setHotkey],
  );

  useEffect(() => {
    if (recordingId) {
      recordRef.current = recordingId;
      window.addEventListener('keydown', handleRecord, true);
      return () => window.removeEventListener('keydown', handleRecord, true);
    }
  }, [recordingId, handleRecord]);

  const commandsWithHotkeys = commands.filter((c) => c.hotkey);
  const groups = groupCommandsByPrefix(commandsWithHotkeys);

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-4">
      {hasOverrides && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={resetAllHotkeys}>
            <RotateCcw size={12} className="mr-1.5" />
            {t('settings.resetAllHotkeys')}
          </Button>
        </div>
      )}
      {conflict && (
        <div className="text-xs text-destructive mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md">
          {t('settings.conflictMessage', { name: conflict.conflictName })}
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-3 mb-1.5">
            <div className="text-sm font-semibold text-text-secondary">{t(group.label)}</div>
            <div className="text-xs text-text-muted">{t(group.description)}</div>
          </div>
          <div className="space-y-0.5">
            {group.commands.map((cmd) => (
              <HotkeyRow
                key={cmd.id}
                cmd={cmd}
                isOverridden={cmd.id in overrides}
                isRecording={recordingId === cmd.id}
                onToggleRecord={() => {
                  setConflict(null);
                  setRecordingId(recordingId === cmd.id ? null : cmd.id);
                }}
                onReset={() => {
                  resetHotkey(cmd.id);
                  setConflict(null);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HotkeyRow({
  cmd,
  isOverridden,
  isRecording,
  onToggleRecord,
  onReset,
}: {
  cmd: Command;
  isOverridden: boolean;
  isRecording: boolean;
  onToggleRecord: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-bg-hover/50 transition-colors">
      <span className="text-sm text-text-secondary">{t(cmd.name)}</span>
      <div className="flex items-center gap-2">
        <button onClick={onToggleRecord}>
          {isRecording ? (
            <Kbd className="border-primary/50 bg-primary/10 text-primary animate-pulse">{t('settings.recording')}</Kbd>
          ) : (
            <Shortcut keys={cmd.hotkey!.split('+')} />
          )}
        </button>
        {isOverridden && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-5 w-5"
            onClick={onReset}
            title={t('settings.resetToDefault')}
          >
            <RotateCcw size={11} />
          </Button>
        )}
      </div>
    </div>
  );
}
