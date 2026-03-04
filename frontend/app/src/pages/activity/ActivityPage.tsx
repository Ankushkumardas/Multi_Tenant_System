import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useActivityFeed, useActivityStats } from "../../hooks/useDashboard";
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

const colors = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-500", "bg-cyan-600"];

const ActivityPage = () => {
    const { data: activityData, isLoading } = useActivityFeed();
    const { data: activityStatsData } = useActivityStats();
    const activities: any[] = activityData?.activities ?? activityData ?? [];
    const actStats: any[] = activityStatsData?.stats ?? [];
    const [filter, setFilter] = useState<string>("ALL");
    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 8; // show 8 items per page

    // Filter activities
    const filteredActivities = useMemo(() => {
        if (filter === "ALL") return activities;
        return activities.filter((a: any) => a.actionType === filter || a.action === filter);
    }, [activities, filter]);

    // Reset page when filter or activity list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, activities.length]);

    // Activity bar chart — group by day (last 14 days)
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

    // Unique action types for filter
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Bar Chart ── */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-6">Activity Over Time (14 Days)</h3>
                        <div className="flex items-end justify-between gap-2 h-[180px]">
                            {dailyChart.labels.map((label, i) => {
                                const pct = dailyChart.max > 0 ? (dailyChart.values[i] / dailyChart.max) * 100 : 0;
                                return (
                                    <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                                        <span className="text-[9px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{dailyChart.values[i]}</span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(pct, 3)}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.03 }}
                                            className="w-full max-w-[32px] bg-blue-100 group-hover:bg-blue-500 rounded-md transition-colors"
                                        />
                                        <span className="text-[8px] font-medium text-gray-400 whitespace-nowrap">{label.slice(0, 6)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Activity Breakdown ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-4">By Action Type</h3>
                        {actStats.length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic py-8 text-center">No stats available.</p>
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
                                                    className={`h-full rounded-full ${colors[i % colors.length]}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-[11px] text-gray-400">
                                <span className="font-bold text-gray-900">{activities.length}</span> total events recorded
                            </p>
                        </div>
                    </div>
                </div>

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
                            // Paginate filtered activities
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
                                                <div className={`w-9 h-9 rounded-full ${colors[(start + i) % colors.length]} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
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
                                                            {a.entityType} {a.projectId ? `· Project: ${typeof a.projectId === 'object' ? a.projectId.name : a.projectId}` : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-medium">{rel(a.createdAt)}</span>
                                                    <p className="text-[9px] text-gray-300 mt-0.5">{fmtDate(a.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination Controls */}
                                        <div className="px-5 py-4 flex items-center justify-between border-t bg-white">
                                            <div className="text-sm text-gray-500">Showing <span className="font-semibold text-gray-900">{Math.min(start + 1, total)}</span> - <span className="font-semibold text-gray-900">{Math.min(end, total)}</span> of <span className="font-semibold text-gray-900">{total}</span></div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className={`px-3 py-1 rounded-md text-sm ${page === 1 ? 'text-gray-300 border border-gray-100 bg-white' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'}`}>
                                                    Prev
                                                </button>
                                                {/* simple page numbers - show up to 5 pages with ellipses */}
                                                {(() => {
                                                    const pages = [] as number[];
                                                    const maxButtons = 5;
                                                    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
                                                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                                                    if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);
                                                    for (let p = startPage; p <= endPage; p++) pages.push(p);
                                                    return (
                                                        <div className="flex items-center gap-1">
                                                            {startPage > 1 && (
                                                                <button onClick={() => setCurrentPage(1)} className="px-2 py-1 text-sm rounded-md bg-white border border-gray-100">1</button>
                                                            )}
                                                            {startPage > 2 && <span className="px-2">…</span>}
                                                            {pages.map(p => (
                                                                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1 rounded-md text-sm ${p === page ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 text-gray-600'}`}>
                                                                    {p}
                                                                </button>
                                                            ))}
                                                            {endPage < totalPages - 1 && <span className="px-2">…</span>}
                                                            {endPage < totalPages && (
                                                                <button onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 text-sm rounded-md bg-white border border-gray-100">{totalPages}</button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className={`px-3 py-1 rounded-md text-sm ${page === totalPages ? 'text-gray-300 border border-gray-100 bg-white' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'}`}>
                                                    Next
                                                </button>
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
