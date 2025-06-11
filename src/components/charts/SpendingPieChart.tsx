"use client"

import * as React from "react"
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart" // Assuming ChartConfig is defined in ui/chart

interface SpendingPieChartProps {
  data: { name: string; value: number; fill: string }[];
  title?: string;
  description?: string;
}

const defaultChartConfig: ChartConfig = {}; // You might need to define this based on your categories

export function SpendingPieChart({ data, title = "Spending Distribution", description }: SpendingPieChartProps) {
  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return defaultChartConfig;
    const config: ChartConfig = {};
    data.forEach(item => {
      config[item.name] = { label: item.name, color: item.fill };
    });
    return config;
  }, [data]);


  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{title}</CardTitle>
          {description && <CardDescription className="font-body">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground font-body">No spending data to display.</p>
        </CardContent>
      </Card>
    );
  }
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't render label for very small slices

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };


  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-headline">{title}</CardTitle>
        {description && <CardDescription className="font-body">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Tooltip
                cursor={false}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                formatter={(value: number, name: string) => [`${value.toLocaleString()}`, name]}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
                // label={renderCustomizedLabel} // Using tooltip instead for cleaner look
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
