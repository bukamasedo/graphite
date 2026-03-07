import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
} from './tools/folders.js';
import {
  createNote,
  deleteNote,
  emptyTrash,
  listNotes,
  listTrash,
  moveNote,
  permanentlyDelete,
  readNote,
  renameNote,
  restoreNote,
  writeNote,
} from './tools/notes.js';
import { searchNotes } from './tools/search.js';
import { listTags } from './tools/tags.js';

function handleError(error: unknown): {
  content: [{ type: 'text'; text: string }];
  isError: true;
} {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text', text: message }], isError: true };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'graphite',
    version: '0.1.0',
  });

  // --- Tools ---

  server.tool(
    'list_notes',
    'List notes in the vault. Optionally filter by folder or tag.',
    {
      folder: z
        .string()
        .optional()
        .describe('Folder path relative to vault root'),
      tag: z.string().optional().describe('Filter by tag name'),
    },
    async ({ folder, tag }) => {
      try {
        const notes = listNotes(folder, tag);
        return {
          content: [{ type: 'text', text: JSON.stringify(notes, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'read_note',
    'Read the full content of a note by its absolute path.',
    {
      path: z.string().describe('Absolute path to the note file'),
    },
    async ({ path }) => {
      try {
        const note = readNote(path);
        return {
          content: [{ type: 'text', text: JSON.stringify(note, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'create_note',
    'Create a new note in the vault.',
    {
      title: z
        .string()
        .optional()
        .describe("Note title (defaults to 'Untitled')"),
      folder: z
        .string()
        .optional()
        .describe('Folder path relative to vault root'),
    },
    async ({ title, folder }) => {
      try {
        const note = createNote(folder, title);
        return {
          content: [{ type: 'text', text: JSON.stringify(note, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'write_note',
    'Update the content and/or metadata of an existing note.',
    {
      path: z.string().describe('Absolute path to the note file'),
      content: z
        .string()
        .describe('New markdown content (body only, without frontmatter)'),
      title: z.string().optional().describe('New title'),
      tags: z.array(z.string()).optional().describe('New tags array'),
      pinned: z.boolean().optional().describe('Pin/unpin the note'),
    },
    async ({ path, content, title, tags, pinned }) => {
      try {
        writeNote(path, content, title, tags, pinned);
        return {
          content: [{ type: 'text', text: 'Note updated successfully' }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'delete_note',
    'Move a note to the trash.',
    {
      path: z.string().describe('Absolute path to the note file'),
    },
    async ({ path }) => {
      try {
        deleteNote(path);
        return { content: [{ type: 'text', text: 'Note moved to trash' }] };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'rename_note',
    'Rename a note (updates both filename and frontmatter title).',
    {
      path: z.string().describe('Absolute path to the note file'),
      newTitle: z.string().describe('New title for the note'),
    },
    async ({ path, newTitle }) => {
      try {
        const newPath = renameNote(path, newTitle);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ newPath }, null, 2) },
          ],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'search_notes',
    'Full-text search across all notes in the vault.',
    {
      query: z.string().describe('Search query string'),
    },
    async ({ query }) => {
      try {
        const results = searchNotes(query);
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'move_note',
    'Move a note to a different folder.',
    {
      path: z.string().describe('Absolute path to the note file'),
      targetFolder: z
        .string()
        .describe(
          'Target folder path relative to vault root (empty string for vault root)'
        ),
    },
    async ({ path, targetFolder }) => {
      try {
        const newPath = moveNote(path, targetFolder);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ newPath }, null, 2) },
          ],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool('list_trash', 'List all items in the trash.', {}, async () => {
    try {
      const items = listTrash();
      return {
        content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
      };
    } catch (e) {
      return handleError(e);
    }
  });

  server.tool(
    'restore_note',
    'Restore a note from the trash to its original location.',
    {
      id: z.string().describe('Trash item ID'),
    },
    async ({ id }) => {
      try {
        restoreNote(id);
        return {
          content: [{ type: 'text', text: 'Note restored successfully' }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'permanently_delete',
    'Permanently delete a note from the trash (cannot be undone).',
    {
      id: z.string().describe('Trash item ID'),
    },
    async ({ id }) => {
      try {
        permanentlyDelete(id);
        return {
          content: [{ type: 'text', text: 'Note permanently deleted' }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'empty_trash',
    'Permanently delete all items in the trash (cannot be undone).',
    {},
    async () => {
      try {
        emptyTrash();
        return { content: [{ type: 'text', text: 'Trash emptied' }] };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'list_folders',
    'List all folders in the vault with note counts.',
    {},
    async () => {
      try {
        const folders = listFolders();
        return {
          content: [{ type: 'text', text: JSON.stringify(folders, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'create_folder',
    'Create a new folder in the vault.',
    {
      name: z.string().describe('Folder name'),
      parent: z.string().optional().describe('Parent folder absolute path'),
    },
    async ({ name, parent }) => {
      try {
        const folder = createFolder(name, parent);
        return {
          content: [{ type: 'text', text: JSON.stringify(folder, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'delete_folder',
    'Delete a folder (moves all contained files to trash).',
    {
      path: z.string().describe('Absolute path to the folder'),
    },
    async ({ path }) => {
      try {
        deleteFolder(path);
        return { content: [{ type: 'text', text: 'Folder deleted' }] };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'rename_folder',
    'Rename a folder.',
    {
      path: z.string().describe('Absolute path to the folder'),
      newName: z.string().describe('New folder name'),
    },
    async ({ path, newName }) => {
      try {
        const newPath = renameFolder(path, newName);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ newPath }, null, 2) },
          ],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  server.tool(
    'list_tags',
    'List all tags used across notes with usage counts.',
    {},
    async () => {
      try {
        const tags = listTags();
        return {
          content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }],
        };
      } catch (e) {
        return handleError(e);
      }
    }
  );

  // --- Resources ---

  server.resource(
    'notes-list',
    'graphite://notes',
    { description: 'List of all notes in the vault' },
    async () => {
      const notes = listNotes();
      return {
        contents: [
          {
            uri: 'graphite://notes',
            mimeType: 'application/json',
            text: JSON.stringify(notes, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'folders-list',
    'graphite://folders',
    { description: 'Folder structure of the vault' },
    async () => {
      const folders = listFolders();
      return {
        contents: [
          {
            uri: 'graphite://folders',
            mimeType: 'application/json',
            text: JSON.stringify(folders, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'tags-list',
    'graphite://tags',
    { description: 'All tags with usage counts' },
    async () => {
      const tags = listTags();
      return {
        contents: [
          {
            uri: 'graphite://tags',
            mimeType: 'application/json',
            text: JSON.stringify(tags, null, 2),
          },
        ],
      };
    }
  );

  // Dynamic resource: individual notes
  server.resource(
    'note',
    'graphite://notes/{path}',
    { description: 'Read individual note content' },
    async (uri) => {
      const notePath = uri.pathname.replace(/^\/\//, '/');
      const note = readNote(notePath);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: note.content,
          },
        ],
      };
    }
  );

  return server;
}
