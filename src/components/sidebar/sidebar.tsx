import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import appIcon from '@/assets/icon.png';
import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/stores/app-store';
import { SettingsSidebar } from '../settings/settings-sidebar';
import { FolderTree } from './folder-tree';
import { TagList } from './tag-list';
import { TrashList } from './trash-list';

export function Sidebar() {
  const viewMode = useAppStore((s) => s.viewMode);

  if (viewMode === 'settings') {
    return <SettingsSidebar />;
  }

  return <NotesSidebar />;
}

type SectionKey = 'folders' | 'trash' | 'tags';

const HEADER_H = 28; // h-7

function SectionHeader({
  label,
  expanded,
  onClick,
}: {
  label: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const Icon = expanded ? ChevronDown : ChevronRight;
  return (
    <button
      type="button"
      className="flex items-center gap-1 w-full h-7 px-2 text-sm font-medium text-text-muted uppercase tracking-wider hover:text-text-muted transition-colors"
      onClick={onClick}
    >
      <Icon size={12} className="shrink-0" />
      {label}
    </button>
  );
}

function NotesSidebar() {
  const { t } = useTranslation();
  const enterSettings = useAppStore((s) => s.enterSettings);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(['folders', 'trash', 'tags'])
  );
  const [closingSections, setClosingSections] = useState<Set<SectionKey>>(
    new Set()
  );
  const [openingSections, setOpeningSections] = useState<Set<SectionKey>>(
    new Set()
  );

  const foldersContentRef = useRef<HTMLDivElement>(null);
  const trashContentRef = useRef<HTMLDivElement>(null);
  const tagsContentRef = useRef<HTMLDivElement>(null);

  const [contentHeights, setContentHeights] = useState<
    Record<SectionKey, number | undefined>
  >({
    folders: undefined,
    trash: undefined,
    tags: undefined,
  });

  const isExpanded = (key: SectionKey) => expandedSections.has(key);
  const isClosing = (key: SectionKey) => closingSections.has(key);
  const isSectionOpen = (key: SectionKey) => isExpanded(key) || isClosing(key);

  const toggle = (key: SectionKey) => {
    if (closingSections.has(key)) {
      // Re-open during close animation (content already mounted, just reverse)
      setClosingSections((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setExpandedSections((prev) => new Set(prev).add(key));
      return;
    }

    if (expandedSections.has(key)) {
      // Start close animation
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setClosingSections((prev) => new Set(prev).add(key));
    } else {
      // Start open animation: mount at 0fr, then transition to 1fr
      setExpandedSections((prev) => new Set(prev).add(key));
      setOpeningSections((prev) => new Set(prev).add(key));
    }
  };

  // After paint with 0fr, clear openingSections to trigger 0fr → 1fr transition
  useEffect(() => {
    if (openingSections.size === 0) return;
    const id = requestAnimationFrame(() => {
      setOpeningSections(new Set());
    });
    return () => cancelAnimationFrame(id);
  }, [openingSections]);

  const handleTransitionEnd = useCallback(
    (key: SectionKey, e: React.TransitionEvent) => {
      if (e.propertyName !== 'grid-template-rows') return;
      setClosingSections((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    []
  );

  const _openKeys = (['folders', 'trash', 'tags'] as SectionKey[])
    .filter((k) => isSectionOpen(k))
    .join(',');

  useLayoutEffect(() => {
    const refs: Record<SectionKey, React.RefObject<HTMLDivElement | null>> = {
      folders: foldersContentRef,
      trash: trashContentRef,
      tags: tagsContentRef,
    };

    const measure = () => {
      setContentHeights((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const key of ['folders', 'trash', 'tags'] as SectionKey[]) {
          const el = refs[key].current;
          const h = el ? el.scrollHeight : undefined;
          if (prev[key] !== h) {
            next[key] = h;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    measure();

    const observers: MutationObserver[] = [];
    for (const key of ['folders', 'trash', 'tags'] as SectionKey[]) {
      const el = refs[key].current;
      if (el) {
        const observer = new MutationObserver(measure);
        observer.observe(el, { childList: true, subtree: true });
        observers.push(observer);
      }
    }

    return () => {
      for (const o of observers) {
        o.disconnect();
      }
    };
  }, []);

  const sectionStyle = (
    key: SectionKey
  ): { maxHeight?: number } | undefined => {
    if (!isSectionOpen(key)) return undefined;
    const openCount = (['folders', 'trash', 'tags'] as SectionKey[]).filter(
      (k) => isSectionOpen(k)
    ).length;
    if (openCount < 2) return undefined;
    const h = contentHeights[key];
    return h !== undefined ? { maxHeight: HEADER_H + h } : undefined;
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--sidebar-bg)',
        paddingTop: 'var(--titlebar-height)',
      }}
    >
      <div className="flex items-center gap-1 px-3 pt-2 pb-3">
        <img src={appIcon} alt="Graphite" className="w-9 h-9 rounded-lg" />
        <span className="text-[15px] font-semibold text-text-primary">
          Graphite
        </span>
      </div>
      <div className="flex-1 px-3 py-2 flex flex-col min-h-0 gap-1">
        {/* Folders */}
        <div
          className={
            isSectionOpen('folders')
              ? 'flex-1 flex flex-col min-h-0'
              : 'flex-shrink-0'
          }
          style={sectionStyle('folders')}
        >
          <SectionHeader
            label={t('sidebar.folders')}
            expanded={isExpanded('folders')}
            onClick={() => toggle('folders')}
          />
          {isSectionOpen('folders') && (
            <div
              className="grid min-h-0 flex-1 transition-[grid-template-rows] duration-150 ease-out"
              style={{
                gridTemplateRows:
                  isExpanded('folders') && !openingSections.has('folders')
                    ? '1fr'
                    : '0fr',
              }}
              onTransitionEnd={(e) => handleTransitionEnd('folders', e)}
            >
              <div className="overflow-hidden min-h-0">
                <div className="overflow-y-auto h-full">
                  <div ref={foldersContentRef} className="space-y-0.5">
                    <FolderTree />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Trash */}
        <div
          className={
            isSectionOpen('trash')
              ? 'flex-1 flex flex-col min-h-0'
              : 'flex-shrink-0'
          }
          style={sectionStyle('trash')}
        >
          <SectionHeader
            label={t('sidebar.trash')}
            expanded={isExpanded('trash')}
            onClick={() => toggle('trash')}
          />
          {isSectionOpen('trash') && (
            <div
              className="grid min-h-0 flex-1 transition-[grid-template-rows] duration-150 ease-out"
              style={{
                gridTemplateRows:
                  isExpanded('trash') && !openingSections.has('trash')
                    ? '1fr'
                    : '0fr',
              }}
              onTransitionEnd={(e) => handleTransitionEnd('trash', e)}
            >
              <div className="overflow-hidden min-h-0">
                <div className="overflow-y-auto h-full">
                  <div ref={trashContentRef} className="space-y-0.5">
                    <TrashList />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Tags */}
        <div
          className={
            isSectionOpen('tags')
              ? 'flex-1 flex flex-col min-h-0'
              : 'flex-shrink-0'
          }
          style={sectionStyle('tags')}
        >
          <SectionHeader
            label={t('sidebar.tags')}
            expanded={isExpanded('tags')}
            onClick={() => toggle('tags')}
          />
          {isSectionOpen('tags') && (
            <div
              className="grid min-h-0 flex-1 transition-[grid-template-rows] duration-150 ease-out"
              style={{
                gridTemplateRows:
                  isExpanded('tags') && !openingSections.has('tags')
                    ? '1fr'
                    : '0fr',
              }}
              onTransitionEnd={(e) => handleTransitionEnd('tags', e)}
            >
              <div className="overflow-hidden min-h-0">
                <div className="overflow-y-auto h-full">
                  <div ref={tagsContentRef} className="space-y-0.5">
                    <TagList />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start text-[13px] px-2"
              onClick={enterSettings}
            >
              <Settings size={14} />
              {t('common.settings')}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t('common.settings')} <Shortcut keys={['Mod', ',']} />
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
