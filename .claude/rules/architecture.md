# Architecture

## Layer

Component → Store → lib/api → Rust (Tauri command)

- invoke() は src/lib/api/ にのみ書く
- Component は Store メソッドを呼ぶ（invoke() 直書き禁止）
- Store 間の直接参照禁止。複数 Store の連携はコンポーネント層で行う

## Directory

src/
├── components/{feature}/  # UI のみ
├── stores/                # Zustand（1 ドメイン 1 ファイル）
├── hooks/                 # イベントリスナー・DOM 副作用
├── lib/
│   ├── api/               # invoke() ラッパー（ドメイン単位で分割）
│   └── commands/
└── types/                 # 共有型定義
