import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { Shortcut } from '@/components/ui/kbd';
import { commandRegistry } from '@/lib/commands/registry';
import { useAppStore } from '@/stores/app-store';
import { useNoteStore } from '@/stores/note-store';

/** cmdk に渡す検索文字列から先頭の ">" を除去する */
function stripCommandPrefix(
  value: string,
  search: string,
  keywords?: string[]
): number {
  if (!search) return 1;
  const s = (
    search.startsWith('>') ? search.slice(1).trim() : search
  ).toLowerCase();
  if (!s) return 1;
  const candidates = [value, ...(keywords ?? [])];
  return candidates.some((c) => c.toLowerCase().includes(s)) ? 1 : 0;
}

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
    [selectNote, togglePalette]
  );

  const commands = commandRegistry.getCommands();

  const filteredNotes = !isCommandMode ? notes.slice(0, 20) : [];

  const filteredCommands = isCommandMode
    ? commands
    : commands.filter((c) => c.hotkey);

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={togglePalette}
      filter={stripCommandPrefix}
    >
      <CommandInput
        placeholder={
          isCommandMode
            ? t('commandPalette.commandPlaceholder')
            : t('commandPalette.searchPlaceholder')
        }
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
                <CommandShortcut>
                  {note.folder || t('statusBar.root')}
                </CommandShortcut>
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
                keywords={[cmd.name, t(cmd.name)]}
              >
                <span>{t(cmd.name)}</span>
                {cmd.hotkey && (
                  <Shortcut keys={cmd.hotkey.split('+')} className="ml-auto" />
                )}
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
                  {cmd.hotkey && (
                    <Shortcut
                      keys={cmd.hotkey.split('+')}
                      className="ml-auto"
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </CommandDialog>
  );
}
