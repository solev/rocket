'use client';

import { Badge } from '~/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { cn } from '~/lib/utils';
import type { ToolUIPart } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { memo, useMemo } from 'react';
import { CodeBlock } from './code-block';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = memo(({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border', className)}
    {...props}
  />
));

Tool.displayName = 'Tool';

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
};

const getStatusBadge = memo((status: ToolUIPart['state']) => {
  const config = useMemo(() => {
    const statusConfig = {
      'input-streaming': { label: 'Pending', icon: CircleIcon },
      'input-available': { label: 'Running', icon: ClockIcon },
      'output-available': { label: 'Completed', icon: CheckCircleIcon },
      'output-error': { label: 'Error', icon: XCircleIcon },
    } as const;

    return statusConfig[status];
  }, [status]);

  const Icon = config.icon;

  return (
    <Badge className="rounded-full text-xs" variant="secondary">
      <Icon className={cn(
        'size-4',
        status === 'input-available' && 'animate-pulse',
        status === 'output-available' && 'text-green-600',
        status === 'output-error' && 'text-red-600'
      )} />
      {config.label}
    </Badge>
  );
});

getStatusBadge.displayName = 'StatusBadge';

export const ToolHeader = memo(({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-4 p-3',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{type}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
));

ToolHeader.displayName = 'ToolHeader';

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = memo(({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
));

ToolContent.displayName = 'ToolContent';

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = memo(({ className, input, ...props }: ToolInputProps) => {
  const formattedInput = useMemo(() => 
    JSON.stringify(input, null, 2), 
    [input]
  );

  return (
    <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Parameters
      </h4>
      <div className="rounded-md bg-muted/50">
        <CodeBlock code={formattedInput} language="json" />
      </div>
    </div>
  );
});

ToolInput.displayName = 'ToolInput';

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = memo(({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground'
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
});

ToolOutput.displayName = 'ToolOutput';
