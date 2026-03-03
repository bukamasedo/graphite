---
paths:
  - "src/**/*.{ts,tsx}"
---

# Zustand

## Store の構造

State と Action を同一 interface に定義する。

```typescript
import { create } from 'zustand';

interface NoteState {
  // --- state ---
  notes: NoteListItem[];
  loading: boolean;
  error: string | null;

  // --- actions ---
  loadNotes: (folder?: string) => Promise<void>;
  createNote: (folder?: string) => Promise<Note>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  loadNotes: async (folder) => {
    set({ loading: true, error: null });
    try {
      const notes = await noteApi.listNotes(folder ?? get().activeFolder);
      set({ notes, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
      toast.error(i18n.t('toast.loadFailed'));
    }
  },
}));
```

## Component での selector

必要なものだけを selector で抽出する。オブジェクトごと取得しない。

```typescript
// OK
const notes = useNoteStore((s) => s.notes);
const loadNotes = useNoteStore((s) => s.loadNotes);

// NG（全 state を購読してしまう）
const store = useNoteStore();
```

## Store 間連携

Store から別の Store を呼ぶ場合は `useOtherStore.getState()` を使う。
複数 Store の協調ロジックはできるだけコンポーネント層に置くことを優先する。

```typescript
// Store 内から別 Store のメソッドを呼ぶ場合
import { useSidebarStore } from '@/stores/sidebar-store';

someAction: () => {
  const { refresh } = useSidebarStore.getState();
  refresh();
},
```

## Middleware

- immer, persist などの middleware は使わない
- 更新はスプレッド演算子で immutable に行う

```typescript
// OK
set({ activeNote: { ...activeNote, title: newTitle } });

// NG
activeNote.title = newTitle; // mutation
```

## Union type の export

Store ファイルから export してよいもの：

```typescript
// OK: 他のコンポーネントが参照する Union type
export type FocusPanel = 'sidebar' | 'notelist' | 'editor';

// NG: Store 内部の state interface は export しない
export interface AppState { ... }  // ← これはしない
```
