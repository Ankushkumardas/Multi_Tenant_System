import { useParams, useNavigate } from "react-router-dom";
import { useProjectStats } from "../../hooks/useProjects";
import { motion } from "framer-motion";

// ── helpers ──────────────────────────────────────────────────────────────────────
const fmt = (d?: string) =>
    d
        ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        : "—";

// ── colour maps ──────────────────────────────────────────────────────────────────
const statusMeta: Record<string, { bg: string; dot: string; bar: string; label: string }> = {
    TODO: { bg: "bg-slate-50", dot: "bg-slate-400", bar: "bg-slate-400", label: "To Do" },
    IN_PROGRESS: { bg: "bg-blue-50", dot: "bg-blue-500", bar: "bg-blue-500", label: "In Progress" },
    REVIEW: { bg: "bg-violet-50", dot: "bg-violet-500", bar: "bg-violet-500", label: "Review" },
    DONE: { bg: "bg-emerald-50", dot: "bg-emerald-500", bar: "bg-emerald-500", label: "Done" },
};

const priorityMeta: Record<string, { bg: string; dot: string; bar: string }> = {
    LOW: { bg: "bg-slate-50", dot: "bg-slate-400", bar: "bg-slate-400" },
    MEDIUM: { bg: "bg-amber-50", dot: "bg-amber-400", bar: "bg-amber-400" },
    HIGH: { bg: "bg-orange-50", dot: "bg-orange-400", bar: "bg-orange-400" },
    URGENT: { bg: "bg-red-50", dot: "bg-red-500", bar: "bg-red-500" },
};

const roleBadge: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-700",
    SUPER_ADMIN: "bg-red-100 text-red-700",
    ADMIN: "bg-blue-100 text-blue-700",
    MANAGER: "bg-cyan-100 text-cyan-700",
    USER: "bg-gray-100 text-gray-600",
    VIEWER: "bg-slate-50 text-slate-400",
};

const projectStatusBadge: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    ARCHIVED: "bg-gray-100 text-gray-500",
    COMPLETED: "bg-blue-100 text-blue-700",
    ON_HOLD: "bg-amber-100 text-amber-700",
    CANCELLED: "bg-red-100 text-red-600",
};

// ── sub-components ───────────────────────────────────────────────────────────────

const StatCard = ({
    label, value, sub, color,
}: { label: string; value: number | string; sub?: string; color: string }) => (
    <div className={`rounded-2xl p-4 md:p-5 flex flex-col justify-center ${color}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1.5">{label}</p>
        <p className="text-xl font-extrabold leading-none">{value}</p>
        {sub && <p className="text-[9px] font-bold uppercase tracking-wider opacity-70 mt-1.5">{sub}</p>}
    </div>
);

const HorizBar = ({
    label, count, total, dotColor, barColor, bgColor,
}: {
    label: string; count: number; total: number;
    dotColor: string; barColor: string; bgColor: string;
}) => {
    const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
    return (
        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-xl ${bgColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            <span className="text-[10px] font-bold text-gray-700 w-16 md:w-20 shrink-0 truncate">{label}</span>
            <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden hidden 2xl:block">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor}`}
                />
            </div>
            <span className="text-[10px] font-bold text-gray-800 flex-1 2xl:flex-none w-4 text-right">{count}</span>
            <span className="text-[9px] font-bold text-gray-400 w-6 text-right">{pct}%</span>
        </div>
    );
};

// ── main ─────────────────────────────────────────────────────────────────────────
const ProjectMapDetailPage = () => {
    const { slug, projectId } = useParams<{ slug: string; projectId: string }>();
    const navigate = useNavigate();
    const { data, isLoading, error } = useProjectStats(projectId);

    const project = data?.project;
    const stats = data?.stats;

    // ── total tasks for pct calculations
    const total = stats?.totalTasks ?? 0;

    // ── loading ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-64 bg-gray-200 rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
                </div>
                <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="py-20 text-center text-sm text-red-500">
                Failed to load project data.
                <button onClick={() => navigate(-1)} className="ml-3 underline text-blue-600">Go back</button>
            </div>
        );
    }

    // ── completion % ────────────────────────────────────────────────────────────
    const done = stats?.statusCounts?.DONE ?? 0;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">

            {/* ── breadcrumb / back ── */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <button
                    onClick={() => navigate(`/${slug}/settings/projects-team`)}
                    className="hover:text-gray-700 transition-colors font-medium flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Projects Map
                </button>
                <span>/</span>
                <span className="text-gray-700 font-semibold">{project.name}</span>
            </div>

            {/* ── Top Row: Header + Stat Cards ── */}
            <div className="flex flex-col xl:flex-row gap-4 md:gap-5">
                {/* ── project header ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-2 md:p-2 xl:w-[40%] flex flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-extrabold shadow-lg shadow-blue-100 shrink-0">
                                {project.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                                        {project.name}
                                    </h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${projectStatusBadge[project.status] ?? "bg-gray-100 text-gray-500"}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-1">
                                    {project.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => navigate(`/${slug}/projects/${projectId}/members`)}
                                className="px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                            >
                                Members
                            </button>
                            <button
                                onClick={() => navigate(`/${slug}/projects/${projectId}/board`)}
                                className="px-3 py-1.5 bg-gray-900 rounded-xl text-[11px] font-bold text-white hover:bg-black transition-colors uppercase tracking-wider"
                            >
                                Open
                            </button>
                        </div>
                    </div>

                    {/* meta row */}
                    <div className="flex flex-wrap gap-4 mt-auto pt-4 border-t border-gray-50 text-sm">
                        {[
                            { label: "Owner", value: project.ownerId?.name ?? "—" },
                            { label: "Start", value: fmt(project.startDate) },
                            { label: "End", value: fmt(project.endDate) },
                            { label: "Created", value: fmt(project.createdAt) },
                            { label: "Sections", value: stats?.totalSections ?? 0 },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                                <p className="text-[12px] font-semibold text-gray-800 mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── top stat cards ── */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard label="Total Tasks" value={total} color="bg-white border border-gray-100 text-gray-900 shadow-sm" />
                    <StatCard label="Members" value={stats?.totalMembers ?? 0} color="bg-white border border-gray-100 text-gray-900 shadow-sm" />
                    <StatCard label="Completed" value={`${completionPct}%`} sub={`${done} of ${total} tasks done`} color="bg-white border border-gray-100 text-gray-900 shadow-sm" />
                    <StatCard label="Overdue Tasks" value={stats?.overdueTasks ?? 0} color={stats?.overdueTasks > 0 ? "bg-red-600 border border-red-600 text-white shadow-sm" : "bg-white border border-gray-100 text-gray-900 shadow-sm"} />
                </div>
            </div>

            {/* ── bottom components single row ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Tasks by Status */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[14px] font-bold text-gray-900">Tasks by Status</h2>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(statusMeta).map(([key, meta]) => (
                                <HorizBar key={key} label={meta.label} count={stats?.statusCounts?.[key] ?? 0} total={total} dotColor={meta.dot} barColor={meta.bar} bgColor={meta.bg} />
                            ))}
                        </div>
                    </div>

                    {/* Role Distribution */}
                    <div>
                        <h2 className="text-[14px] font-bold text-gray-900 mb-4">Role Distribution</h2>
                        {Object.keys(stats?.roleCounts ?? {}).length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic font-bold">No roles assigned.</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(stats?.roleCounts ?? {}).map(([role, count]) => {
                                    const pct = stats.totalMembers > 0 ? Math.round(((count as number) / stats.totalMembers) * 100) : 0;
                                    return (
                                        <div key={role}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${roleBadge[role] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {role}
                                                </span>
                                                <span className="text-[12px] font-bold text-gray-700">{count as number} <span className="text-gray-400 font-normal text-[10px]">({pct}%)</span></span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="h-full rounded-full bg-gray-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Tasks by Priority */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[14px] font-bold text-gray-900">Tasks by Priority</h2>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(priorityMeta).map(([key, meta]) => (
                                <HorizBar key={key} label={key.charAt(0) + key.slice(1).toLowerCase()} count={stats?.priorityCounts?.[key] ?? 0} total={total} dotColor={meta.dot} barColor={meta.bar} bgColor={meta.bg} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>


            {/* </div> */}
        </motion.div >
    );
};

export default ProjectMapDetailPage;
