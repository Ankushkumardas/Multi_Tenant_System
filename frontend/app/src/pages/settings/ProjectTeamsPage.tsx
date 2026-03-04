import { useProjects, useProjectMembers } from "../../hooks/useProjects";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";

const ProjectCard = ({ project }: { project: any }) => {
    const { slug } = useParams();
    const { data: membersData, isLoading } = useProjectMembers(project._id);
    const members = membersData?.projectMembers ?? membersData?.members ?? [];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {project.name[0]}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{project.status}</p>
                    </div>
                </div>
                <Link to={`/${slug}/projects/${project._id}/members`} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider">
                    Manage
                </Link>
            </div>
            <div className="p-4">
                <div className="flex -space-x-2">
                    {isLoading ? (
                        <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
                    ) : members.length === 0 ? (
                        <span className="text-[10px] text-gray-400 italic">No members assigned</span>
                    ) : (
                        members.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-white border-2 border-white ring-1 ring-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase">
                                {m.userId?.name?.[0] || 'U'}
                            </div>
                        ))
                    )}
                    {members.length > 5 && (
                        <div className="w-7 h-7 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400">
                            +{members.length - 5}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-[11px] text-gray-500 font-medium">{members.length} Members</span>
                    <span className="text-[10px] text-gray-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

const ProjectTeamsPage = () => {
    const { data: projectsData, isLoading: projectsLoading } = useProjects();
    const projects: any[] = projectsData?.projects ?? projectsData ?? [];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Specific Teams</h1>
                <p className="text-sm text-gray-500 mt-1">Allocation of members across various workspace projects.</p>
            </div>

            {projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">No projects found to manage teams.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project._id} project={project} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default ProjectTeamsPage;
