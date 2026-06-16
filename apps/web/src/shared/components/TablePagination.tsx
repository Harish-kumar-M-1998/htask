import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';
import { selectSmClassName } from '@/lib/formStyles';

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const selectClass = selectSmClassName;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-t border-border bg-card px-4 py-3',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          Rows per page
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className={selectClass}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[88px] text-center text-sm text-muted-foreground px-2">
            Page <span className="font-medium text-foreground">{page}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages || 1}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
