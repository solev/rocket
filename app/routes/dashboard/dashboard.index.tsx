import * as React from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, BarChart, Bar, Line, LineChart } from "recharts";
import { DataTable } from "~/components/dashboard/data-table";
import { columns } from "~/components/dashboard/table-columns";

// Mock analytics data
const revenueData = [
  { month: "Jan", revenue: 8200, signups: 120 },
  { month: "Feb", revenue: 9600, signups: 140 },
  { month: "Mar", revenue: 10400, signups: 152 },
  { month: "Apr", revenue: 11500, signups: 165 },
  { month: "May", revenue: 12250, signups: 171 },
  { month: "Jun", revenue: 13100, signups: 182 },
];

const retentionData = [
  { cohort: "Week 1", retained: 96 },
  { cohort: "Week 2", retained: 82 },
  { cohort: "Week 3", retained: 74 },
  { cohort: "Week 4", retained: 67 },
  { cohort: "Week 5", retained: 63 },
  { cohort: "Week 6", retained: 61 },
];

// Mock table rows
const tableData = Array.from({ length: 15 }).map((_, i) => ({
  id: `usr_${i + 1}`,
  email: `user${i + 1}@example.com`,
  plan: i % 5 === 0 ? "Enterprise" : i % 3 === 0 ? "Pro" : "Free",
  mrr: Math.round(Math.random() * 400 + (i % 3 === 0 ? 200 : 50)),
  createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
}));

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Key product & revenue metrics at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="MRR" value="$13.1k" change="▲ 6.2%" sub="vs last month" positive />
        <MetricCard title="Active Users" value="2,318" change="▲ 4.1%" sub="7‑day avg" positive />
        <MetricCard title="Churn" value="2.4%" change="▼ 0.3%" sub="net monthly" />
        <MetricCard title="ARPU" value="$42.55" change="▲ 1.9%" sub="per active customer" positive />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Revenue & Signups</CardTitle>
            <CardDescription>Trailing 6 months performance</CardDescription>
          </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" }, signups: { label: "Signups", color: "hsl(var(--chart-2))" } }}
                className="h-64 aspect-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#fillRevenue)" />
                    <Line type="monotone" dataKey="signups" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Weekly Retention</CardTitle>
            <CardDescription>Cohort decay pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ retained: { label: "Retained", color: "hsl(var(--chart-3))" } }}
              className="h-64 aspect-auto"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="cohort" tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="retained" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>Most recent signups with plan & MRR</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, change, sub, positive }: { title: string; value: string; change: string; sub: string; positive?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-2">
        <span className={positive ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}>{change}</span>
        <span>{sub}</span>
      </CardContent>
    </Card>
  );
}

