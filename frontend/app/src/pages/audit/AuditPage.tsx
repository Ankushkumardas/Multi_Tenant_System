import { useAuditLogs, useAuditStats } from "../../hooks/useDashboard";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const AuditPage = () => {
    const { data: logsData = { logs: [], total: 0 }, isLoading } = useAuditLogs();
    const { data: auditStats = [] } = useAuditStats();
    const [filter, setFilter] = useState("ALL");

    const PAGE_SIZE = 8;
    const logsArray = Array.isArray(logsData.logs) ? logsData.logs : [];

    const filteredLogs = useMemo(() => {
        if (filter === "ALL") return logsArray;
        return logsArray.filter((log: any) => log.action === filter);
    }, [logsArray, filter]);

    const actionTypes = useMemo<string[]>(() => {
        const logsArray = Array.isArray(logsData.logs) ? logsData.logs : [];
        const types = new Set(logsArray.map((log: any) => log.action));
        return Array.from(types) as string[];
    }, [logsData]);

    const total = logsData.total;
    const auditStatsArray = Array.isArray(auditStats) ? auditStats : [];

    const chartData = auditStatsArray.map((stat: any) => ({
        label: stat._id,
        count: stat.count,
        pct: (stat.count / total) * 100,
        color: "bg-blue-500", // Example color
    }));

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
                        Review security events, user actions, and system changes. <span className="font-semibold text-gray-500">{total} total records.</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="text-[14px] font-bold text-gray-900 mb-6">Audit Events by Type</h3>
                        {chartData.length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic py-8 text-center">No audit stats available.</p>
                        ) : (
                            <div className="space-y-4">
                                {chartData.map((item: any, i: number) => (
                                    <div key={item.label} className="group">
                                        <div className="flex justify-between text-[11px] mb-1.5">
                                            <span className="font-semibold text-gray-700 capitalize">{item.label.toLowerCase()}</span>
                                            <span className="font-bold text-gray-900">{item.count}</span>
                                        </div>
                                        <div className="h-5 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.pct}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                                className={`h-full rounded-lg ${item.color} group-hover:opacity-90 transition-opacity`}
                                            />
                                        </div>
                                    </div>
                                ))}
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
                            <p className="text-lg font-bold text-gray-900 capitalize">{auditStats[0]?._id?.replace(/_/g, " ").toLowerCase() || "—"}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{auditStats[0]?.count || 0} occurrences</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
                    >
                        All
                    </button>
                    {actionTypes.map((type: string) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${filter === type ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"}`}
                        >
                            {type.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>

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
                                            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${log.action ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600"}`}>
                                                {log.action || "Unknown"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-[9px] font-bold">
                                                    {log.actorUserId?.name?.[0]?.toUpperCase() || "S"}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-semibold text-gray-900">{log.actorUserId?.name || "System"}</p>
                                                    <p className="text-[10px] text-gray-400">{log.actorUserId?.email || ""}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[11px] font-mono text-gray-500">{log.ipAddress || "—"}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] text-gray-400 truncate max-w-[200px] block" title={log.userAgent}>
                                                {log.userAgent || "—"}
                                            </span>
                                        </td>
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
