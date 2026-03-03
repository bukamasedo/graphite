export interface Note {
  id: string;
  title: string;
  content: string;
  path: string;
  folder: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
}

export interface NoteListItem {
  id: string;
  title: string;
  path: string;
  folder: string;
  tags: string[];
  created: string;
  modified: string;
  pinned: boolean;
  preview: string;
}

export interface Folder {
  name: string;
  path: string;
  children: Folder[];
  noteCount: number;
}

export interface Tag {
  name: string;
  count: number;
}

export interface SearchResult {
  path: string;
  title: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  line: number;
  content: string;
  start: number;
  end: number;
}

export interface TrashItem {
  id: string;
  title: string;
  original_path: string;
  trash_path: string;
  deleted_at: string;
  preview: string;
}
