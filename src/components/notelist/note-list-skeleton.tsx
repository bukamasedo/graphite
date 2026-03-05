import { Skeleton } from '@/components/common/skeleton';

export function NoteListSkeleton() {
  return (
    <div className="p-1 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="px-3 py-2.5 mx-1.5 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}
