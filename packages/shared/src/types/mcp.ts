export interface McpNote {
  path: string;
  title: string;
  content: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
}

export interface McpNoteListItem {
  path: string;
  title: string;
  folder: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
  preview: string;
}

export interface McpSearchResult {
  path: string;
  title: string;
  matches: { line: number; content: string }[];
}
