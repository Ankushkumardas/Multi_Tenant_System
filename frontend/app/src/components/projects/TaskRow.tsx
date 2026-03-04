import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { formatDate, Modal, Label } from "./ProjectUI";
import { useTaskComments } from "../../hooks/useProjects";
import { useAuthStore } from "../../store/authStore";

interface TaskRowProps {
    task: any;
    projectId: string;
    slug: string;
    qc: any;
    projectMembers: any[];
    sections: any[];
}

export const TaskRow = ({ task, projectId, slug, qc, projectMembers, sections }: TaskRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);

    const [editTitle, setEditTitle] = useState(task.title);
    const [editDescription, setEditDescription] = useState(task.description ?? "");
    const [editSectionId, setEditSectionId] = useState(task.sectionId?._id ?? task.sectionId ?? "");
    const [editPriority, setEditPriority] = useState(task.priority ?? "MEDIUM");
    const { user } = useAuthStore();
    const canAssign = ["OWNER", "ADMIN", "MANAGER", "USER"].includes(user?.role || "");

    const handleStartEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            const currentAssignees = task.assignedTo?.map((u: any) => u._id) || [];
            const newAssignees = currentAssignees.includes(userId)
                ? currentAssignees.filter((id: string) => id !== userId)
                : [...currentAssignees, userId];
            const res = await api.post(`/${slug}/projects/${projectId}/tasks/${task._id}/assign`, { assignedTo: newAssignees });
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
        <>
            <div
                onClick={() => setShowDetail(true)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative group cursor-pointer"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider 
                            ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' :
                                task.priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {task.priority || "MEDIUM"}
                        </span>
                    </div>

                    <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignedTo?.slice(0, 3).map((u: any) => (
                            <div key={u._id} title={u.name} className="w-5.5 h-5.5 rounded-full bg-gray-900 border-2 border-white text-[8px] font-bold text-white flex items-center justify-center uppercase shrink-0 shadow-sm">
                                {u.name?.[0]}
                            </div>
                        ))}
                        {task.assignedTo?.length > 3 && (
                            <div className="w-5.5 h-5.5 rounded-full bg-gray-100 border-2 border-white text-[8px] font-bold text-gray-500 flex items-center justify-center shrink-0">
                                +{task.assignedTo.length - 3}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-2">
                    <h4 className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-black transition-colors">{task.title}</h4>
                    {task.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={handleStartEdit} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete task?")) deleteTaskMutation.mutate(); }} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {showDetail && (
                <Modal title="Task Details" size="lg" onClose={() => setShowDetail(false)}>
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{task.description || "No description provided."}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Priority</Label>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider 
                                            ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {task.priority || "MEDIUM"}
                                    </span>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase">
                                        <div className={`w-2 h-2 rounded-full ${task.status === 'DONE' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                        {sections.find(s => s._id === (task.sectionId?._id ?? task.sectionId))?.name || task.status?.replace('_', ' ') || "TODO"}
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <CommentSection taskId={task._id} projectId={projectId} slug={slug} />
                        </div>

                        {/* Right: Sidebar */}
                        <div className="w-full lg:w-48 space-y-6">
                            <div>
                                <Label>Assignees</Label>
                                <div className="flex flex-wrap gap-1">
                                    {task.assignedTo?.map((u: any) => (
                                        <div key={u._id} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                            <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                                                {u.name?.[0]}
                                            </div>
                                            <span className="text-[11px] text-gray-600 truncate max-w-[80px]">{u.name}</span>
                                        </div>
                                    ))}
                                    {canAssign && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                                                className="w-6 h-6 rounded-full border border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                            {showAssignDropdown && (
                                                <div className="absolute top-7 right-0 w-40 bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-50">
                                                    <div className="max-h-40 overflow-y-auto space-y-0.5">
                                                        {projectMembers.map(m => {
                                                            const u = m.userId || m;
                                                            const isAssigned = task.assignedTo?.some((at: any) => at._id === u._id);
                                                            return (
                                                                <button
                                                                    key={u._id}
                                                                    onClick={() => assignMutation.mutate(u._id)}
                                                                    className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-[11px] hover:bg-gray-50 ${isAssigned ? 'bg-gray-50 font-medium text-blue-600' : 'text-gray-600'}`}
                                                                >
                                                                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
                                                                        {u.name?.[0]}
                                                                    </div>
                                                                    {u.name}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Created By</Label>
                                    <p className="text-[11px] text-gray-900 font-medium">{task.createdBy?.name || "System"}</p>
                                </div>
                                <div>
                                    <Label>Due date</Label>
                                    <p className="text-[11px] text-gray-900 font-medium">{formatDate(task.dueDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Modal */}
            {isEditing && (
                <Modal title="Edit Task" onClose={() => setIsEditing(false)}>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Title</Label>
                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full h-10 px-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 transition-all text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label>Description</Label>
                            <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full h-32 p-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 transition-all text-sm resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Priority</Label>
                                <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="w-full h-10 px-3 bg-gray-50 border border-transparent rounded-xl outline-none text-sm appearance-none">
                                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Column</Label>
                                <select value={editSectionId} onChange={e => setEditSectionId(e.target.value)} className="w-full h-10 px-3 bg-gray-50 border border-transparent rounded-xl outline-none text-sm appearance-none">
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => updateTaskMutation.mutate({ title: editTitle, description: editDescription, sectionId: editSectionId, priority: editPriority })}
                            className="w-full h-10 bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-all"
                        >
                            {updateTaskMutation.isPending ? "Updating..." : "Save Changes"}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
};

const CommentSection = ({ taskId, projectId, slug }: { taskId: string; projectId: string; slug: string }) => {
    const queryClient = useQueryClient();
    const [msg, setMsg] = useState("");
    const { data: commentsData, isLoading } = useTaskComments(projectId, taskId);
    const comments: any[] = commentsData?.comments ?? [];

    const commentMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/tasks/${taskId}/comments`, { message: msg }),
        onSuccess: () => {
            setMsg("");
            queryClient.invalidateQueries({ queryKey: ["task-comments", slug, taskId] });
        }
    });

    return (
        <div className="pt-6 border-t border-gray-100 space-y-4">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Comments ({comments.length})</h4>

            <div className="flex gap-2">
                <input
                    placeholder="Add a comment..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && msg.trim() && commentMutation.mutate()}
                    className="flex-1 h-9 bg-gray-50 border border-transparent rounded-xl px-4 text-xs outline-none focus:bg-white focus:border-gray-200 transition-all"
                />
                <button
                    disabled={!msg.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate()}
                    className="h-9 px-4 bg-gray-900 text-white rounded-xl text-[11px] font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                    Post
                </button>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="h-10 bg-gray-50 animate-pulse rounded-xl" />
                ) : comments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">No comments yet.</p>
                ) : (
                    comments.map((c: any) => (
                        <div key={c._id} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {c.userId?.name?.[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[11px] font-semibold text-gray-900">{c.userId?.name}</span>
                                    <span className="text-[9px] text-gray-400">{formatDate(c.createdAt)}</span>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-600 leading-relaxed">
                                    {c.message}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
