import { CardContent, cn } from "@qida/ui";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "./feedback";

export type ChartSeries = { key: string; label: string; color: string };

const tooltipStyle = { borderRadius: 10, borderColor: "#e2e8f0", boxShadow: "0 12px 28px rgb(15 23 42 / 0.08)" };

export function TrendChart<Row extends object>({ data, xKey, series, height = "h-64", componentId = "trend-chart" }: {
  data: Row[];
  xKey: string;
  series: ChartSeries[];
  height?: string;
  componentId?: string;
}) {
  if (!data.length) return <EmptyState />;
  return <CardContent className={cn("px-3 pb-4 pt-2 sm:px-5", height)} data-component-id={componentId}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ecef" /><XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />{series.map((item, index) => <Line key={item.key} type="monotone" dataKey={item.key} stroke={item.color} strokeWidth={index === 0 ? 2.5 : 2} dot={false} connectNulls={false} name={item.label} />)}</LineChart></ResponsiveContainer></CardContent>;
}

export function CategoryBarChart<Row extends object>({ data, categoryKey, series, height = "h-64", horizontal = true, componentId = "category-bar-chart" }: {
  data: Row[];
  categoryKey: string;
  series: ChartSeries[];
  height?: string;
  horizontal?: boolean;
  componentId?: string;
}) {
  if (!data.length) return <EmptyState />;
  return <CardContent className={cn("px-3 pb-4 pt-2 sm:px-5", height)} data-component-id={componentId}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 4, right: 10, left: horizontal ? 10 : -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={!horizontal} vertical={horizontal} stroke="#e8ecef" />{horizontal ? <><XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey={categoryKey} width={92} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /></> : <><XAxis dataKey={categoryKey} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /></>}<Tooltip contentStyle={tooltipStyle} />{series.length > 1 ? <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} /> : null}{series.map((item) => <Bar key={item.key} dataKey={item.key} fill={item.color} name={item.label} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer></CardContent>;
}

export const chartPalette = { neutral: "#94a3b8", primary: "#16a34a", secondary: "#0f172a", tertiary: "#6366f1" } as const;
