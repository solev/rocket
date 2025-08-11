import type { ColumnDef } from '@tanstack/react-table';

export type CustomerRow = {
  id: string;
  email: string;
  plan: string;
  mrr: number;
  createdAt: string;
};

export const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => (
      <span className="font-medium text-foreground">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ getValue }) => {
      const plan = String(getValue());
      return (
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize bg-muted/40">
          {plan}
        </span>
      );
    },
  },
  {
    accessorKey: 'mrr',
    header: 'MRR',
    cell: ({ getValue }) => {
      const v = Number(getValue());
      return <span className="tabular-nums">${v.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ getValue }) => {
      const d = new Date(String(getValue()));
      return <time dateTime={d.toISOString()} className="text-muted-foreground tabular-nums">{d.toISOString().slice(0,10)}</time>;
    },
  },
];
