import { useState } from "react";
import { useProjects } from "../../hooks/useProjects";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusBadge: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    ARCHIVED: "bg-gray-100 text-gray-500",
    COMPLETED: "bg-blue-50 text-blue-700",
    ON_HOLD: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-red-50 text-red-600",
};



// ── Project Card ──────────────────────────────────────────────────────────────────
const ProjectMapCard = ({ project, onClick }: { project: any; onClick: () => void }) => (
    <motion.div
        whileHover={{ y: -2 }}
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden group"
    >
        {/* Colored top accent by status */}
        {/* <div className={`h-1 w-full ${statusDot[project.status] ?? "bg-gray-300"}`} /> */}

        <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-blue-200 shrink-0">
                        {project.name?.[0]?.toUpperCase() ?? "P"}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                            {project.name}
                        </h3>
                        <span className={`mt-0.5 inline-block px-2 py-px rounded text-[9px] font-bold uppercase tracking-widest ${statusBadge[project.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {project.status}
                        </span>
                    </div>
                </div>
                <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1 shrink-0"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            </div>

            {/* Description */}
            {project.description ? (
                <p className="text-[12px] text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                    {project.description}
                </p>
            ) : (
                <p className="text-[12px] text-gray-300 italic mb-4">No description</p>
            )}

            {/* Footer meta */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-gray-400 border-t border-gray-50 pt-3">
                <div>
                    <span className="font-semibold text-gray-500">Created</span>
                    <p>{fmt(project.createdAt)}</p>
                </div>
                {project.endDate && (
                    <div>
                        <span className="font-semibold text-gray-500">Due</span>
                        <p>{fmt(project.endDate)}</p>
                    </div>
                )}
            </div>

            {/* View stats CTA */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[11px] text-gray-400 group-hover:text-blue-600 transition-colors font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View stats & members
            </div>
        </div>
    </motion.div>
);

// ── Page ──────────────────────────────────────────────────────────────────────────
const ProjectTeamsPage = () => {
    const { data: projectsData, isLoading } = useProjects();
    const navigate = useNavigate();
    const { slug } = useParams();

    const projects: any[] = projectsData?.projects ?? projectsData ?? [];

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const statusOptions = ["ALL", "ACTIVE", "ARCHIVED", "COMPLETED", "ON_HOLD", "CANCELLED"];

    const filtered = projects.filter((p) => {
        const matchSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // group counts for the summary bar
    const byStatus = statusOptions.slice(1).reduce<Record<string, number>>((acc, s) => {
        acc[s] = projects.filter((p) => p.status === s).length;
        return acc;
    }, {});

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Projects Map</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    Click any project card to view detailed stats, task breakdowns, and team members.
                </p>
            </div>

            {/* Summary pills */}
            {!isLoading && projects.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                    <span className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[11px] font-bold">
                        {projects.length} total
                    </span>
                    {Object.entries(byStatus).filter(([, n]) => n > 0).map(([s, n]) => (
                        <span
                            key={s}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${statusBadge[s] ?? "bg-gray-100 text-gray-500"}`}
                        >
                            {n} {s.replace("_", " ").toLowerCase()}
                        </span>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects…"
                        className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition-colors w-52"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {statusOptions.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${statusFilter === s
                                ? "bg-gray-900 text-white"
                                : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
                                }`}
                        >
                            {s.replace("_", " ")}
                        </button>
                    ))}
                </div>
                {filtered.length !== projects.length && (
                    <span className="ml-auto text-[11px] text-gray-400">{filtered.length} of {projects.length}</span>
                )}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-44 bg-gray-100 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No projects match your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filtered.map((p) => (
                        <ProjectMapCard
                            key={p._id}
                            project={p}
                            onClick={() => navigate(`/${slug}/settings/projects-team/${p._id}`)}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default ProjectTeamsPage;
