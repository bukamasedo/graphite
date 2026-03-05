import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns2,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { HistoryPopover } from '@/components/editor/history-popover';
import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { commandRegistry } from '@/lib/commands/registry';
import { useAppStore } from '@/stores/app-store';
import { useHistoryStore } from '@/stores/history-store';

export function TitleBar() {
  const { t } = useTranslation();
  const viewMode = useAppStore((s) => s.viewMode);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleNoteList = useAppStore((s) => s.toggleNoteList);
  const toggleNoteInfo = useAppStore((s) => s.toggleNoteInfo);
  const canGoBack = useHistoryStore((s) => s.canGoBack());
  const canGoForward = useHistoryStore((s) => s.canGoForward());

  const handleBack = () => commandRegistry.execute('history:back');
  const handleForward = () => commandRegistry.execute('history:forward');

  const handleMouseDown = (e: MouseEvent) => {
    // Only drag on left-click directly on the titlebar (not on buttons)
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    getCurrentWindow().startDragging();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: titlebar drag region
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 flex items-center select-none"
      style={{
        height: 'var(--titlebar-height)',
        background: 'var(--bg-primary)',
        zIndex: 50,
        paddingLeft: 74,
        paddingRight: 12,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Navigation (left) — hidden in settings mode */}
      {viewMode !== 'settings' && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:pointer-events-none"
                onClick={handleBack}
                disabled={!canGoBack}
              >
                <ChevronLeft size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('titleBar.back')} <Shortcut keys={['Mod', '[']} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:pointer-events-none"
                onClick={handleForward}
                disabled={!canGoForward}
              >
                <ChevronRight size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('titleBar.forward')} <Shortcut keys={['Mod', ']']} />
            </TooltipContent>
          </Tooltip>
          <HistoryPopover>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-text-muted hover:text-text-secondary"
            >
              <Clock size={15} />
            </Button>
          </HistoryPopover>
        </div>
      )}

      {/* Drag region */}
      <div className="flex-1" data-tauri-drag-region />

      {/* Actions (right) — hidden in settings mode */}
      {viewMode !== 'settings' && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-muted hover:text-text-secondary"
                onClick={toggleSidebar}
              >
                <PanelLeft size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('titleBar.toggleSidebar')} <Shortcut keys={['Mod', '1']} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-muted hover:text-text-secondary"
                onClick={toggleNoteList}
              >
                <Columns2 size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('titleBar.toggleNoteList')} <Shortcut keys={['Mod', '2']} />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-muted hover:text-text-secondary"
                onClick={toggleNoteInfo}
              >
                <PanelRight size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('titleBar.toggleNoteInfo')} <Shortcut keys={['Mod', '3']} />
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
