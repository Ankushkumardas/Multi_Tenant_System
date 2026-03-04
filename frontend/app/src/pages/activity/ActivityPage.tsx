import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useActivityFeed, useActivityStats, useTaskActivityChart } from "../../hooks/useDashboard";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

const rel = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#f97316", "#a855f7"];

// ── Colour by actionType for task-related events ──────────────────────────────
const ACTION_COLORS: Record<string, string> = {
    TASK_CREATED: "#3b82f6",
    TASK_UPDATED: "#8b5cf6",
    TASK_DELETED: "#f43f5e",
    TASK_ASSIGNED: "#06b6d4",
    TASK_STATUS_CHANGED: "#10b981",
    TASK_PRIORITY_CHANGED: "#f59e0b",
    TASK_DUE_DATE_CHANGED: "#f97316",
};
const ACTION_LABEL: Record<string, string> = {
    TASK_CREATED: "Created",
    TASK_UPDATED: "Updated",
    TASK_DELETED: "Deleted",
    TASK_ASSIGNED: "Assigned",
    TASK_STATUS_CHANGED: "Status",
    TASK_PRIORITY_CHANGED: "Priority",
    TASK_DUE_DATE_CHANGED: "Due Date",
};

const CHART_H = 180; // px — fixed so percentage heights resolve correctly

const ActivityPage = () => {
    const { data: activityData, isLoading } = useActivityFeed();
    const { data: activityStatsData } = useActivityStats();
    const { data: taskChartData } = useTaskActivityChart(14);

    const activities: any[] = activityData?.activities ?? activityData ?? [];
    const actStats: any[] = activityStatsData?.stats ?? [];
    const taskDaily: any[] = taskChartData?.daily ?? [];
    const taskTotals: any[] = taskChartData?.totals ?? [];

    const [filter, setFilter] = useState<string>("ALL");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 8;

    const filteredActivities = useMemo(() => {
        if (filter === "ALL") return activities;
        return activities.filter((a: any) => a.actionType === filter || a.action === filter);
    }, [activities, filter]);

    useEffect(() => { setCurrentPage(1); }, [filter, activities.length]);

    // ── General activity bar chart – group by day (last 14 days) ────────────
    const dailyChart = useMemo(() => {
        const days: Record<string, number> = {};
        const labels: string[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days[key] = 0;
            labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }
        activities.forEach((a: any) => {
            const key = new Date(a.createdAt).toISOString().slice(0, 10);
            if (days[key] !== undefined) days[key]++;
        });
        const values = Object.values(days);
        const max = Math.max(...values, 1);
        return { labels, values, max };
    }, [activities]);

    // ── Task chart per day ────────────────────────────────────────────────────
    const { taskDayMap, taskDayTotals, taskDayLabels, taskDayKeys, taskMax } = useMemo(() => {
        const labels: string[] = [];
        const keys: string[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            keys.push(d.toISOString().slice(0, 10));
            labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }
        const map: Record<string, Record<string, number>> = {};
        keys.forEach((k) => { map[k] = {}; });
        taskDaily.forEach((row: any) => {
            const { date, actionType } = row._id;
            if (map[date]) map[date][actionType] = (map[date][actionType] || 0) + row.count;
        });
        const totals = keys.map((k) => Object.values(map[k]).reduce((a, b) => a + b, 0));
        const max = Math.max(...totals, 1);
        return { taskDayMap: map, taskDayTotals: totals, taskDayLabels: labels, taskDayKeys: keys, taskMax: max };
    }, [taskDaily]);

    const taskTotalMap = useMemo(() => {
        const m: Record<string, number> = {};
        taskTotals.forEach((t: any) => { m[t._id] = t.count; });
        return m;
    }, [taskTotals]);
    const taskGrandTotal = Object.values(taskTotalMap).reduce((a, b) => a + b, 0);
    const activeActions = Object.entries(ACTION_COLORS).filter(([k]) => (taskTotalMap[k] ?? 0) > 0);

    const actionTypes = useMemo(() => {
        const set = new Set<string>();
        activities.forEach((a: any) => { if (a.actionType || a.action) set.add(a.actionType || a.action); });
        return Array.from(set);
    }, [activities]);

    return (
        <DashboardLayout title="Activity">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Activity Feed</h1>
                    <p className="text-[13px] text-gray-400 mt-0.5">Track all actions and changes across your workspace.</p>
                </div>

                {/* ── Row 1: General activity over time + By action type ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* General bar chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-5">Activity Over Time (14 Days)</h3>
                        <div className="flex items-end gap-1" style={{ height: CHART_H }}>
                            {dailyChart.labels.map((label, i) => {
                                const px = dailyChart.max > 0
                                    ? Math.max(Math.round((dailyChart.values[i] / dailyChart.max) * CHART_H), dailyChart.values[i] > 0 ? 4 : 2)
                                    : 2;
                                return (
                                    <div key={label} className="flex-1 flex flex-col items-center justify-end gap-1.5 group relative h-full">
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-900 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap z-10 shadow">
                                            {label}: {dailyChart.values[i]}
                                        </div>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: px }}
                                            transition={{ duration: 0.5, delay: i * 0.03 }}
                                            className="w-full max-w-[28px] bg-blue-100 group-hover:bg-blue-500 rounded-t-md transition-colors"
                                        />
                                        <span className="text-[7px] font-medium text-gray-400 whitespace-nowrap">{label.slice(0, 6)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* By action type breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-4">By Action Type</h3>
                        {actStats.length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic py-8 text-center">No data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {actStats.map((s: any, i: number) => {
                                    const total = actStats.reduce((a: number, b: any) => a + b.count, 0);
                                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                                    return (
                                        <div key={s._id}>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="font-semibold text-gray-700 capitalize">{s._id?.replace(/_/g, " ").toLowerCase()}</span>
                                                <span className="font-bold text-gray-400">{s.count}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: palette[i % palette.length] }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-50 mt-1">
                                    <span className="font-bold text-gray-700">{activities.length}</span> total events
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row 2: Task Activity Chart ── */}
                {taskGrandTotal > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[14px] font-bold text-gray-900">Task Activity (14 Days)</h3>
                            <span className="text-[11px] text-gray-400">{taskGrandTotal} task events</span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Stacked bar chart */}
                            <div className="lg:col-span-2">
                                <div className="flex items-end gap-1" style={{ height: 160 }}>
                                    {taskDayKeys.map((key, i) => {
                                        const dayTotal = taskDayTotals[i];
                                        const barH = taskMax > 0
                                            ? Math.max(Math.round((dayTotal / taskMax) * 160), dayTotal > 0 ? 4 : 2)
                                            : 2;
                                        const segments = Object.entries(ACTION_COLORS)
                                            .filter(([a]) => (taskDayMap[key]?.[a] ?? 0) > 0)
                                            .map(([a, color]) => ({
                                                action: a, color,
                                                h: dayTotal > 0 ? Math.max(1, Math.round(((taskDayMap[key][a] || 0) / dayTotal) * barH)) : 0,
                                            }));
                                        return (
                                            <div key={key} className="flex-1 flex flex-col items-center justify-end gap-1.5 group relative h-full">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[8px] px-2 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-xl gap-0.5">
                                                    <span className="font-bold">{taskDayLabels[i]}</span>
                                                    {segments.map((s) => (
                                                        <span key={s.action} className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                                            {ACTION_LABEL[s.action]}: {taskDayMap[key][s.action]}
                                                        </span>
                                                    ))}
                                                    {dayTotal === 0 && <span className="text-gray-400">No activity</span>}
                                                </div>
                                                {/* stacked bar */}
                                                <div className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: barH }}>
                                                    {segments.length === 0
                                                        ? <div className="flex-1 bg-gray-100" />
                                                        : segments.map((s) => (
                                                            <motion.div
                                                                key={s.action}
                                                                initial={{ height: 0 }}
                                                                animate={{ height: s.h }}
                                                                transition={{ duration: 0.5, delay: i * 0.03 }}
                                                                style={{ backgroundColor: s.color }}
                                                                className="w-full"
                                                            />
                                                        ))
                                                    }
                                                </div>
                                                <span className="text-[7px] font-medium text-gray-400 whitespace-nowrap">{taskDayLabels[i].slice(0, 6)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* legend */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                    {activeActions.map(([key, color]) => (
                                        <span key={key} className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                                            {ACTION_LABEL[key]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Horizontal breakdown */}
                            <div className="space-y-2.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Breakdown</p>
                                {activeActions.map(([key, color], i) => {
                                    const count = taskTotalMap[key] ?? 0;
                                    const pct = taskGrandTotal > 0 ? Math.round((count / taskGrandTotal) * 100) : 0;
                                    return (
                                        <div key={key} className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <span className="text-[11px] text-gray-600 w-20 shrink-0">{ACTION_LABEL[key]}</span>
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.6, delay: i * 0.07 }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-700 w-6 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                                <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-50">
                                    <span className="font-bold text-gray-700">{taskGrandTotal}</span> task events total
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Filter Bar ── */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
                    >
                        All ({activities.length})
                    </button>
                    {actionTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === type ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
                        >
                            {type.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>

                {/* ── Activity List ── */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(PAGE_SIZE).fill(0).map((_, i) => (
                                <div key={i} className="px-5 py-4"><div className="h-10 bg-gray-50 animate-pulse rounded-lg" /></div>
                            ))
                        ) : filteredActivities.length === 0 ? (
                            <div className="px-5 py-16 text-center text-[13px] text-gray-400">No activity found for this filter.</div>
                        ) : (
                            (() => {
                                const total = filteredActivities.length;
                                const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                                const page = Math.min(Math.max(1, currentPage), totalPages);
                                const start = (page - 1) * PAGE_SIZE;
                                const end = start + PAGE_SIZE;
                                const pageItems = filteredActivities.slice(start, end);
                                return (
                                    <>
                                        {pageItems.map((a: any, i: number) => (
                                            <div key={start + i} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                                    style={{ backgroundColor: ACTION_COLORS[a.actionType] ?? palette[(start + i) % palette.length] }}
                                                >
                                                    {a.userId?.name?.[0]?.toUpperCase() ?? "S"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[13px] font-semibold text-gray-900">{a.userId?.name ?? "System"}</p>
                                                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 rounded">
                                                            {a.actionType || a.action}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-gray-500 mt-0.5">
                                                        {a.details?.description || a.description || a.message || `Performed ${a.actionType || a.action}`}
                                                    </p>
                                                    {a.entityType && (
                                                        <span className="inline-block mt-1 text-[10px] text-gray-400 font-medium">
                                                            {a.entityType} {a.projectId ? `· Project: ${typeof a.projectId === "object" ? a.projectId.name : a.projectId}` : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-medium">{rel(a.createdAt)}</span>
                                                    <p className="text-[9px] text-gray-300 mt-0.5">{fmtDate(a.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        <div className="px-5 py-4 flex items-center justify-between border-gray-50 border-t bg-white">
                                            <div className="text-sm text-gray-500">
                                                Showing <span className="font-semibold text-gray-900">{Math.min(start + 1, total)}</span> – <span className="font-semibold text-gray-900">{Math.min(end, total)}</span> of <span className="font-semibold text-gray-900">{total}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded-md text-sm ${page === 1 ? "text-gray-300 border border-gray-100" : "text-gray-600 border border-gray-100 hover:bg-gray-50"}`}>Prev</button>
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                                                    const startP = Math.max(1, Math.min(page - 2, totalPages - 4));
                                                    return startP + idx;
                                                }).filter(p => p <= totalPages).map(p => (
                                                    <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-md text-sm ${p === page ? "bg-gray-900 text-white" : "border border-gray-100 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
                                                ))}
                                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-3 py-1 rounded-md text-sm ${page === totalPages ? "text-gray-300 border border-gray-100" : "text-gray-600 border border-gray-100 hover:bg-gray-50"}`}>Next</button>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ActivityPage;
