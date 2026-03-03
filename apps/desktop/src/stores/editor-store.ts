import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

interface EditorState {
  lineNumber: number;
  column: number;
  wordCount: number;
  charCount: number;
  dirty: boolean;
  editor: Editor | null;

  setCursorPosition: (line: number, col: number) => void;
  setWordCount: (words: number, chars: number) => void;
  setDirty: (dirty: boolean) => void;
  setEditor: (editor: Editor | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  lineNumber: 1,
  column: 1,
  wordCount: 0,
  charCount: 0,
  dirty: false,
  editor: null,

  setCursorPosition: (line, col) => set({ lineNumber: line, column: col }),
  setWordCount: (words, chars) => set({ wordCount: words, charCount: chars }),
  setDirty: (dirty) => set({ dirty }),
  setEditor: (editor) => set({ editor }),
}));
