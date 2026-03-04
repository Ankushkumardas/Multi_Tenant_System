import { motion } from "framer-motion";

interface ProjectCardProps {
    project: any;
    onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
    // Generate a consistent pseudo-random gradient based on project ID
    // const gradients = [
    //     "from-blue-600 to-indigo-700",
    //     "from-emerald-500 to-teal-700",
    //     "from-amber-400 to-orange-600",
    //     "from-rose-500 to-pink-700",
    //     "from-violet-600 to-purple-800",
    //     "from-cyan-500 to-blue-700"
    // ];
    // const gradientIdx = (project._id || "0").charCodeAt(0) % gradients.length;
    // const gradient = gradients[gradientIdx];

    const completedTasks = project.completedTasks ?? 0;
    const totalTasks = project.totalTasks ?? 10;
    const progress = Math.min(Math.round((completedTasks / totalTasks) * 100), 100);

    const formatDate = (date: string) => {
        if (!date) return "Just now";
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group transition-all"
        >
            {/* Project Header / Image */}
            {/* <div className={`h-32 w-full bg-linear-to-br ${gradient} p-6 flex flex-col justify-end relative`}>
                {project.status === 'ARCHIVED' && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/20 backdrop-blur-md rounded text-[10px] font-medium text-white uppercase tracking-wider">
                        Archived
                    </div>
                )}
            </div> */}

            {/* Project Content */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Created {formatDate(project.createdAt)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                    {project.membersCount || 0} Members
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-blue-600"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
