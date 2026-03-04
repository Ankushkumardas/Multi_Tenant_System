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
    const { data: projectsData, isLoading } = useProjects();
    const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ACTIVE");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();
    const { slug } = useParams();

    const allProjects: any[] = projectsData?.projects ?? projectsData ?? [];
    const isOwner = user?.role === "OWNER" || user?.role === "ADMIN";

    const filtered = allProjects.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());

        let matchTab = true;
        if (statusTab === "ACTIVE") matchTab = !p.isArchived && p.status !== "ARCHIVED";
        if (statusTab === "ARCHIVED") matchTab = p.isArchived || p.status === "ARCHIVED";

        return matchSearch && matchTab;
    });

    return (
        <DashboardLayout title="Projects Hub">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and track your active workspace projects.</p>
                    </div>
                    {isOwner && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[13px] font-medium hover:bg-gray-700 transition-all"
                        >
                            + Create Project
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
                    <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                        {(["ALL", "ACTIVE", "ARCHIVED"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setStatusTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${statusTab === tab ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white border border-transparent focus:border-gray-200 transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-gray-400">No projects found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filtered.map(p => (
                            <ProjectCard key={p._id} project={p} onClick={() => navigate(`/${slug}/projects/${p._id}`)} />
                        ))}
                    </div>
                )}
            </div>

            {showCreate && <ProjectFormModal onClose={() => setShowCreate(false)} />}
        </DashboardLayout>
    );
};

export default ProjectsPage;
