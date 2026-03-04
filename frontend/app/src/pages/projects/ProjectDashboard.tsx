import { useParams } from "react-router-dom";
import { useProjectStats } from "../../hooks/useProjects";
import { motion } from "framer-motion";
import { Skeleton } from "../../components/projects/ProjectUI";

const ProjectDashboard = () => {
    const { projectId } = useParams();
    const { data: statsData, isLoading } = useProjectStats(projectId!);

    const stats = statsData?.stats || {};
    const project = statsData?.project || {};

    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    const cards = [
        { label: "Total Tasks", value: stats.totalTasks || 0, color: "text-gray-900", icon: "📋" },
        { label: "Completed", value: stats.statusCounts?.DONE || 0, color: "text-emerald-600", icon: "✅" },
        { label: "In Progress", value: stats.statusCounts?.IN_PROGRESS || 0, color: "text-blue-600", icon: "⏳" },
        { label: "Overdue", value: stats.overdueTasks || 0, color: "text-rose-600", icon: "⚠️" },
    ];

    const chartBars = [
        { key: "TODO", label: "Todo", count: stats.statusCounts?.TODO || 0, color: "bg-gray-400" },
        { key: "IN_PROGRESS", label: "In Progress", count: stats.statusCounts?.IN_PROGRESS || 0, color: "bg-blue-500" },
        { key: "REVIEW", label: "Review", count: stats.statusCounts?.REVIEW || 0, color: "bg-amber-400" },
        { key: "DONE", label: "Done", count: stats.statusCounts?.DONE || 0, color: "bg-emerald-500" },
    ];

    const maxCount = Math.max(...chartBars.map(b => b.count), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-6xl mx-auto space-y-10"
        >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</span>
                            <span className="text-xl">{card.icon}</span>
                        </div>
                        <div className={`text-3xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-10">
                {/* Visual Progress */}
                <div className="bg-white border border-gray-100 rounded-[32px] p-8 space-y-8">
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-900 tracking-tight uppercase mb-1">Status Breakdown</h3>
                        <p className="text-[11px] text-gray-400">Distribution of tasks across workflow stages</p>
                    </div>

                    <div className="space-y-6">
                        {chartBars.map(bar => (
                            <div key={bar.key} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[12px] font-medium text-gray-700">{bar.label}</span>
                                    <span className="text-[11px] font-bold text-gray-900">{bar.count} tasks</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(bar.count / maxCount) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full ${bar.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Info */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl shadow-gray-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-4">Team Composition</h4>
                        <div className="space-y-4">
                            {Object.entries(stats.roleCounts || {}).map(([role, count]) => (
                                <div key={role} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                    <span className="text-[12px] font-medium">{role}</span>
                                    <span className="text-[12px] font-bold bg-white text-gray-900 px-2.5 py-0.5 rounded-lg">{count as number}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[11px] opacity-60">Total Members</span>
                            <span className="text-xl font-bold">{stats.totalMembers || 0}</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[32px] p-8">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Project Timeline</h4>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 uppercase">Started</p>
                            <p className="text-[13px] font-medium text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-[10px] text-gray-400 uppercase">Deadline</p>
                            <p className="text-[13px] font-medium text-rose-600">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectDashboard;
