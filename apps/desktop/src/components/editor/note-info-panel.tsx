import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useNoteStore } from '@/stores/note-store';
import { useEditorStore } from '@/stores/editor-store';
import { formatFullDate } from '@/lib/utils';
import { exportNote, type ExportFormat } from '@/lib/export';
import { TagEditor } from './tag-editor';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface Heading {
  level: number;
  text: string;
  pos: number;
}

export function NoteInfoPanel() {
  const { t } = useTranslation();
  const activeNote = useNoteStore((s) => s.activeNote);
  const pinNote = useNoteStore((s) => s.pinNote);
  const editor = useEditorStore((s) => s.editor);
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (!editor) {
      setHeadings([]);
      return;
    }

    const extractHeadings = () => {
      const result: Heading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          result.push({ level: node.attrs.level, text: node.textContent, pos });
        }
      });
      setHeadings(result);
    };

    extractHeadings();
    editor.on('update', extractHeadings);
    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor]);

  const handleExport = async (format: ExportFormat) => {
    if (!activeNote) return;
    try {
      const data = await invoke<{ content: string }>('read_note', { path: activeNote.path });
      const exported = await exportNote(activeNote.title, data.content, format);
      if (exported) {
        toast.success(t('toast.exported'));
      }
    } catch (e) {
      toast.error(t('toast.exportFailed'));
    }
  };

  if (!activeNote) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--notelist-bg)' }}>
      {/* Header — matches NoteListHeader */}
      <div className="flex items-center px-3 py-2" style={{ minHeight: 40 }}>
        <span className="text-[13px] font-medium text-text-primary">{t('noteInfo.title')}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1">
        <div className="px-2 py-2 min-w-0">
          {/* Outline */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{t('noteInfo.outline')}</div>
            <div className="space-y-0.5">
              {/* Title as H1 */}
              <div
                className="block w-full text-left text-[12px] text-text-secondary rounded px-1 py-0.5 truncate font-medium"
                style={{ paddingLeft: '4px' }}
              >
                {activeNote.title || t('editor.untitled')}
              </div>
              {headings.map((heading, i) => (
                <button
                  key={`${heading.pos}-${i}`}
                  className="block w-full text-left text-[12px] text-text-secondary hover:text-text-primary rounded px-1 py-0.5 hover:bg-white/5 transition-colors truncate"
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 4}px` }}
                  onClick={() => {
                    editor?.chain().setTextSelection(heading.pos + 1).focus().run();
                  }}
                >
                  {heading.text || t('editor.untitled')}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="border-t border-border mt-3 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{t('noteInfo.tags')}</div>
            <TagEditor className="flex flex-wrap items-center gap-1.5" />
          </div>

          {/* Properties */}
          <div className="border-t border-border mt-3 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">{t('noteInfo.properties')}</div>
            <div className="space-y-2">
              {/* Folder */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">{t('noteInfo.folder')}</span>
                <span className="text-[12px] text-text-secondary flex items-center gap-1">
                  <Folder size={12} />
                  {activeNote.folder || t('statusBar.root')}
                </span>
              </div>
              {/* Pinned */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">{t('noteInfo.pinned')}</span>
                <Switch
                  checked={!!activeNote.pinned}
                  onCheckedChange={(checked) => pinNote(activeNote.path, checked)}
                />
              </div>
              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">{t('noteInfo.created')}</span>
                <span className="text-[12px] text-text-secondary">{formatFullDate(activeNote.created)}</span>
              </div>
              {/* Modified */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">{t('noteInfo.modified')}</span>
                <span className="text-[12px] text-text-secondary">{formatFullDate(activeNote.modified)}</span>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="border-t border-border mt-3 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">{t('noteInfo.export')}</div>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="xs" className="justify-start" onClick={() => handleExport('markdown')}>
                {t('contextMenu.exportMarkdown')}
              </Button>
              <Button variant="ghost" size="xs" className="justify-start" onClick={() => handleExport('html')}>
                {t('contextMenu.exportHTML')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
