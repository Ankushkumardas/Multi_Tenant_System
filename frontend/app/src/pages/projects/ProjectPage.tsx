import { useParams, Link, useLocation, Outlet } from "react-router-dom";
import { useProjectById } from "../../hooks/useProjects";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { TrafficLights, statusDot } from "../../components/projects/ProjectUI";
import { motion } from "framer-motion";

const ProjectPage = () => {
    const { slug, projectId } = useParams();
    const location = useLocation();

    const currentPath = location.pathname.split("/").pop(); // board, tasks, members, settings

    const { data: projectData } = useProjectById(projectId!);
    const project = projectData?.project ?? projectData;

    const tabs = [
        {
            id: "board",
            label: "Board",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
            ),
        },
        {
            id: "tasks",
            label: "Tasks List",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            )
        },
        {
            id: "members",
            label: "Team & Settings",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        }
    ];


    return (
        <DashboardLayout title={project?.name || "Project"} noPadding>
            <div className="w-full min-h-[calc(100vh-64px)] bg-[#FCFCFD] flex flex-col">

                {/* ── Sticky Header ── */}
                <div className="bg-white border-b border-gray-100 z-30">
                    <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <TrafficLights />
                            <div className="h-3 w-px bg-gray-100" />
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <Link to={`/${slug}/projects`} className="hover:text-gray-700 transition-colors">Projects</Link>
                                <span className="text-gray-200">/</span>
                                <span className="text-gray-600">{project?.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot[project?.status] ?? "bg-green-400"}`} />
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center">{project?.status ?? "Active"}</span>
                        </div>
                    </div>

                    <div className="px-6 pt-5 pb-0">
                        <h1 className="text-[20px] font-medium text-gray-900 tracking-tight leading-none mb-1">{project?.name}</h1>
                        {project?.description && (
                            <p className="text-[13px] text-gray-400 mt-0.5 mb-4 line-clamp-1 max-w-2xl">{project.description}</p>
                        )}

                        {/* Tab nav linking */}
                        <div className="flex items-center justify-between border-t border-gray-50 -mx-6 px-6 mt-4 overflow-x-auto scrollbar-hide">
                            <div className="flex -mb-px min-w-max">
                                {tabs.map(tab => (
                                    <Link
                                        key={tab.id}
                                        to={`/${slug}/projects/${projectId}/${tab.id}`}
                                        className={`flex items-center gap-1.5 px-5 py-3 text-[12px] transition-all relative ${currentPath === tab.id
                                            ? "text-gray-900 font-medium"
                                            : "text-gray-400 hover:text-gray-600 font-normal"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                        {currentPath === tab.id && (
                                            <motion.div layoutId="projectTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab Content Container ── */}
                <div className="flex-1 min-h-0 overflow-hidden relative">
                    <Outlet />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProjectPage;
