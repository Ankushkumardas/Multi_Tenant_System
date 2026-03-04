import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useBoard, useProjectMembers } from "../../hooks/useProjects";
import { Skeleton } from "../../components/projects/ProjectUI";
import TaskDetailPanel from "../../components/projects/TaskDetailPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useAlertStore } from "../../store/alertStore";

const ProjectTasks = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();
    const { showConfirm, success } = useAlertStore();

    const { data: membersData } = useProjectMembers(projectId!);
    const { data: boardData, isLoading: boardLoading } = useBoard(projectId!);

    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const board: any[] = boardData?.board ?? boardData ?? [];
    const sections = board.map((item: any) => item.section);

    // Extract all tasks from board columns
    const allTasks = useMemo(() => {
        return board.flatMap((item: any) => item.tasks || []);
    }, [board]);

    // Filters
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [assigneeSearch, setAssigneeSearch] = useState("");

    // Active Task for modal
    const [activeTask, setActiveTask] = useState<any>(null);

    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            if (statusFilter && task.status !== statusFilter) return false;
            if (priorityFilter && task.priority !== priorityFilter) return false;
            if (assigneeSearch) {
                const searchLower = assigneeSearch.toLowerCase();
                const hasMatch = task.assignedTo?.some((u: any) => u.name?.toLowerCase().includes(searchLower));
                if (!hasMatch) return false;
            }
            return true;
        });
    }, [allTasks, statusFilter, priorityFilter, assigneeSearch]);

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const res = await api.delete(`/${slug}/projects/${projectId}/tasks/${taskId}`);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            success("Task deleted");
        },
    });

    if (boardLoading) {
        return (
            <div className="p-6 space-y-4 max-w-6xl mx-auto">
                <Skeleton className="h-12 w-full mb-4" />
                <div className="space-y-2">
                    {Array(5).fill(0).map((_, j) => (
                        <Skeleton key={j} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 h-full overflow-y-auto bg-[#FCFCFD]"
            >
                <div className="max-w-8xl mx-auto space-y-6">
                    {/* Filters Header */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] font-medium outline-none text-gray-700 w-full sm:w-auto min-w-[140px] focus:ring-1 focus:ring-blue-500 transition-shadow"
                        >
                            <option value="">All Statuses</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="DONE">Done</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] font-medium outline-none text-gray-700 w-full sm:w-auto min-w-[140px] focus:ring-1 focus:ring-blue-500 transition-shadow"
                        >
                            <option value="">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Assigned to..."
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            className="h-9 pl-3 pr-3 bg-white border border-gray-200 rounded-lg text-[12px] font-medium outline-none text-gray-700 w-full sm:w-64 focus:ring-1 focus:ring-blue-500 transition-shadow"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest w-[40%]">Task Name</th>
                                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Priority</th>
                                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Assigned To</th>
                                        <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-16 text-center text-[13px] text-gray-400 italic">No tasks match the filters.</td>
                                        </tr>
                                    ) : (
                                        filteredTasks.map((task: any) => (
                                            <tr
                                                key={task._id}
                                                onClick={() => setActiveTask(task)}
                                                className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{task.title}</span>
                                                        {task.description && <span className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{task.description}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                        ${task.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                                                                task.status === 'REVIEW' ? 'bg-amber-50 text-amber-600' :
                                                                    'bg-gray-100 text-gray-600'}`}>
                                                        {task.status?.replace('_', ' ') || 'TODO'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                        ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-rose-50 text-rose-600' :
                                                            task.priority === 'LOW' ? 'bg-sky-50 text-sky-600' :
                                                                'bg-orange-50 text-orange-600'}`}>
                                                        {task.priority || 'MEDIUM'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 align-middle">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {task.assignedTo?.slice(0, 3).map((u: any) => (
                                                            <div key={u._id} title={u.name} className="w-6 h-6 rounded-full bg-gray-900 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center uppercase shrink-0">
                                                                {u.name?.[0]}
                                                            </div>
                                                        ))}
                                                        {task.assignedTo?.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white text-[9px] font-bold text-gray-600 flex items-center justify-center shrink-0">
                                                                +{task.assignedTo.length - 3}
                                                            </div>
                                                        )}
                                                        {(!task.assignedTo || task.assignedTo.length === 0) && (
                                                            <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveTask(task); }}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                showConfirm({
                                                                    title: "Delete Task",
                                                                    message: `"${task.title}" will be permanently deleted.`,
                                                                    confirmLabel: "Delete",
                                                                    danger: true,
                                                                    onConfirm: () => deleteTaskMutation.mutate(task._id),
                                                                });
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {activeTask && (
                    <TaskDetailPanel
                        task={activeTask}
                        projectId={projectId!}
                        slug={slug!}
                        projectMembers={members}
                        sections={sections}
                        onClose={() => setActiveTask(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ProjectTasks;
