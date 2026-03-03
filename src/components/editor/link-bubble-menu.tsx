import { open } from '@tauri-apps/plugin-shell';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react';
import {
  Bold,
  Check,
  Code,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Pencil,
  Strikethrough,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useIMEGuard } from '@/hooks/use-ime-guard';

interface Props {
  editor: Editor;
}

export function LinkBubbleMenu({ editor }: Props) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    onCompositionStart,
    onCompositionEnd,
    isComposing: isIMEComposing,
  } = useIMEGuard();

  const isLink = editor.isActive('link');
  const currentUrl = editor.getAttributes('link').href ?? '';

  // Sync URL and reset edit mode when the active link changes
  useEffect(() => {
    setUrl(currentUrl || '');
    setEditing(false);
  }, [currentUrl]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const startEdit = () => {
    setUrl(currentUrl || '');
    setEditing(true);
  };

  const applyLink = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setUrl(currentUrl || '');
    setEditing(false);
    editor.chain().focus().run();
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const openLink = () => {
    if (currentUrl) open(currentUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isIMEComposing(e.key)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      applyLink();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const shouldShow = ({ editor }: { editor: Editor }) => {
    if (!editor.isEditable) return false;
    if (editor.isActive('link')) return true;
    const { selection } = editor.state;
    return !selection.empty && !editor.isActive('codeBlock');
  };

  const btnClass = (active: boolean) =>
    `flex items-center justify-center w-6 h-6 rounded transition-colors ${
      active
        ? 'bg-white/15 text-text-primary'
        : 'hover:bg-white/10 text-text-secondary hover:text-text-primary'
    }`;

  const iconBtnClass =
    'flex items-center justify-center w-6 h-6 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors';

  const sep = <div className="w-px h-4 bg-white/10 mx-0.5 flex-shrink-0" />;

  const formatButtons = [
    {
      icon: Bold,
      title: 'ボールド',
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      icon: Italic,
      title: 'イタリック',
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      icon: Strikethrough,
      title: '取り消し線',
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive('strike'),
    },
    {
      icon: Code,
      title: 'インラインコード',
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive('code'),
    },
    null, // separator
    {
      icon: Heading1,
      title: '見出し1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: Heading2,
      title: '見出し2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: Heading3,
      title: '見出し3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    null, // separator
    {
      icon: List,
      title: '箇条書き',
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      title: '番号付きリスト',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    {
      icon: ListChecks,
      title: 'チェックリスト',
      action: () => editor.chain().focus().toggleTaskList().run(),
      active: editor.isActive('taskList'),
    },
  ];

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      tippyOptions={{ duration: 100, interactive: true }}
    >
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 shadow-xl text-[12px]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {editing ? (
          /* View 3: リンク編集 */
          <>
            <Link2 size={12} className="text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onKeyDown={handleKeyDown}
              placeholder="https://"
              className="bg-transparent outline-none text-text-primary placeholder:text-text-muted w-52"
            />
            {sep}
            <button onClick={applyLink} className={iconBtnClass} title="適用">
              <Check size={12} />
            </button>
            <button
              onClick={cancelEdit}
              className={iconBtnClass}
              title="キャンセル"
            >
              <X size={12} />
            </button>
          </>
        ) : isLink ? (
          /* View 2: リンク表示 */
          <>
            <Link2 size={12} className="text-text-muted flex-shrink-0" />
            <span className="text-text-secondary truncate max-w-[180px]">
              {currentUrl}
            </span>
            {sep}
            <button onClick={startEdit} className={iconBtnClass} title="編集">
              <Pencil size={12} />
            </button>
            <button
              onClick={openLink}
              className={iconBtnClass}
              title="ブラウザで開く"
            >
              <ExternalLink size={12} />
            </button>
            <button
              onClick={removeLink}
              className={`${iconBtnClass} hover:text-red-400`}
              title="リンクを削除"
            >
              <Trash2 size={12} />
            </button>
          </>
        ) : (
          /* View 1: フォーマット */
          <>
            {formatButtons.map((btn, i) =>
              btn === null ? (
                <div
                  key={i}
                  className="w-px h-4 bg-white/10 mx-0.5 flex-shrink-0"
                />
              ) : (
                <button
                  key={btn.title}
                  onClick={btn.action}
                  className={btnClass(btn.active)}
                  title={btn.title}
                >
                  <btn.icon size={12} />
                </button>
              )
            )}
            {sep}
            <button
              onClick={startEdit}
              className={btnClass(editor.isActive('link'))}
              title="リンクを追加"
            >
              <Link2 size={12} />
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
