import { useNoteStore } from '@/stores/note-store';

export interface WikiLinkTarget {
  target: string; // The raw link target
  display: string; // Display text (alias or target)
  path: string | null; // Resolved file path, null if not found
  exists: boolean;
}

export function parseWikiLink(raw: string): {
  target: string;
  display: string;
} {
  const pipeIndex = raw.indexOf('|');
  if (pipeIndex !== -1) {
    return {
      target: raw.slice(0, pipeIndex).trim(),
      display: raw.slice(pipeIndex + 1).trim(),
    };
  }
  return { target: raw.trim(), display: raw.trim() };
}

export function resolveWikiLink(raw: string): WikiLinkTarget {
  const { target, display } = parseWikiLink(raw);
  const notes = useNoteStore.getState().notes;

  // Exact title match (case-insensitive)
  const match = notes.find(
    (n) => n.title.toLowerCase() === target.toLowerCase()
  );

  if (match) {
    return { target, display, path: match.path, exists: true };
  }

  return { target, display, path: null, exists: false };
}

export function navigateToWikiLink(raw: string): void {
  const resolved = resolveWikiLink(raw);
  if (resolved.exists && resolved.path) {
    useNoteStore.getState().selectNote(resolved.path);
  }
}
