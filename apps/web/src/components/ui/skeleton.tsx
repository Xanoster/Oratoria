import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-gray-200',
                className
            )}
        />
    );
}

export function SkeletonText({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-4 w-full', className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-2xl bg-white border border-gray-200 p-6', className)}>
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-10 w-24" />
        </div>
    );
}

export function SkeletonAvatar({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-10 w-10 rounded-full', className)} />;
}

export function SkeletonButton({ className }: SkeletonProps) {
    return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />;
}

export function SkeletonList({ count = 3, className }: SkeletonProps & { count?: number }) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <SkeletonAvatar />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard({ className }: SkeletonProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Main card */}
            <SkeletonCard className="p-8" />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}
