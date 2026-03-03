import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { useEditorStore } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useNoteStore, extractPreview } from '@/stores/note-store';
import { WikiLinkDecoration } from './extensions/wiki-link-decoration';
import { MathDecoration } from './extensions/math-decoration';
import { MermaidRenderer } from './extensions/mermaid-renderer';
import { ExternalLinkHandler } from './extensions/external-link-handler';

const lowlight = createLowlight(common);

interface Props {
  initialContent: string;
  onSave: (content: string) => void;
  readOnly?: boolean;
}

// Custom extension for Mod+S save shortcut
const SaveExtension = Extension.create<{ onSave: () => void }>({
  name: 'save',
  addKeyboardShortcuts() {
    return {
      'Mod-s': () => {
        this.options.onSave();
        return true;
      },
    };
  },
});

export function TiptapEditor({ initialContent, onSave, readOnly = false }: Props) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heavyUpdateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { setDirty, setCursorPosition, setWordCount, setEditor } = useEditorStore();
  const settings = useSettingsStore((s) => s.settings);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const handleManualSave = useCallback(() => {
    if (!editor) return;
    clearTimeout(saveTimerRef.current);
    const md = editor.storage.markdown.getMarkdown();
    onSaveRef.current(md);
    setDirty(false);
  }, [setDirty]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CharacterCount,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      SaveExtension.configure({ onSave: () => handleManualSave() }),
      WikiLinkDecoration,
      MathDecoration,
      MermaidRenderer,
      ExternalLinkHandler,
    ],
    content: initialContent,
    autofocus: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: settings.spellCheck ? 'true' : 'false',
      },
    },
    onUpdate: ({ editor }) => {
      setDirty(true);

      // Debounce heavy processing (markdown extraction, store updates, word count)
      clearTimeout(heavyUpdateTimerRef.current);
      heavyUpdateTimerRef.current = setTimeout(() => {
        const md = editor.storage.markdown.getMarkdown();
        useNoteStore.getState().updateActiveContent(md);
        useNoteStore.getState().setActiveNotePreview(extractPreview(md));

        const text = md.trim();
        const words = text ? text.split(/\s+/).length : 0;
        setWordCount(words, md.length);
      }, 300);

      // Auto-save (separate timer, uses its own interval)
      clearTimeout(saveTimerRef.current);
      if (settings.autoSave) {
        saveTimerRef.current = setTimeout(() => {
          const md = editor.storage.markdown.getMarkdown();
          onSaveRef.current(md);
          setDirty(false);
        }, settings.autoSaveInterval);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      // O(1): root-level block index as line approximation
      const line = $pos.index(0) + 1;
      const col = $pos.parentOffset + 1;
      setCursorPosition(line, col);
    },
  });

  // Register editor in store
  useEffect(() => {
    if (editor) {
      setEditor(editor);

      // Initial word/char count
      const md = editor.storage.markdown.getMarkdown();
      const text = md.trim();
      const words = text ? text.split(/\s+/).length : 0;
      setWordCount(words, md.length);
    }
    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(heavyUpdateTimerRef.current);
      // Flush unsaved changes before unmount
      if (editor && useEditorStore.getState().dirty) {
        const md = editor.storage.markdown.getMarkdown();
        onSaveRef.current(md);
        setDirty(false);
      }
      setEditor(null);
    };
  }, [editor, setEditor, setWordCount]);

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div
      className="tiptap-editor min-h-[50vh] px-6"
      style={{
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
