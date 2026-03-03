import { create } from 'zustand';

const MAX_STACK_SIZE = 100;

interface HistoryState {
  stack: string[];
  cursor: number;

  push: (path: string) => void;
  goBack: () => string | null;
  goForward: () => string | null;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getEntries: () => string[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  stack: [],
  cursor: -1,

  push: (path: string) => {
    const { stack, cursor } = get();
    // Deduplicate consecutive entries
    if (cursor >= 0 && stack[cursor] === path) return;
    // Truncate forward history (browser-style)
    const newStack = stack.slice(0, cursor + 1);
    newStack.push(path);
    // Enforce max stack size
    if (newStack.length > MAX_STACK_SIZE) {
      newStack.shift();
    }
    set({ stack: newStack, cursor: newStack.length - 1 });
  },

  goBack: () => {
    const { stack, cursor } = get();
    if (cursor <= 0) return null;
    const newCursor = cursor - 1;
    set({ cursor: newCursor });
    return stack[newCursor];
  },

  goForward: () => {
    const { stack, cursor } = get();
    if (cursor >= stack.length - 1) return null;
    const newCursor = cursor + 1;
    set({ cursor: newCursor });
    return stack[newCursor];
  },

  canGoBack: () => get().cursor > 0,

  canGoForward: () => {
    const { stack, cursor } = get();
    return cursor < stack.length - 1;
  },

  getEntries: () => get().stack,
}));
