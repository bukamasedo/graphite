import type { Command } from './registry';

export interface GroupedCommands {
  label: string;
  description: string;
  commands: Command[];
}

export const COMMAND_GROUPS: {
  label: string;
  description: string;
  prefix: string;
}[] = [
  {
    label: 'commandGroups.global',
    description: 'commandGroups.globalDesc',
    prefix: '',
  },
  {
    label: 'commandGroups.note',
    description: 'commandGroups.noteDesc',
    prefix: 'note:',
  },
  {
    label: 'commandGroups.editor',
    description: 'commandGroups.editorDesc',
    prefix: 'editor:',
  },
  {
    label: 'commandGroups.folder',
    description: 'commandGroups.folderDesc',
    prefix: 'folder:',
  },
  {
    label: 'commandGroups.trash',
    description: 'commandGroups.trashDesc',
    prefix: 'trash:',
  },
];

export function groupCommandsByPrefix(commands: Command[]): GroupedCommands[] {
  const specificPrefixes = COMMAND_GROUPS.filter((g) => g.prefix).map(
    (g) => g.prefix
  );

  return COMMAND_GROUPS.map((group) => {
    const filtered = commands.filter((cmd) => {
      if (group.prefix) {
        return cmd.id.startsWith(group.prefix);
      }
      // Global: commands that don't match any specific prefix
      return !specificPrefixes.some((p) => cmd.id.startsWith(p));
    });
    return {
      label: group.label,
      description: group.description,
      commands: filtered,
    };
  }).filter((g) => g.commands.length > 0);
}
