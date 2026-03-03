import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  listFolders,
  listTags,
} from './tools/index.js';

export function createServer() {
  const server = new McpServer({
    name: 'graphite-mcp',
    version: '0.1.0',
  });

  server.tool('list_notes', 'List all notes in the vault, optionally filtered by folder', {
    folder: z.string().optional().describe('Folder path to filter by'),
  }, async ({ folder }) => {
    const notes = await listNotes(folder);
    return { content: [{ type: 'text', text: JSON.stringify(notes, null, 2) }] };
  });

  server.tool('get_note', 'Get the full content of a specific note', {
    path: z.string().describe('Relative path to the note (e.g. "My Note.md" or "folder/note.md")'),
  }, async ({ path }) => {
    const note = await getNote(path);
    return { content: [{ type: 'text', text: JSON.stringify(note, null, 2) }] };
  });

  server.tool('create_note', 'Create a new note with optional content', {
    title: z.string().describe('Note title'),
    content: z.string().optional().describe('Note body content (markdown)'),
    folder: z.string().optional().describe('Folder to create the note in'),
    tags: z.array(z.string()).optional().describe('Tags for the note'),
  }, async ({ title, content, folder, tags }) => {
    const note = await createNote(title, content, folder, tags);
    return { content: [{ type: 'text', text: JSON.stringify(note, null, 2) }] };
  });

  server.tool('update_note', 'Update an existing note\'s content or metadata', {
    path: z.string().describe('Relative path to the note'),
    content: z.string().optional().describe('New body content'),
    title: z.string().optional().describe('New title'),
    tags: z.array(z.string()).optional().describe('New tags'),
  }, async ({ path, content, title, tags }) => {
    const note = await updateNote(path, content, title, tags);
    return { content: [{ type: 'text', text: JSON.stringify(note, null, 2) }] };
  });

  server.tool('delete_note', 'Move a note to trash', {
    path: z.string().describe('Relative path to the note'),
  }, async ({ path }) => {
    await deleteNote(path);
    return { content: [{ type: 'text', text: `Deleted: ${path}` }] };
  });

  server.tool('search_notes', 'Full-text search across all notes', {
    query: z.string().describe('Search query'),
  }, async ({ query }) => {
    const results = await searchNotes(query);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  });

  server.tool('list_folders', 'List all folders in the vault', {}, async () => {
    const folders = await listFolders();
    return { content: [{ type: 'text', text: JSON.stringify(folders, null, 2) }] };
  });

  server.tool('list_tags', 'List all tags with their usage counts', {}, async () => {
    const tags = await listTags();
    return { content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }] };
  });

  return {
    start: async () => {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('Graphite MCP server started');
    },
  };
}
