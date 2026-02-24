import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProjects } from "../../hooks/useProjects";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Skeleton } from "../../components/projects/ProjectUI";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { ProjectFormModal } from "../../components/projects/ProjectFormModal";
import { useNavigate, useParams } from "react-router-dom";

const ProjectsPage = () => {
    const { user } = useAuthStore();
    const { data: projectsData, isLoading, isError } = useProjects();
    const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ACTIVE");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();
    const { slug } = useParams();

    const allProjects: any[] = projectsData?.projects ?? projectsData ?? [];
    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

    const filtered = allProjects.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());

        let matchTab = true;
        if (statusTab === "ACTIVE") matchTab = !p.isArchived && p.status !== "ARCHIVED";
        if (statusTab === "ARCHIVED") matchTab = p.isArchived || p.status === "ARCHIVED";

        return matchSearch && matchTab;
    });

    return (
        <DashboardLayout title="Projects">

            {/* ── Top bar ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                    <p className="text-[13px] text-gray-400 mt-0.5">{allProjects.length} total project{allProjects.length !== 1 ? "s" : ""}</p>
                </div>
                {isOwnerOrAdmin && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 h-9 px-4 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        New project
                    </button>
                )}
            </div>

            {/* ── Tabs & Search ── */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                    {(["ALL", "ACTIVE", "ARCHIVED"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${statusTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 w-full">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <input
                        type="text"
                        placeholder="Search projects…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 text-[13px] bg-white border border-gray-200 rounded-xl outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44" />)}
                </div>
            ) : isError ? (
                <div className="text-center py-20">
                    <p className="text-[14px] text-red-500 font-semibold">Failed to load projects</p>
                    <p className="text-[12px] text-gray-400 mt-1">Check your permissions or try again</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                    </div>
                    <p className="text-[14px] font-semibold text-gray-700">{search || statusTab !== "ALL" ? "No projects match your filters" : "No projects yet"}</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                        {isOwnerOrAdmin ? "Create your first project to get started." : "You haven't been added to any projects yet."}
                    </p>
                    {isOwnerOrAdmin && !search && statusTab === "ALL" && (
                        <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-gray-900 text-white text-[12px] font-semibold rounded-xl hover:bg-gray-700 transition-all">
                            Create project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <ProjectCard key={p._id} project={p} onClick={() => navigate(`/${slug}/projects/${p._id}`)} />
                    ))}
                </div>
            )}

            {/* ── Modals / panels ── */}
            {showCreate && <ProjectFormModal onClose={() => setShowCreate(false)} />}
        </DashboardLayout>
    );
};

export default ProjectsPage;
