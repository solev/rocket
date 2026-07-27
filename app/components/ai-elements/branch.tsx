'use client';

import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import type { UIMessage } from 'ai';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react';
import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';

type BranchContextType = {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
};

const BranchContext = createContext<BranchContextType | null>(null);

const useBranch = () => {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error('Branch components must be used within Branch');
  }

  return context;
};

export type BranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const Branch = memo(({
  defaultBranch = 0,
  onBranchChange,
  className,
  children,
  ...props
}: BranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  
  const childrenArray = useMemo(() => 
    Array.isArray(children) ? children : [children].filter(Boolean), 
    [children]
  );

  const handleBranchChange = useCallback((newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  }, [onBranchChange]);

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : childrenArray.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, childrenArray.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < childrenArray.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, childrenArray.length, handleBranchChange]);

  const contextValue: BranchContextType = useMemo(() => ({
    currentBranch,
    totalBranches: childrenArray.length,
    goToPrevious,
    goToNext,
  }), [currentBranch, childrenArray.length, goToPrevious, goToNext]);

  return (
    <BranchContext.Provider value={contextValue}>
      <div
        className={cn('grid w-full gap-2 [&>div]:pb-0', className)}
        {...props}
      >
        {childrenArray.map((branch, index) => (
          <div
            className={cn(
              'grid gap-2 overflow-hidden [&>div]:pb-0',
              index === currentBranch ? 'block' : 'hidden'
            )}
            key={branch.key || index}
          >
            {branch}
          </div>
        ))}
      </div>
    </BranchContext.Provider>
  );
});

Branch.displayName = 'Branch';

export type BranchMessagesProps = HTMLAttributes<HTMLDivElement>;

// Remove BranchMessages component as it's now integrated into Branch
// export const BranchMessages = ({ children, ...props }: BranchMessagesProps) => {
//   console.warn('BranchMessages is deprecated. Use Branch directly with children.');
//   return <div {...props}>{children}</div>;
// };
//       {...props}
//     >
//       {branch}
//     </div>
//   ));
// };

export type BranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const BranchSelector = memo(({
  className,
  from,
  ...props
}: BranchSelectorProps) => {
  const { totalBranches } = useBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 self-end px-10',
        from === 'assistant' ? 'justify-start' : 'justify-end',
        className
      )}
      {...props}
    />
  );
});

BranchSelector.displayName = 'BranchSelector';

export type BranchPreviousProps = ComponentProps<typeof Button>;

export const BranchPrevious = memo(({
  className,
  children,
  ...props
}: BranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useBranch();

  return (
    <Button
      aria-label="Previous branch"
      className={cn(
        'size-7 shrink-0 rounded-full text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
});

BranchPrevious.displayName = 'BranchPrevious';

export type BranchNextProps = ComponentProps<typeof Button>;

export const BranchNext = memo(({
  className,
  children,
  ...props
}: BranchNextProps) => {
  const { goToNext, totalBranches } = useBranch();

  return (
    <Button
      aria-label="Next branch"
      className={cn(
        'size-7 shrink-0 rounded-full text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
});

BranchNext.displayName = 'BranchNext';

export type BranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const BranchPage = memo(({ className, ...props }: BranchPageProps) => {
  const { currentBranch, totalBranches } = useBranch();

  return (
    <span
      className={cn(
        'font-medium text-muted-foreground text-xs tabular-nums',
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </span>
  );
});

BranchPage.displayName = 'BranchPage';
