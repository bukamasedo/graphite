import { Skeleton } from '@/components/common/skeleton';

export function FolderTreeSkeleton() {
  return (
    <div className="space-y-1.5 px-1">
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-7 w-4/5" />
      <Skeleton className="h-7 w-3/5" />
      <Skeleton className="h-7 w-4/5" />
    </div>
  );
}
