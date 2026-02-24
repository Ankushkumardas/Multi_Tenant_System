import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { formatDate, Modal, Label } from "./ProjectUI";
import { motion, AnimatePresence } from "framer-motion";

interface TaskRowProps {
    task: any;
    projectId: string;
    slug: string;
    qc: any;
    projectMembers: any[];
    sections: any[];
}

export const TaskRow = ({ task, projectId, slug, qc, projectMembers, sections }: TaskRowProps) => {
    const [status, setStatus] = useState(task.status ?? "TODO");
    const [isEditing, setIsEditing] = useState(false);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDescription, setEditDescription] = useState(task.description ?? "");
    const [editSectionId, setEditSectionId] = useState(task.sectionId?._id ?? task.sectionId ?? "");
    const [editPriority, setEditPriority] = useState(task.priority ?? "MEDIUM");

    // Update edit state when modal opens to ensure fresh data
    const handleStartEdit = () => {
        setEditTitle(task.title);
        setEditDescription(task.description ?? "");
        setEditSectionId(task.sectionId?._id ?? task.sectionId ?? "");
        setEditPriority(task.priority ?? "MEDIUM");
        setIsEditing(true);
    };

    const updateTaskMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.put(`/${slug}/projects/${projectId}/tasks/${task._id}`, payload);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setIsEditing(false);
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const res = await api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/status`, { status: newStatus });
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            const currentAssignees = task.assignedTo?.map((u: any) => u._id) || [];
            const newAssignees = currentAssignees.includes(userId)
                ? currentAssignees.filter((id: string) => id !== userId)
                : [...currentAssignees, userId];
            const res = await api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/assign`, { assignedTo: newAssignees });
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    const updatePriorityMutation = useMutation({
        mutationFn: async (priority: string) => {
            const res = await api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/priority`, { priority });
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async () => {
            const res = await api.delete(`/${slug}/projects/${projectId}/tasks/${task._id}`);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative group">
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); updateStatusMutation.mutate(e.target.value); }}
                        className="text-[10px] font-medium bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-500 outline-none cursor-pointer hover:bg-white hover:text-gray-900 transition-all appearance-none"
                    >
                        {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>

                    <select
                        value={task.priority}
                        onChange={e => updatePriorityMutation.mutate(e.target.value)}
                        className={`text-[10px] font-medium rounded-lg px-2 py-1 outline-none cursor-pointer transition-all border appearance-none ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                    >
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="flex -space-x-1.5">
                    {task.assignedTo?.map((u: any) => (
                        <div key={u._id} title={u.name} className="w-5 h-5 rounded-full bg-gray-900 border-2 border-white text-[8px] font-medium text-white flex items-center justify-center uppercase shrink-0">
                            {u.name?.[0]}
                        </div>
                    ))}
                    <div className="relative">
                        <button
                            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                            className="w-5 h-5 rounded-full border border-dashed border-gray-200 bg-white text-gray-400 flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-all font-medium text-[10px] shrink-0"
                        >
                            +
                        </button>

                        <AnimatePresence>
                            {showAssignDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowAssignDropdown(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50"
                                    >
                                        <p className="text-[10px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">Assign Team</p>
                                        <div className="max-h-40 overflow-y-auto scrollbar-hide py-1">
                                            {projectMembers.map((m: any) => {
                                                const u = m.userId || m;
                                                const isAssigned = task.assignedTo?.some((at: any) => at._id === u._id);
                                                return (
                                                    <button
                                                        key={u._id}
                                                        onClick={() => {
                                                            assignMutation.mutate(u._id);
                                                            // Optional: don't close so they can add multiple
                                                        }}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                                    >
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium uppercase border ${isAssigned ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                            {u.name?.[0]}
                                                        </div>
                                                        <span className={`text-[11px] font-normal flex-1 text-left ${isAssigned ? 'text-gray-900' : 'text-gray-500'}`}>{u.name}</span>
                                                        {isAssigned && <div className="w-1 h-1 rounded-full bg-green-500" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="mb-2">
                <h4 className="text-[13px] font-medium text-gray-800 leading-snug group-hover:text-gray-950 transition-colors uppercase tracking-tight">{task.title}</h4>
                {task.description && <p className="text-[11px] text-gray-400 mt-1 font-normal line-clamp-2 leading-relaxed">{task.description}</p>}
            </div>

            {task.dueDate && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{formatDate(task.dueDate)}</span>
                </div>
            )}

            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={handleStartEdit}
                    className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-indigo-600 transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                    onClick={() => { if (window.confirm("Delete task?")) deleteTaskMutation.mutate(); }}
                    className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <Modal title="Edit Task" onClose={() => setIsEditing(false)}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 pt-2"
                        >
                            <div className="space-y-4">
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-all focus-within:border-gray-300 focus-within:bg-white">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Task Title</Label>
                                    <input
                                        autoFocus
                                        placeholder="What needs to be done?"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full text-base font-medium bg-transparent outline-none placeholder-gray-200 text-gray-900"
                                    />
                                </div>
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-all focus-within:border-gray-300 focus-within:bg-white">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Description</Label>
                                    <textarea
                                        placeholder="Add details…"
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        className="w-full text-[13px] font-normal bg-transparent outline-none placeholder-gray-200 text-gray-600 min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Column</Label>
                                        <select
                                            value={editSectionId}
                                            onChange={e => setEditSectionId(e.target.value)}
                                            className="w-full bg-transparent outline-none text-[13px] font-semibold text-gray-900 appearance-none cursor-pointer"
                                        >
                                            {sections.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Priority</Label>
                                        <select
                                            value={editPriority}
                                            onChange={e => setEditPriority(e.target.value)}
                                            className="w-full bg-transparent outline-none text-[13px] font-semibold text-gray-900 appearance-none cursor-pointer"
                                        >
                                            {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => updateTaskMutation.mutate({
                                    title: editTitle,
                                    description: editDescription,
                                    sectionId: editSectionId,
                                    priority: editPriority
                                })}
                                disabled={!editTitle.trim() || updateTaskMutation.isPending}
                                className="w-full py-3 bg-gray-900 text-white text-[12px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all uppercase tracking-wider shadow-md"
                            >
                                {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                            </button>
                        </motion.div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};
