import { useAuditLogs, useAuditStats, useTaskActivityChart } from "../../hooks/useDashboard";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

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

// ── colour array for audit event types ───────────────────────────────────────
const palette = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#f97316", "#a855f7", "#ec4899"];

const CHART_H = 160;

const AuditPage = () => {
    const { data: logsData = { logs: [], total: 0 }, isLoading } = useAuditLogs();
    const { data: auditStatsRaw } = useAuditStats();
    const { data: taskChartData } = useTaskActivityChart(14);
    const [filter, setFilter] = useState("ALL");
    const PAGE_SIZE = 10;

    const logsArray: any[] = Array.isArray(logsData.logs) ? logsData.logs : [];
    const total: number = logsData.total ?? 0;

    // The API returns { stats: [...] }
    const auditStats: any[] = useMemo(() => {
        if (Array.isArray(auditStatsRaw)) return auditStatsRaw;
        if (Array.isArray(auditStatsRaw?.stats)) return auditStatsRaw.stats;
        return [];
    }, [auditStatsRaw]);

    const taskDaily: any[] = taskChartData?.daily ?? [];
    const taskTotals: any[] = taskChartData?.totals ?? [];

    const filteredLogs = useMemo(() => {
        if (filter === "ALL") return logsArray;
        return logsArray.filter((log: any) => log.action === filter);
    }, [logsArray, filter]);

    const actionTypes = useMemo<string[]>(() => {
        const types = new Set(logsArray.map((log: any) => log.action));
        return Array.from(types) as string[];
    }, [logsData]);

    // ── Task chart ────────────────────────────────────────────────────────────
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

    const rel = (d: string) => {
        const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
        if (m < 1) return "just now";
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };
    const fmtDate = (d: string) => new Date(d).toLocaleString();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
                <p className="text-[13px] text-gray-400 mt-0.5">
                    Review security events, user actions, and system changes.{" "}
                    <span className="font-semibold text-gray-500">{total} total records.</span>
                </p>
            </div>

            {/* ── Row 1: Audit events by type + summary cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="text-[14px] font-bold text-gray-900 mb-5">Audit Events by Type</h3>
                    {auditStats.length === 0 ? (
                        <p className="text-[12px] text-gray-400 italic py-8 text-center">No audit stats available.</p>
                    ) : (
                        <div className="space-y-3">
                            {auditStats.map((item: any, i: number) => {
                                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                return (
                                    <div key={item._id} className="group">
                                        <div className="flex justify-between text-[11px] mb-1.5">
                                            <span className="font-semibold text-gray-700 capitalize">{String(item._id).replace(/_/g, " ").toLowerCase()}</span>
                                            <span className="font-bold text-gray-900">{item.count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                                        </div>
                                        <div className="h-5 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                                className="h-full rounded-lg group-hover:opacity-90 transition-opacity"
                                                style={{ backgroundColor: palette[i % palette.length] }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Events</p>
                        <p className="text-3xl font-bold text-gray-900">{total}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Event Types</p>
                        <p className="text-3xl font-bold text-gray-900">{auditStats.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Event</p>
                        <p className="text-base font-bold text-gray-900 capitalize leading-snug">
                            {String(auditStats[0]?._id ?? "—").replace(/_/g, " ").toLowerCase()}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{auditStats[0]?.count || 0} occurrences</p>
                    </div>
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
                            <div className="flex items-end gap-1" style={{ height: CHART_H }}>
                                {taskDayKeys.map((key, i) => {
                                    const dayTotal = taskDayTotals[i];
                                    const barH = taskMax > 0
                                        ? Math.max(Math.round((dayTotal / taskMax) * CHART_H), dayTotal > 0 ? 4 : 2)
                                        : 2;
                                    const segments = Object.entries(ACTION_COLORS)
                                        .filter(([a]) => (taskDayMap[key]?.[a] ?? 0) > 0)
                                        .map(([a, color]) => ({
                                            action: a, color,
                                            h: dayTotal > 0 ? Math.max(1, Math.round(((taskDayMap[key][a] || 0) / dayTotal) * barH)) : 0,
                                        }));
                                    return (
                                        <div key={key} className="flex-1 flex flex-col items-center justify-end gap-1.5 group relative h-full">
                                            {/* tooltip */}
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[8px] px-2 py-1.5 rounded-lg whitespace-nowrap z-10 shadow-xl gap-0.5">
                                                <span className="font-bold">{taskDayLabels[i]}</span>
                                                {segments.map((s) => (
                                                    <span key={s.action} className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                                        {ACTION_LABEL[s.action]}: {taskDayMap[key][s.action]}
                                                    </span>
                                                ))}
                                                {dayTotal === 0 && <span className="text-gray-400">No activity</span>}
                                            </div>
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
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                                {activeActions.map(([key, color]) => (
                                    <span key={key} className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                                        {ACTION_LABEL[key]}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {/* Breakdown */}
                        <div className="space-y-2.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">By Action</p>
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
                                <span className="font-bold text-gray-700">{taskGrandTotal}</span> task events
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter chips ── */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter("ALL")} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}>All</button>
                {actionTypes.map((type: string) => (
                    <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === type ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}>
                        {type.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            {/* ── Logs table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Agent</th>
                            <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(PAGE_SIZE).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-5 bg-gray-50 animate-pulse rounded" /></td></tr>
                            ))
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-16 text-center text-[12px] text-gray-400">No audit logs found.</td></tr>
                        ) : (
                            filteredLogs.slice(0, PAGE_SIZE).map((log: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3">
                                        <span
                                            className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                                            style={{ backgroundColor: ACTION_COLORS[log.action] ?? "#6b7280" }}
                                        >
                                            {log.action || "Unknown"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-white text-[9px] font-bold">
                                                {log.actorUserId?.name?.[0]?.toUpperCase() || "S"}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-semibold text-gray-900">{log.actorUserId?.name || "System"}</p>
                                                <p className="text-[10px] text-gray-400">{log.actorUserId?.email || ""}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3"><span className="text-[11px] font-mono text-gray-500">{log.ipAddress || "—"}</span></td>
                                    <td className="px-5 py-3"><span className="text-[10px] text-gray-400 truncate max-w-[200px] block" title={log.userAgent}>{log.userAgent || "—"}</span></td>
                                    <td className="px-5 py-3">
                                        <p className="text-[11px] text-gray-600">{rel(log.createdAt)}</p>
                                        <p className="text-[9px] text-gray-400">{fmtDate(log.createdAt)}</p>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditPage;
