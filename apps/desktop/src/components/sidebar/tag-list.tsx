import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash } from 'lucide-react';
import { useNoteStore } from '@/stores/note-store';
import { useAppStore } from '@/stores/app-store';
import { useSidebarStore } from '@/stores/sidebar-store';

export function TagList() {
  const { t } = useTranslation();
  const tags = useSidebarStore((s) => s.tags);
  const loadTags = useSidebarStore((s) => s.loadTags);
  const section = useSidebarStore((s) => s.section);
  const activeIndex = useSidebarStore((s) => s.activeTagIndex);
  const setSection = useSidebarStore((s) => s.setSection);
  const setActiveTagIndex = useSidebarStore((s) => s.setActiveTagIndex);
  const focusedPanel = useAppStore((s) => s.focusedPanel);
  const notes = useNoteStore((s) => s.notes);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (section === 'tags') activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, section]);

  useEffect(() => {
    loadTags();
  }, [notes]);

  const selectTag = useNoteStore((s) => s.selectTag);

  const handleClick = (index: number) => {
    setSection('tags');
    setActiveTagIndex(index);
    selectTag(tags[index].name);
  };

  const isItemActive = (index: number) =>
    focusedPanel === 'sidebar' && section === 'tags' && activeIndex === index;

  if (tags.length === 0) {
    return (
      <div className="px-2 py-2">
        <span className="text-text-muted text-[12px]">{t('emptyState.noTags')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5" role="listbox" aria-label={t('sidebar.tags')}>
      {tags.map((tag, index) => (
        <div
          key={tag.name}
          ref={isItemActive(index) ? activeRef : undefined}
          role="option"
          aria-selected={isItemActive(index)}
          className={`flex items-center justify-between h-7 px-2 rounded text-[13px] cursor-pointer transition-colors duration-100 ${
            isItemActive(index)
              ? 'bg-bg-hover text-accent font-medium'
              : 'text-text-secondary hover:bg-bg-hover'
          }`}
          onClick={() => handleClick(index)}
        >
          <span className="truncate flex items-center gap-2 min-w-0">
            <Hash size={12} className={`flex-shrink-0 ${isItemActive(index) ? 'text-accent' : 'text-text-muted'}`} />
            <span className="truncate">{tag.name}</span>
          </span>
          <span className={`text-[10px] flex-shrink-0 ml-2 min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center ${
            isItemActive(index)
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted'
          }`}>{tag.count}</span>
        </div>
      ))}
    </div>
  );
}
