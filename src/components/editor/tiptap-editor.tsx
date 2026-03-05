import { mergeAttributes, textblockTypeInputRule } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { useEffect, useRef } from 'react';
import { Markdown } from 'tiptap-markdown';
import { useEditorStore } from '@/stores/editor-store';
import { extractPreview, useNoteStore } from '@/stores/note-store';
import { useSettingsStore } from '@/stores/settings-store';
import { CodeBlockView } from './code-block-view';
import { LinkBubbleMenu } from './link-bubble-menu';

const lowlight = createLowlight(common);

interface Props {
  initialContent: string;
  onSave: (content: string) => void;
  readOnly?: boolean;
}

export function TiptapEditor({
  initialContent,
  onSave,
  readOnly = false,
}: Props) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heavyUpdateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { setDirty, setCursorPosition, setWordCount, setEditor } =
    useEditorStore();
  const settings = useSettingsStore((s) => s.settings);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.extend({
        addInputRules() {
          return [
            // Language + space/enter: ```python ↵ → Python code block
            textblockTypeInputRule({
              find: /^```([a-z]+)[\s\n]$/,
              type: this.type,
              getAttributes: (match) => ({ language: match[1] }),
            }),
            // ``` + space → code block (no language)
            textblockTypeInputRule({
              find: /^```\s$/,
              type: this.type,
              getAttributes: () => ({ language: null }),
            }),
          ];
        },
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
      }).configure({ lowlight }),
      // Remove href from rendered DOM to prevent WKWebView navigation.
      // The URL is preserved in TipTap's internal state and read by the bubble menu
      // via editor.getAttributes('link').href.
      Link.extend({
        renderHTML({ HTMLAttributes }) {
          const { href: _href, ...rest } = HTMLAttributes;
          return ['a', mergeAttributes(rest), 0];
        },
      }).configure({
        openOnClick: false,
        autolink: false,
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
    ],
    content: initialContent,
    autofocus: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: String(settings.spellCheck),
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

      // Auto-save
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const md = editor.storage.markdown.getMarkdown();
        onSaveRef.current(md);
        setDirty(false);
      }, 3000);
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
  }, [editor, setEditor, setWordCount, setDirty]);

  // Update editable state when readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div
      className="tiptap-editor min-h-[50vh]"
      style={
        {
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
          paddingLeft: `${settings.editorPadding}px`,
          paddingRight: `${settings.editorPadding}px`,
          '--editor-line-height': settings.lineHeight,
        } as React.CSSProperties
      }
    >
      <LinkBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
