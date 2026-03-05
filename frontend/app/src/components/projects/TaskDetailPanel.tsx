import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useTaskComments, useTaskActivity, useProjectMembers } from "../../hooks/useProjects";
import { useAuthStore } from "../../store/authStore";

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const rel = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const PRIORITY_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
    LOW: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600" },
    MEDIUM: { dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
    HIGH: { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
    URGENT: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
};

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    TODO: { dot: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600", label: "To Do" },
    IN_PROGRESS: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
    REVIEW: { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", label: "Review" },
    DONE: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Done" },
    BACKLOGS: { dot: "bg-gray-500", bg: "bg-gray-50", text: "text-gray-700", label: "Backlogs" },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskDetailPanelProps {
    task: any;
    sections: any[];
    projectId: string;
    slug: string;
    projectMembers?: any[];
    onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const TaskDetailPanel = ({ task, sections, projectId, onClose, slug, projectMembers: initialMembers }: TaskDetailPanelProps) => {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    const canEdit = ["OWNER", "ADMIN", "MANAGER", "USER"].includes(user?.role || "");

    const { data: membersData } = useProjectMembers(projectId);
    const apiMembers = membersData?.projectMembers || membersData?.members || (Array.isArray(membersData) ? membersData : []);
    const projectMembers = initialMembers && initialMembers.length > 0 ? initialMembers : apiMembers;

    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState(task.description ?? "");
    const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "activities">("subtasks");
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);

    // ── mutations ──────────────────────────────────────────────────────────────
    const invalidate = () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}`, payload),
        onSuccess: invalidate,
    });
    const priorityMutation = useMutation({
        mutationFn: (priority: string) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/priority`, { priority }),
        onSuccess: invalidate,
    });
    const dueDateMutation = useMutation({
        mutationFn: (dueDate: string) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/due-date`, { dueDate }),
        onSuccess: invalidate,
    });
    const assignMutation = useMutation({
        mutationFn: (userId: string) => {
            const current = task.assignedTo?.map((u: any) => u._id) || [];
            const next = current.includes(userId) ? current.filter((id: string) => id !== userId) : [...current, userId];
            return api.post(`/${slug}/projects/${projectId}/tasks/${task._id}/assign`, { assignedTo: next });
        },
        onSuccess: () => {
            invalidate();
            qc.invalidateQueries({ queryKey: ["task", slug, projectId, task._id] });
        },
    });
    const sectionMutation = useMutation({
        mutationFn: (sectionId: string) => {
            const section = sections.find(s => s._id === sectionId);
            let status = section?.name.toUpperCase().replace(/\s+/g, "_") || "TODO";
            if (status === "BACKLOG") status = "BACKLOGS";
            const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "REVIEW", "BACKLOGS"];
            if (!validStatuses.includes(status)) status = "TODO";

            return api.put(`/${slug}/projects/${projectId}/tasks/${task._id}`, { sectionId, status });
        },
        onSuccess: invalidate,
    });

    const currentSection = sections.find((s: any) => s._id === (task.sectionId?._id ?? task.sectionId));
    const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
    const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.TODO;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            />

            {/* Slide-in Panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-[520px] max-w-full bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    {/* breadcrumb: project › section */}
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium min-w-0">
                        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">P</div>
                        <span className="uppercase tracking-wider truncate">{currentSection?.name ?? "Board"}</span>
                        {task._id && (
                            <>
                                <span>›</span>
                                <span className="font-mono text-[10px]">#{task._id.slice(-6).toUpperCase()}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </button>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 pt-5 pb-2">
                        {/* Title */}
                        <h2 className="text-[22px] font-bold text-gray-900 leading-snug mb-5">{task.title}</h2>

                        {/* Status + Priority row */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Status</p>
                                <select
                                    value={task.sectionId?._id ?? task.sectionId ?? ""}
                                    disabled={!canEdit || sectionMutation.isPending}
                                    onChange={e => sectionMutation.mutate(e.target.value)}
                                    className={`w-full h-9 px-3 rounded-xl border text-[12px] font-semibold cursor-pointer appearance-none outline-none ${statusCfg.bg} ${statusCfg.text} border-transparent focus:border-gray-200 transition-all`}
                                >
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Priority</p>
                                <select
                                    value={task.priority ?? "MEDIUM"}
                                    disabled={!canEdit || priorityMutation.isPending}
                                    onChange={e => priorityMutation.mutate(e.target.value)}
                                    className={`w-full h-9 px-3 rounded-xl border text-[12px] font-semibold cursor-pointer appearance-none outline-none ${priorityCfg.bg} ${priorityCfg.text} border-transparent focus:border-gray-200 transition-all`}
                                >
                                    {Object.keys(PRIORITY_CONFIG).map(p => (
                                        <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Due Date + Assignees row */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Due Date</p>
                                <div className="h-9 flex items-center gap-2 px-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <input
                                        type="date"
                                        disabled={!canEdit}
                                        defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                                        onChange={e => e.target.value && dueDateMutation.mutate(e.target.value)}
                                        className="bg-transparent outline-none text-[12px] text-gray-700 font-medium flex-1 cursor-pointer w-full"
                                    />
                                </div>
                                {task.dueDate && <p className="text-[10px] text-gray-400 mt-0.5 pl-1">{fmt(task.dueDate)}</p>}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Assignees</p>
                                <div className="h-9 flex items-center gap-1 px-2 rounded-xl bg-gray-50 border border-gray-100 relative">
                                    <div className="flex -space-x-1.5 flex-1">
                                        {task.assignedTo?.slice(0, 4).map((u: any) => (
                                            <div key={u._id} title={u.name} className="w-6 h-6 rounded-full bg-gray-800 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shrink-0 uppercase">
                                                {u.name?.[0]}
                                            </div>
                                        ))}
                                        {task.assignedTo?.length > 4 && (
                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold flex items-center justify-center border-2 border-white shrink-0">
                                                +{task.assignedTo.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    {canEdit && (
                                        <button
                                            onClick={() => setShowAssignMenu(v => !v)}
                                            className="w-6 h-6 rounded-full border border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-gray-500 hover:text-gray-600 transition-colors shrink-0"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    )}
                                    {showAssignMenu && (
                                        <div className="absolute top-10 right-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 z-50">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-2 py-1.5">Select Member</p>
                                            <div className="max-h-40 overflow-y-auto space-y-0.5">
                                                {projectMembers.map((m: any) => {
                                                    const u = m.userId ?? m;
                                                    const assigned = task.assignedTo?.some((at: any) => at._id === u._id);
                                                    return (
                                                        <button
                                                            key={u._id}
                                                            onClick={() => assignMutation.mutate(u._id)}
                                                            className={`w-full flex items-center gap-2 p-2 rounded-xl text-left text-[11px] transition-colors ${assigned ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold shrink-0">{u.name?.[0]}</div>
                                                            {u.name}
                                                            {assigned && <svg className="w-3 h-3 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>



                        {/* Meta row */}
                        <div className="flex items-center gap-4 text-[11px] text-gray-400 border-y border-gray-50 py-3 mb-5 flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Created by: <span className="font-semibold text-gray-600">{task.createdBy?.name ?? "System"}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {fmt(task.createdAt)}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Description</p>
                                </div>
                                {canEdit && !editingDesc && (
                                    <button onClick={() => { setDescDraft(task.description ?? ""); setEditingDesc(true); }} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors">Edit</button>
                                )}
                            </div>
                            {editingDesc ? (
                                <div className="space-y-2">
                                    <textarea
                                        autoFocus
                                        value={descDraft}
                                        onChange={e => setDescDraft(e.target.value)}
                                        className="w-full min-h-[100px] p-3 text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-blue-300 transition-colors leading-relaxed"
                                        placeholder="Add a description..."
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => { updateMutation.mutate({ description: descDraft }); setEditingDesc(false); }} className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors">Save</button>
                                        <button onClick={() => setEditingDesc(false)} className="px-4 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {task.description || <span className="italic text-gray-300">No description. Click Edit to add one.</span>}
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-100 mb-4 mt-6">
                            <div className="flex gap-8 px-2">
                                {(["subtasks", "comments", "activities"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-3 text-[13px] font-bold capitalize transition-colors border-b-[3px] -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                                    >
                                        {tab === "comments" ? <CommentsTabLabel taskId={task._id} projectId={projectId} tabName="Comments" /> : tab === "subtasks" ? "Subtask" : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab content */}
                        <div className="px-2">
                            {activeTab === "subtasks" && <SubtasksTab task={task} updateMutation={updateMutation} />}
                            {activeTab === "activities" && <ActivityTab task={task} />}
                            {activeTab === "comments" && <CommentsTab taskId={task._id} projectId={projectId} onReply={(id) => setReplyToCommentId(id)} />}
                        </div>
                    </div>
                </div>

                {/* ── Sticky comment input ── */}
                <StickyCommentInput taskId={task._id} projectId={projectId} slug={slug} qc={qc} projectMembers={projectMembers} parentId={replyToCommentId} onCancelReply={() => setReplyToCommentId(null)} />
            </motion.div>
        </AnimatePresence>
    );
};

// ── Subtasks Tab ───────────────────────────────────────────────────────────────
const SubtasksTab = ({ task, updateMutation }: { task: any, updateMutation: any }) => {
    const subtasks = task.subtasks || [];
    const [newItem, setNewItem] = useState("");
    const [nestedItem, setNestedItem] = useState<{ i: number, val: string } | null>(null);

    const handleAdd = () => {
        if (!newItem.trim()) return;
        updateMutation.mutate({ subtasks: [...subtasks, { title: newItem.trim(), isCompleted: false, subtasks: [] }] });
        setNewItem("");
    };

    const handleAddNested = (i: number) => {
        if (!nestedItem || nestedItem.i !== i || !nestedItem.val.trim()) return;
        const next = [...subtasks];
        const subs = next[i].subtasks || [];
        next[i] = { ...next[i], subtasks: [...subs, { title: nestedItem.val.trim(), isCompleted: false }] };
        updateMutation.mutate({ subtasks: next });
        setNestedItem(null);
    }

    const toggleComplete = (i: number) => {
        const next = [...subtasks];
        next[i] = { ...next[i], isCompleted: !next[i].isCompleted };
        updateMutation.mutate({ subtasks: next });
    };

    const toggleNestedComplete = (parentIdx: number, childIdx: number) => {
        const next = [...subtasks];
        const subs = [...(next[parentIdx].subtasks || [])];
        subs[childIdx] = { ...subs[childIdx], isCompleted: !subs[childIdx].isCompleted };
        next[parentIdx] = { ...next[parentIdx], subtasks: subs };
        updateMutation.mutate({ subtasks: next });
    }

    const removeSubtask = (i: number) => {
        const next = subtasks.filter((_: any, idx: number) => idx !== i);
        updateMutation.mutate({ subtasks: next });
    };

    const removeNestedSubtask = (parentIdx: number, childIdx: number) => {
        const next = [...subtasks];
        const subs = (next[parentIdx].subtasks || []).filter((_: any, idx: number) => idx !== childIdx);
        next[parentIdx] = { ...next[parentIdx], subtasks: subs };
        updateMutation.mutate({ subtasks: next });
    }

    const updateNote = (i: number, note: string) => {
        const next = [...subtasks];
        next[i] = { ...next[i], note };
        updateMutation.mutate({ subtasks: next });
    }

    const completed = subtasks.filter((s: any) => s.isCompleted).length;

    return (
        <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-800">Subtasks</h3>
                <h3 className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {completed}/{subtasks.length}
                </h3>
            </div>

            <div className="relative before:absolute before:inset-0 before:ml-[11px] before:translate-x-px before:h-full before:w-[2px] before:bg-gray-100 space-y-1">
                {subtasks.length === 0 && (
                    <p className="text-[12px] text-gray-300 italic text-center py-4 border border-dashed border-gray-200 rounded-xl relative z-10 bg-white">No subtasks found.</p>
                )}
                {subtasks.map((s: any, i: number) => (
                    <div key={i} className="group relative flex flex-col gap-2 p-3 pl-0 transition-all font-medium">
                        <div className="flex items-start gap-4">
                            <button onClick={() => toggleComplete(i)} className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 z-10 bg-white translate-x-px mt-0.5 ${s.isCompleted ? 'border-blue-600 text-blue-600' : 'border-gray-200 hover:border-blue-400 text-transparent hover:text-blue-100'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <span className={`text-[13px] tracking-tight transition-colors ${s.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{s.title}</span>

                                <div className="mt-2 space-y-2">
                                    {(s.subtasks || []).map((ns: any, ci: number) => (
                                        <div key={ci} className="flex items-start gap-3 group/nested">
                                            <button onClick={() => toggleNestedComplete(i, ci)} className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors shrink-0 ${ns.isCompleted ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300 hover:border-gray-500'}`}>
                                                {ns.isCompleted && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                            <span className={`text-[12px] flex-1 min-w-0 transition-colors ${ns.isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{ns.title}</span>
                                            <button onClick={() => removeNestedSubtask(i, ci)} className="opacity-0 group-hover/nested:opacity-100 text-gray-400 hover:text-red-500 rounded px-1 transition-all shrink-0">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}

                                    {nestedItem?.i === i ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input autoFocus value={nestedItem.val} onChange={e => setNestedItem({ i, val: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') handleAddNested(i); if (e.key === 'Escape') setNestedItem(null) }} onBlur={() => { !nestedItem.val.trim() && setNestedItem(null) }} className="flex-1 text-[11px] bg-gray-50 px-2 py-1.5 rounded outline-none border border-blue-200" placeholder="Add nested subtask..." />
                                        </div>
                                    ) : (
                                        <button onClick={() => setNestedItem({ i, val: '' })} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors mt-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                            Add item
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => removeSubtask(i)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-1 transition-all shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {/* Note/Comment for subtask */}
                        <div className="ml-10 flex items-center bg-gray-50 border border-gray-100 rounded-lg p-0.5">
                            <input
                                defaultValue={s.note ?? ""}
                                onBlur={(e) => updateNote(i, e.target.value)}
                                placeholder="Add a comment or note to this subtask..."
                                className="w-full text-[11px] px-2 py-1.5 placeholder:text-gray-400 text-gray-600 outline-none bg-transparent"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-50">
                <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a new subtask..."
                    className="flex-1 h-9 px-4 text-[12px] bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-lg outline-none transition-all placeholder:text-gray-400 font-medium"
                />
                <button disabled={!newItem.trim() || updateMutation.isPending} onClick={handleAdd} className="h-9 px-5 bg-[#8b9bf5] text-white text-[12px] font-bold rounded-lg hover:bg-[#7a8be9] disabled:opacity-50 transition-colors">
                    Add
                </button>
            </div>
        </div>
    );
};

// ── Activity Tab ───────────────────────────────────────────────────────────────
const ActivityTab = ({ task }: { task: any }) => {
    const { data: activityData, isLoading } = useTaskActivity(task._id);
    const activities = activityData?.activity ?? [];

    const filteredActivities = activities
        .map((act: any) => {
            if (act.actionType === "TASK_UPDATED" && act.details?.changes) {
                const newChanges: any = {};
                if ("status" in act.details.changes) newChanges.status = act.details.changes.status;
                if ("priority" in act.details.changes) newChanges.priority = act.details.changes.priority;
                if ("subtasks" in act.details.changes) {
                    const hasMention = JSON.stringify(act.details.changes.subtasks).includes("@");
                    if (hasMention) newChanges.subtasks = "Subtasks updated with mention";
                }
                return { ...act, details: { ...act.details, changes: newChanges } };
            }
            return act;
        })
        .filter((act: any) => {
            if (act.actionType === "COMMENT") return act.details?.message?.includes("@");
            if (act.actionType === "TASK_STATUS_CHANGED" || act.actionType === "TASK_PRIORITY_CHANGED") return true;
            if (act.actionType === "TASK_UPDATED") return Object.keys(act.details?.changes || {}).length > 0;
            return false;
        });

    if (isLoading) return <div className="animate-pulse h-12 bg-gray-50 rounded-xl" />;

    return (
        <div className="space-y-6 pb-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-800">Activities</h3>
                <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-[11px] font-semibold transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Mark as read
                </button>
            </div>

            <div className="relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-[2px] before:bg-gray-100 space-y-8 pl-1">
                {filteredActivities.length === 0 && (
                    <p className="text-[12px] text-gray-300 italic text-center py-6">No relevant activity recorded yet.</p>
                )}

                {filteredActivities.map((act: any) => (
                    <div key={act._id} className="relative flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-bold border border-gray-100 shadow-sm shrink-0 z-10 relative mt-0">
                            {act.userId?.name?.match(/\b(\w)/g)?.join('').slice(0, 2).toUpperCase() ?? "S"}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-[13px] text-gray-900">{act.userId?.name ?? "System"}</span>
                                <span className="text-[12px] text-gray-500 font-medium ml-1">
                                    {act.actionType === "TASK_CREATED" && "created this task"}
                                    {act.actionType === "TASK_UPDATED" && "updated this task"}
                                    {act.actionType === "TASK_STATUS_CHANGED" && "changed the status"}
                                    {act.actionType === "TASK_ASSIGNED" && "updated assignees"}
                                    {act.actionType === "TASK_PRIORITY_CHANGED" && "changed the priority"}
                                    {act.actionType === "TASK_DUEDATE_CHANGED" && "changed the due date"}
                                    {act.actionType === "TASK_DELETED" && "deleted this task"}
                                    {act.actionType === "COMMENT" && "left a comment"}
                                    {!["TASK_CREATED", "TASK_UPDATED", "TASK_STATUS_CHANGED", "TASK_ASSIGNED", "TASK_PRIORITY_CHANGED", "TASK_DUEDATE_CHANGED", "TASK_DELETED", "COMMENT"].includes(act.actionType) && act.actionType}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium flex items-center gap-1.5">
                                {new Date(act.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                <span>•</span>
                                {new Date(act.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>

                            {act.actionType === "COMMENT" && act.details?.message && (
                                <div className="mt-2.5 p-3 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[12px] text-gray-800 leading-relaxed font-medium">
                                    {act.details.message.split(/(@[a-zA-Z0-9_\s]+(?:(?=\s)|$))/g).map((part: string, i: number) =>
                                        part.startsWith('@') ? <span key={i} className="text-blue-600 font-semibold bg-blue-50/50 px-1 rounded">{part}</span> : part
                                    )}
                                </div>
                            )}

                            {act.actionType === "TASK_UPDATED" && act.details?.changes && (
                                <div className="mt-2.5 space-y-2">
                                    {Object.entries(act.details.changes).map(([k, v]) => {
                                        if (k === "_id" || k === "updatedAt" || k === "subtasks") return null;
                                        return (
                                            <div key={k} className="p-3 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[12px] text-gray-700 leading-relaxed font-medium">
                                                <span className="font-bold text-gray-900 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>{" "}
                                                <span className="text-gray-600 truncate inline-block max-w-full align-bottom">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Comments Tab Label ─────────────────────────────────────────────────────────
const CommentsTabLabel = ({ taskId, projectId, tabName }: { taskId: string; projectId: string; tabName: string }) => {
    const { data: commentsData } = useTaskComments(projectId, taskId);
    const count = commentsData?.comments?.length ?? 0;
    return (
        <span className="flex items-center gap-2">
            {tabName}
            {count > 0 && (
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {count}
                </span>
            )}
        </span>
    );
};

// ── Comments Tab ───────────────────────────────────────────────────────────────
const CommentsTab = ({ taskId, projectId, onReply }: { taskId: string; projectId: string; onReply: (id: string) => void }) => {
    const { data: commentsData, isLoading } = useTaskComments(projectId, taskId);
    const comments: any[] = commentsData?.comments ?? [];

    const rootComments = comments.filter((c: any) => !c.parentId);
    const getReplies = (parentId: string) => comments.filter((c: any) => c.parentId === parentId);

    return (
        <div className="space-y-6 pb-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-800">Comments</h3>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-[11px] font-semibold transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                </button>
            </div>

            {isLoading ? (
                <div className="h-12 bg-gray-50 animate-pulse rounded-xl" />
            ) : comments.length === 0 ? (
                <p className="text-[12px] text-gray-300 italic text-center py-6">No comments yet. Be the first to comment.</p>
            ) : (
                <div className="relative before:absolute before:inset-0 before:ml-[11px] before:translate-x-px before:h-full before:w-[2px] before:bg-gray-100 space-y-6 pl-1">
                    {rootComments.map((c: any) => (
                        <div key={c._id} className="relative group">
                            <div className="relative flex gap-4">
                                <div className="w-6 h-6 rounded-full bg-cover bg-center bg-gray-100 border border-white flex items-center justify-center text-[9px] font-bold text-gray-700 shrink-0 z-10 relative mt-0.5">
                                    {c.userId?.name?.match(/\b(\w)/g)?.join('').slice(0, 2).toUpperCase() ?? "S"}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[13px] font-bold text-gray-900">{c.userId?.name}</span>
                                        <span className="text-[11px] text-gray-400 font-medium tracking-tight">
                                            <span className="text-gray-300 mr-1">•</span>
                                            {rel(c.createdAt)}
                                        </span>
                                    </div>
                                    <div className="text-[12.5px] text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                                        {c.message?.split(/(@[a-zA-Z0-9_\s]+(?:(?=\s)|$))/g).map((part: string, i: number) =>
                                            part.startsWith('@') ? <span key={i} className="text-blue-600 font-semibold bg-blue-50/50 px-1 rounded">{part}</span> : part
                                        )}
                                    </div>
                                    <button onClick={() => onReply(c._id)} className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                        Reply
                                    </button>
                                </div>
                            </div>

                            {/* Nested Replies */}
                            {getReplies(c._id).length > 0 && (
                                <div className="mt-4 ml-8 space-y-4">
                                    {getReplies(c._id).map((reply: any) => (
                                        <div key={reply._id} className="flex gap-4">
                                            <div className="w-5 h-5 rounded-full bg-cover bg-center bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-700 shrink-0 mt-0.5">
                                                {reply.userId?.name?.match(/\b(\w)/g)?.join('').slice(0, 2).toUpperCase() ?? "S"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[12px] font-bold text-gray-900">{reply.userId?.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                                                        <span className="text-gray-300 mr-1">•</span>
                                                        {rel(reply.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="text-[12px] text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                                                    {reply.message?.split(/(@[a-zA-Z0-9_\s]+(?:(?=\s)|$))/g).map((part: string, i: number) =>
                                                        part.startsWith('@') ? <span key={i} className="text-blue-600 font-semibold bg-blue-50/50 px-1 rounded">{part}</span> : part
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Sticky Comment Input ───────────────────────────────────────────────────────
const StickyCommentInput = ({ taskId, projectId, slug, qc, projectMembers, parentId, onCancelReply }: { taskId: string; projectId: string; slug: string; qc: any; projectMembers: any[]; parentId?: string | null; onCancelReply?: () => void }) => {
    const [msg, setMsg] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const { user } = useAuthStore();

    const handleTextChange = (e: any) => {
        const val = e.target.value;
        setMsg(val);
        const match = val.match(/@([a-zA-Z0-9_\s]*)$/);
        if (match) {
            setShowMentions(true);
            setMentionFilter(match[1].toLowerCase());
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (memberName: string) => {
        setMsg(prev => prev.replace(/@[a-zA-Z0-9_\s]*$/, `@${memberName} `));
        setShowMentions(false);
    };

    const suggestedMembers = projectMembers.filter((m: any) => {
        const u = m.userId ?? m;
        return u.name?.toLowerCase().includes(mentionFilter);
    });

    const commentMutation = useMutation({
        mutationFn: () => {
            const mentionsFound: string[] = [];
            projectMembers.forEach((m: any) => {
                const u = m.userId ?? m;
                if (msg.includes(`@${u.name}`)) mentionsFound.push(u._id);
            });
            return api.post(`/${slug}/projects/${projectId}/tasks/${taskId}/comments`, { message: msg, mentions: mentionsFound, parentId });
        },
        onSuccess: () => {
            setMsg("");
            if (onCancelReply) onCancelReply();
            qc.invalidateQueries({ queryKey: ["task-comments", slug, taskId] });
        },
    });

    return (
        <div className="shrink-0 border-t border-gray-100 px-6 py-5 bg-white relative">
            {parentId && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-lg w-full max-w-[300px]">
                    Replying to a comment...
                    <button onClick={onCancelReply} className="text-blue-500 hover:text-blue-800">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            {showMentions && suggestedMembers.length > 0 && (
                <div className="absolute bottom-full left-6 w-64 mb-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 tracking-wider uppercase bg-gray-50 border-b border-gray-100">
                        Mention someone
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                        {suggestedMembers.map((m: any) => {
                            const u = m.userId ?? m;
                            return (
                                <button
                                    key={u._id}
                                    onClick={() => insertMention(u.name)}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600 shrink-0">
                                        {u.name?.match(/\b(\w)/g)?.join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    {u.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-2">
                    {user?.name?.match(/\b(\w)/g)?.join('').slice(0, 2).toUpperCase() ?? "Y"}
                </div>
                <div className="flex-1 bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden focus-within:border-blue-300 focus-within:shadow-md transition-all pt-2 pb-1.5 px-2">
                    <textarea
                        value={msg}
                        onChange={handleTextChange}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && msg.trim() && !showMentions && (e.preventDefault(), commentMutation.mutate())}
                        placeholder="Type a comment or '@' to mention someone..."
                        className="w-full px-3 py-1 text-[13px] text-gray-800 font-medium bg-transparent outline-none resize-none min-h-[44px] max-h-[100px] leading-relaxed placeholder:text-gray-400"
                        rows={1}
                    />
                    <div className="flex items-center justify-between px-2 pt-1 pb-1">
                        <div className="flex items-center gap-2 text-gray-300 ml-1">
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors text-[12px] font-bold">B</button>
                            <button onClick={() => setMsg(prev => prev + "@")} className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors text-[13px] font-medium">@</button>
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>
                        </div>
                        <button
                            disabled={!msg.trim() || commentMutation.isPending}
                            onClick={() => commentMutation.mutate()}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#8b9bf5] text-white text-[12px] font-bold rounded-xl hover:bg-[#7a8be9] disabled:opacity-50 transition-all font-mono tracking-tight"
                        >
                            Send
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPanel;
