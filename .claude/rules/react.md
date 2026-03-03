---
paths:
  - "src/**/*.{ts,tsx}"
---

# React

## Component

- UI 描画とローカルインタラクションのみ。150 行以下を目安に
- interface Props {} を必ず定義する
- useState は純粋な UI 状態のみ（editing フラグ、入力値など）
- invoke() を Component から直接呼ばない（暫定的に呼ぶ場合も try/catch と toast 必須）

## Store (Zustand)

- 1 ドメイン 1 ファイル
- Tauri 呼び出しは lib/api/ 経由のみ
- エラー処理（toast.error()）はストア内で完結させる
- immer middleware は使わない。スプレッド演算子で immutable 更新する

### 非同期アクションのパターン

```typescript
asyncAction: async (arg) => {
  set({ loading: true, error: null });
  try {
    const result = await noteApi.someAction(arg);
    set({ result, loading: false });
  } catch (e) {
    set({ error: String(e), loading: false });
    toast.error(i18n.t('toast.someFailed'));
  }
},
```

## Hooks

- イベントリスナー・DOM 副作用・複数コンポーネントで共有する UI 挙動に使う
- データ取得・ストア操作はフックではなくストアで行う

### useIMEGuard

`onKeyDown` で Enter を処理するすべての input に適用する。
`onCompositionStart` / `onCompositionEnd` とセットで使うこと。

```typescript
const { onCompositionStart, onCompositionEnd, isComposing } = useIMEGuard();

<input
  onCompositionStart={onCompositionStart}
  onCompositionEnd={onCompositionEnd}
  onKeyDown={(e) => {
    if (isComposing(e.key)) return;
    if (e.key === 'Enter') { /* 処理 */ }
  }}
/>
```

## メモ化方針

- `React.memo`：原則使わない
- `useCallback`：子への prop callback か useEffect 依存配列に入れる場合のみ

## lib/api

- invoke() のラッパーのみ。ビジネスロジックを書かない
- ドメイン単位でファイルを分割（note-api.ts, folder-api.ts …）
