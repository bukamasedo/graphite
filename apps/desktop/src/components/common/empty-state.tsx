import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Shortcut } from '@/components/ui/kbd';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  shortcut?: string[];
}

export function EmptyState({ icon: Icon, title, description, action, shortcut }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full gap-4 px-6 select-none">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-hover/60">
        <Icon size={26} strokeWidth={1.5} className="text-text-muted/50" />
      </div>
      <div className="text-center space-y-1.5">
        <div className="text-[13px] font-medium text-text-secondary">{title}</div>
        {description && (
          <div className="text-xs text-text-muted/70 leading-relaxed">{description}</div>
        )}
      </div>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1 text-xs gap-2"
          onClick={action.onClick}
        >
          {action.label}
          {shortcut && <Shortcut keys={shortcut} className="ml-0 opacity-60" />}
        </Button>
      )}
      {!action && shortcut && (
        <Shortcut keys={shortcut} />
      )}
    </div>
  );
}
