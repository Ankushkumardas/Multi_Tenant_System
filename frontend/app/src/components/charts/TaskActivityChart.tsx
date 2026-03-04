import { useMemo } from "react";
import { motion } from "framer-motion";

// ── Per-action colour config ──────────────────────────────────────────────────
export const ACTION_META: Record<string, { bar: string; dot: string; label: string }> = {
    TASK_CREATED: { bar: "bg-blue-500", dot: "bg-blue-500", label: "Created" },
    TASK_UPDATED: { bar: "bg-violet-500", dot: "bg-violet-500", label: "Updated" },
    TASK_DELETED: { bar: "bg-red-400", dot: "bg-red-400", label: "Deleted" },
    TASK_ASSIGNED: { bar: "bg-cyan-500", dot: "bg-cyan-500", label: "Assigned" },
    TASK_STATUS_CHANGED: { bar: "bg-emerald-500", dot: "bg-emerald-500", label: "Status Change" },
    TASK_PRIORITY_CHANGED: { bar: "bg-amber-400", dot: "bg-amber-400", label: "Priority" },
    TASK_DUE_DATE_CHANGED: { bar: "bg-orange-400", dot: "bg-orange-400", label: "Due Date" },
};

// ── Build the label list for the last N days ──────────────────────────────────
function buildDayLabels(days: number) {
    const labels: string[] = [];
    const keys: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        keys.push(d.toISOString().slice(0, 10));
        labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return { labels, keys };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface TaskActivityChartProps {
    /** raw daily array from API: { _id: { date, actionType }, count }[] */
    daily: any[];
    /** totals array from API: { _id: actionType, count }[] */
    totals: any[];
    days?: number;
    title?: string;
    /** when true renders a compact vertical-bar chart; false = horizontal bar breakdown */
    barChart?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
const TaskActivityChart = ({
    daily,
    totals,
    days = 14,
    title = "Task Activity",
    barChart = true,
}: TaskActivityChartProps) => {
    const { labels, keys } = useMemo(() => buildDayLabels(days), [days]);

    // Build a map: date → { actionType → count }
    const dayMap = useMemo(() => {
        const m: Record<string, Record<string, number>> = {};
        keys.forEach((k) => { m[k] = {}; });
        daily.forEach((row: any) => {
            const { date, actionType } = row._id;
            if (m[date]) m[date][actionType] = (m[date][actionType] || 0) + row.count;
        });
        return m;
    }, [daily, keys]);

    // Per-day totals for overall bar heights
    const dayTotals = useMemo(() => keys.map((k) => Object.values(dayMap[k] ?? {}).reduce((a, b) => a + b, 0)), [dayMap, keys]);
    const maxDaily = useMemo(() => Math.max(...dayTotals, 1), [dayTotals]);

    // totals map
    const totalMap = useMemo(() => {
        const m: Record<string, number> = {};
        totals.forEach((t: any) => { m[t._id] = t.count; });
        return m;
    }, [totals]);
    const grandTotal = useMemo(() => Object.values(totalMap).reduce((a, b) => a + b, 0), [totalMap]);

    const activeActions = useMemo(
        () => Object.entries(ACTION_META).filter(([key]) => (totalMap[key] ?? 0) > 0),
        [totalMap],
    );

    if (grandTotal === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-400 italic">
                No task activity data yet.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Vertical stacked bar chart ── */}
            {barChart && (
                <div>
                    <div className="flex items-end justify-between gap-1.5 h-[140px] mb-2">
                        {keys.map((key, i) => {
                            const dayTotal = dayTotals[i];
                            const pct = maxDaily > 0 ? (dayTotal / maxDaily) * 100 : 0;
                            // stack segments by action
                            const segments = Object.entries(ACTION_META)
                                .filter(([a]) => dayMap[key]?.[a] > 0)
                                .map(([a, meta]) => ({
                                    action: a,
                                    meta,
                                    segPct: dayTotal > 0 ? ((dayMap[key][a] || 0) / dayTotal) * 100 : 0,
                                }));

                            return (
                                <div key={key} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                                    {/* tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block bg-gray-900 text-white text-[9px] rounded-lg p-2 whitespace-nowrap shadow-xl min-w-max">
                                        <p className="font-bold mb-1">{labels[i]}</p>
                                        {segments.map((s) => (
                                            <p key={s.action} className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.meta.dot}`} />
                                                {s.meta.label}: {dayMap[key][s.action]}
                                            </p>
                                        ))}
                                        {dayTotal === 0 && <p className="text-gray-400">No activity</p>}
                                    </div>
                                    {/* bar */}
                                    <div
                                        className="w-full max-w-[28px] rounded-md overflow-hidden flex flex-col-reverse"
                                        style={{ height: `${Math.max(pct, dayTotal > 0 ? 6 : 2)}%` }}
                                    >
                                        {segments.length === 0 ? (
                                            <div className="flex-1 bg-gray-100 rounded-md" />
                                        ) : (
                                            segments.map((s) => (
                                                <motion.div
                                                    key={s.action}
                                                    initial={{ scaleY: 0 }}
                                                    animate={{ scaleY: 1 }}
                                                    transition={{ duration: 0.5, delay: i * 0.03 }}
                                                    style={{ height: `${s.segPct}%` }}
                                                    className={`w-full ${s.meta.bar} origin-bottom`}
                                                />
                                            ))
                                        )}
                                    </div>
                                    <span className="text-[7px] font-medium text-gray-400 whitespace-nowrap">
                                        {labels[i].slice(0, 6)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {activeActions.map(([key, meta]) => (
                            <span key={key} className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                                <span className={`w-2 h-2 rounded-sm ${meta.dot}`} />
                                {meta.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Horizontal totals breakdown ── */}
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    {barChart ? "Breakdown by Type" : title}
                </p>
                {activeActions.map(([key, meta], i) => {
                    const count = totalMap[key] ?? 0;
                    const pct = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
                    return (
                        <div key={key} className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                            <span className="text-[11px] text-gray-600 font-medium w-28 shrink-0">{meta.label}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, delay: i * 0.06 }}
                                    className={`h-full rounded-full ${meta.bar}`}
                                />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 w-7 text-right">{count}</span>
                            <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                    );
                })}
                <p className="text-[11px] text-gray-400 pt-1">
                    <span className="font-bold text-gray-700">{grandTotal}</span> task events total
                </p>
            </div>
        </div>
    );
};

export default TaskActivityChart;
