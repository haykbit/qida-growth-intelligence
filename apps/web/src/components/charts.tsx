import { CardContent } from "@qida/ui";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "./feedback";

const colors = { leads: "#94a3b8", sql: "#14b8a6", altas: "#6366f1", primary: "#0d9488", secondary: "#8b5cf6" };

export function FunnelTrendChart({ data }: { data: Array<{ period: string; leads: number; sql: number; altas: number }> }) {
  if (!data.length) return <EmptyState />;
  return <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Legend iconType="circle" /><Line type="monotone" dataKey="leads" stroke={colors.leads} strokeWidth={2} dot={false} name="Leads" /><Line type="monotone" dataKey="sql" stroke={colors.sql} strokeWidth={2.5} dot={false} name="SQL" /><Line type="monotone" dataKey="altas" stroke={colors.altas} strokeWidth={2.5} dot={false} name="Altas" /></LineChart></ResponsiveContainer></CardContent>;
}

export function BreakdownBarChart({ data, valueName = "Valor", secondaryName }: { data: Array<{ name: string; value: number; secondary?: number | undefined }>; valueName?: string; secondaryName?: string }) {
  if (!data.length) return <EmptyState />;
  return <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Legend iconType="circle" /><Bar dataKey="value" fill={colors.primary} radius={[0, 4, 4, 0]} name={valueName} />{secondaryName ? <Bar dataKey="secondary" fill={colors.secondary} radius={[0, 4, 4, 0]} name={secondaryName} /> : null}</BarChart></ResponsiveContainer></CardContent>;
}

export function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data.length) return <EmptyState />;
  const palette = ["#0d9488", "#6366f1", "#f59e0b", "#f43f5e", "#94a3b8", "#8b5cf6"];
  return <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2}>{data.map((point, index) => <Cell key={point.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip /><Legend iconType="circle" /></PieChart></ResponsiveContainer></CardContent>;
}

export function ComparisonChart({ data, keys }: { data: Array<Record<string, string | number>>; keys: Array<{ key: string; label: string; color: string }> }) {
  if (!data.length) return <EmptyState />;
  return <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Legend iconType="circle" />{keys.map((item) => <Bar key={item.key} dataKey={item.key} fill={item.color} name={item.label} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer></CardContent>;
}

export function ExperimentLineChart({ data }: { data: Array<{ period: string; control: number; treatment: number }> }) {
  if (!data.length) return <EmptyState />;
  return <CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Legend iconType="circle" /><Line type="monotone" dataKey="control" stroke="#94a3b8" strokeWidth={2} dot={false} name="Control" /><Line type="monotone" dataKey="treatment" stroke="#0d9488" strokeWidth={2.5} dot={false} name="Tratamiento" /></LineChart></ResponsiveContainer></CardContent>;
}
