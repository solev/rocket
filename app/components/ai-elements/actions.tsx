'use client';

import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { ComponentProps } from 'react';
import { memo } from 'react';

export type ActionsProps = ComponentProps<'div'>;

export const Actions = memo(({ className, children, ...props }: ActionsProps) => (
  <TooltipProvider>
    <div className={cn('flex items-center gap-1', className)} {...props}>
      {children}
    </div>
  </TooltipProvider>
));

Actions.displayName = 'Actions';

export type ActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const Action = memo(({
  tooltip,
  children,
  label,
  className,
  variant = 'ghost',
  size = 'sm',
  ...props
}: ActionProps) => {
  const button = (
    <Button
      className={cn(
        'size-9 p-1.5 text-muted-foreground hover:text-foreground relative',
        className
      )}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
});

Action.displayName = 'Action';
