import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';
import { commandRegistry } from '@/lib/commands/registry';
import { formatHotkey } from '@/lib/platform';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';

export function CommandPalette() {
  const { t } = useTranslation();
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const togglePalette = useAppStore((s) => s.toggleCommandPalette);
  const notes = useNoteStore((s) => s.notes);
  const selectNote = useNoteStore((s) => s.selectNote);
  const [query, setQuery] = useState('');

  const isCommandMode = query.startsWith('>');

  const handleSelect = useCallback(
    (value: string) => {
      if (value.startsWith('cmd:')) {
        const cmdId = value.slice(4);
        commandRegistry.execute(cmdId);
        togglePalette();
      } else if (value.startsWith('note:')) {
        const path = value.slice(5);
        selectNote(path);
        togglePalette();
      }
    },
    [selectNote, togglePalette],
  );

  const commands = commandRegistry.getCommands();
  const commandSearch = isCommandMode ? query.slice(1).trim() : '';

  const filteredNotes = !isCommandMode
    ? notes.slice(0, 20)
    : [];

  const filteredCommands = isCommandMode
    ? commands
    : commands.filter((c) => c.hotkey);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={togglePalette}>
      <CommandInput
        placeholder={isCommandMode ? t('commandPalette.commandPlaceholder') : t('commandPalette.searchPlaceholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>
        {!isCommandMode && (
          <CommandGroup heading={t('commandPalette.notes')}>
            {filteredNotes.map((note) => (
              <CommandItem
                key={note.path}
                value={`note:${note.path}`}
                onSelect={handleSelect}
                keywords={[note.title]}
              >
                <span className="truncate">{note.title}</span>
                <CommandShortcut>{note.folder || t('statusBar.root')}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {isCommandMode ? (
          <CommandGroup heading={t('commandPalette.commands')}>
            {filteredCommands.map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={`cmd:${cmd.id}`}
                onSelect={handleSelect}
                keywords={[cmd.name, commandSearch]}
              >
                <span>{t(cmd.name)}</span>
                {cmd.hotkey && <CommandShortcut>{formatHotkey(cmd.hotkey)}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          commands.length > 0 && (
            <CommandGroup heading={t('commandPalette.commands')}>
              {commands.slice(0, 5).map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`cmd:${cmd.id}`}
                  onSelect={handleSelect}
                  keywords={[cmd.name]}
                >
                  <span>{t(cmd.name)}</span>
                  {cmd.hotkey && <CommandShortcut>{formatHotkey(cmd.hotkey)}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </CommandDialog>
  );
}
