import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useTaskComments } from "../../hooks/useProjects";
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
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskDetailPanelProps {
    task: any;
    sections: any[];
    projectId: string;
    slug: string;
    projectMembers: any[];
    onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const TaskDetailPanel = ({
    task,
    sections,
    projectId,
    slug,
    projectMembers,
    onClose,
}: TaskDetailPanelProps) => {
    const qc = useQueryClient();
    const { user } = useAuthStore();
    const canEdit = ["OWNER", "ADMIN", "MANAGER", "USER"].includes(user?.role || "");

    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState(task.description ?? "");
    const [activeTab, setActiveTab] = useState<"activity" | "comments">("activity");
    const [showAssignMenu, setShowAssignMenu] = useState(false);

    // ── mutations ──────────────────────────────────────────────────────────────
    const invalidate = () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}`, payload),
        onSuccess: invalidate,
    });
    const statusMutation = useMutation({
        mutationFn: (status: string) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}/status`, { status }),
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
        mutationFn: (sectionId: string) => api.put(`/${slug}/projects/${projectId}/tasks/${task._id}`, { sectionId }),
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
                                    value={task.status ?? "TODO"}
                                    disabled={!canEdit || statusMutation.isPending}
                                    onChange={e => statusMutation.mutate(e.target.value)}
                                    className={`w-full h-9 px-3 rounded-xl border text-[12px] font-semibold cursor-pointer appearance-none outline-none ${statusCfg.bg} ${statusCfg.text} border-transparent focus:border-gray-200 transition-all`}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
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

                        {/* Column / Section row */}
                        <div className="mb-5">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Column</p>
                            <select
                                value={task.sectionId?._id ?? task.sectionId ?? ""}
                                disabled={!canEdit || sectionMutation.isPending}
                                onChange={e => sectionMutation.mutate(e.target.value)}
                                className="w-full h-9 px-3 rounded-xl border border-gray-100 text-[12px] font-medium text-gray-700 bg-gray-50 outline-none appearance-none cursor-pointer focus:border-gray-200 transition-all"
                            >
                                {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
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
                        <div className="border-b border-gray-100 mb-4">
                            <div className="flex gap-6">
                                {(["activity", "comments"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-2.5 text-[12px] font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                                    >
                                        {tab === "comments" ? <CommentsTabLabel taskId={task._id} projectId={projectId} tabName="Comments" /> : "Activity"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab content */}
                        {activeTab === "activity" ? (
                            <ActivityTab task={task} />
                        ) : (
                            <CommentsTab taskId={task._id} projectId={projectId} />
                        )}
                    </div>
                </div>

                {/* ── Sticky comment input ── */}
                <StickyCommentInput taskId={task._id} projectId={projectId} slug={slug} qc={qc} />
            </motion.div>
        </AnimatePresence>
    );
};

// ── Activity Tab ───────────────────────────────────────────────────────────────
const ActivityTab = ({ task }: { task: any }) => (
    <div className="space-y-3 pb-4">
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0">
                {task.createdBy?.name?.[0] ?? "S"}
            </div>
            <div>
                <p className="text-[12px] text-gray-600">
                    <span className="font-semibold text-gray-900">{task.createdBy?.name ?? "System"}</span>{" "}
                    created this task
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{rel(task.createdAt)}</p>
            </div>
        </div>
        {task.updatedAt && task.updatedAt !== task.createdAt && (
            <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">✎</div>
                <div>
                    <p className="text-[12px] text-gray-600">Task was <span className="font-semibold text-gray-900">updated</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{rel(task.updatedAt)}</p>
                </div>
            </div>
        )}
    </div>
);

// ── Comments Tab Label ─────────────────────────────────────────────────────────
const CommentsTabLabel = ({ taskId, projectId, tabName }: { taskId: string; projectId: string; tabName: string }) => {
    const { data: commentsData } = useTaskComments(projectId, taskId);
    const count = commentsData?.comments?.length ?? 0;
    return <span>{tabName}{count > 0 ? ` (${count})` : ""}</span>;
};

// ── Comments Tab ───────────────────────────────────────────────────────────────
const CommentsTab = ({ taskId, projectId }: { taskId: string; projectId: string }) => {
    const { data: commentsData, isLoading } = useTaskComments(projectId, taskId);
    const comments: any[] = commentsData?.comments ?? [];

    return (
        <div className="space-y-4 pb-4">
            {isLoading ? (
                <div className="h-12 bg-gray-50 animate-pulse rounded-xl" />
            ) : comments.length === 0 ? (
                <p className="text-[12px] text-gray-300 italic text-center py-6">No comments yet. Be the first to comment.</p>
            ) : (
                comments.map((c: any) => (
                    <div key={c._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                            {c.userId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[12px] font-semibold text-gray-900">{c.userId?.name}</span>
                                <span className="text-[10px] text-gray-400">{rel(c.createdAt)}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl text-[12px] text-gray-700 leading-relaxed">{c.message}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// ── Sticky Comment Input ───────────────────────────────────────────────────────
const StickyCommentInput = ({ taskId, projectId, slug, qc }: { taskId: string; projectId: string; slug: string; qc: any }) => {
    const [msg, setMsg] = useState("");
    const { user } = useAuthStore();
    const commentMutation = useMutation({
        mutationFn: () => api.post(`/${slug}/projects/${projectId}/tasks/${taskId}/comments`, { message: msg }),
        onSuccess: () => {
            setMsg("");
            qc.invalidateQueries({ queryKey: ["task-comments", slug, taskId] });
        },
    });
    return (
        <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-white">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                    {user?.name?.[0]?.toUpperCase() ?? "Y"}
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:border-gray-300 focus-within:bg-white transition-all">
                    <textarea
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && msg.trim() && (e.preventDefault(), commentMutation.mutate())}
                        placeholder="Type a comment or '@' to mention someone..."
                        className="w-full px-4 pt-3 pb-2 text-[12px] text-gray-700 bg-transparent outline-none resize-none min-h-[44px] max-h-[100px] leading-relaxed"
                        rows={1}
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                        <div className="flex items-center gap-1 text-gray-300">
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors text-[11px] font-bold">B</button>
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors text-[11px]">@</button>
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center hover:text-gray-500 rounded transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </button>
                        </div>
                        <button
                            disabled={!msg.trim() || commentMutation.isPending}
                            onClick={() => commentMutation.mutate()}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all"
                        >
                            Send
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPanel;
