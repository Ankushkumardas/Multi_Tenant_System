import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/authStore";
import { useProjectById, useProjectMembers, useBoard } from "../../hooks/useProjects";
import { Skeleton, Badge, formatDate, statusColor, Input } from "./ProjectUI";
import { TaskRow } from "./TaskRow";
import { MemberRow } from "./MemberRow";

interface ProjectDetailPanelProps {
    projectId: string;
    onClose: () => void;
}

export const ProjectDetailPanel = ({ projectId, onClose }: ProjectDetailPanelProps) => {
    const { slug } = useParams();
    const qc = useQueryClient();
    const { user } = useAuthStore();
    const { data: projectData, isLoading } = useProjectById(projectId);
    const { data: membersData, isLoading: membersLoading } = useProjectMembers(projectId);
    const { data: boardData, isLoading: boardLoading } = useBoard(projectId);

    const project = projectData?.project ?? projectData;
    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const sections: any[] = boardData?.sections ?? boardData?.board ?? boardData ?? [];

    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN";

    // ── Add member mutation
    const [memberEmail, setMemberEmail] = useState("");
    const addMemberMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/${slug}/projects/${projectId}/add-member`, { email: memberEmail });
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["project-members", slug, projectId] });
            setMemberEmail("");
        },
    });

    // ── Create task
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [taskSectionId, setTaskSectionId] = useState("");
    const createTaskMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/${slug}/projects/${projectId}/tasks`, { title: newTaskTitle, sectionId: taskSectionId || undefined });
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setNewTaskTitle("");
        },
    });

    // ── Archive toggle
    const archiveMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/${slug}/projects/${projectId}/toggle-archive`);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", slug] }),
    });

    // ── Delete project
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await api.delete(`/${slug}/projects/${projectId}`);
            return res.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", slug] }); onClose(); },
    });

    const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "members">("overview");
    const tabs = ["overview", "tasks", "members"] as const;

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                            {isLoading ? <Skeleton className="h-5 w-40 mb-1" /> : (
                                <h2 className="text-[16px] font-bold text-gray-900 truncate">{project?.name}</h2>
                            )}
                            {isLoading ? <Skeleton className="h-3 w-24" /> : (
                                <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(project?.startDate)} → {formatDate(project?.endDate)}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {!isLoading && isOwnerOrAdmin && (
                                <>
                                    <button
                                        onClick={() => archiveMutation.mutate()}
                                        className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                                    >
                                        {archiveMutation.isPending ? "…" : project?.isArchived ? "Unarchive" : "Archive"}
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm("Delete this project?")) deleteMutation.mutate(); }}
                                        className="text-[11px] px-2.5 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Status badge */}
                    {!isLoading && <Badge text={project?.status ?? "ACTIVE"} color={statusColor[project?.status] ?? "gray"} />}

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4">
                        {tabs.map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all ${activeTab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* ── Overview tab ── */}
                    {activeTab === "overview" && (
                        <div className="space-y-5">
                            {isLoading ? (
                                <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
                            ) : (
                                <>
                                    {project?.description && (
                                        <div>
                                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                            <p className="text-[13px] text-gray-700 leading-relaxed">{project.description}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Status", val: <Badge text={project?.status ?? "ACTIVE"} color={statusColor[project?.status] ?? "gray"} /> },
                                            { label: "Archived", val: <Badge text={project?.isArchived ? "Yes" : "No"} color={project?.isArchived ? "yellow" : "green"} /> },
                                            { label: "Start date", val: formatDate(project?.startDate) },
                                            { label: "End date", val: formatDate(project?.endDate) },
                                        ].map(({ label, val }) => (
                                            <div key={label} className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                                                <div className="text-[12px] font-semibold text-gray-800">{val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Section overview */}
                                    <div>
                                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sections</p>
                                        {boardLoading ? <Skeleton className="h-8" /> : sections.length === 0 ? (
                                            <p className="text-[12px] text-gray-400">No sections yet</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {sections.map((s: any) => (
                                                    <div key={s._id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                                                        <span className="text-[12px] font-medium text-gray-700">{s.name}</span>
                                                        <span className="text-[10px] text-gray-400">{s.tasks?.length ?? 0} tasks</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Tasks tab ── */}
                    {activeTab === "tasks" && (
                        <div className="space-y-4">
                            {/* Add task */}
                            {isOwnerOrAdmin && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Add task</p>
                                    <Input placeholder="Task title…" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                                    {sections.length > 0 && (
                                        <select value={taskSectionId} onChange={e => setTaskSectionId(e.target.value)} className="w-full h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 focus:border-gray-900 transition-all">
                                            <option value="">— No section —</option>
                                            {sections.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    )}
                                    {createTaskMutation.isError && <p className="text-[11px] text-red-500">{(createTaskMutation.error as any)?.response?.data?.message}</p>}
                                    <button
                                        onClick={() => createTaskMutation.mutate()}
                                        disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
                                        className="w-full h-8 bg-gray-900 text-white text-[12px] font-semibold rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all"
                                    >
                                        {createTaskMutation.isPending ? "Adding…" : "Add task"}
                                    </button>
                                </div>
                            )}

                            {/* Board sections + tasks */}
                            {boardLoading ? (
                                <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
                            ) : sections.length === 0 ? (
                                <p className="text-[13px] text-gray-400 text-center py-8">No sections or tasks yet.</p>
                            ) : (
                                sections.map((section: any) => (
                                    <div key={section._id} className="border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                                            <span className="text-[12px] font-bold text-gray-700">{section.name}</span>
                                            <span className="text-[10px] text-gray-400">{section.tasks?.length ?? 0} tasks</span>
                                        </div>
                                        {(section.tasks ?? []).length === 0 ? (
                                            <p className="text-[11px] text-gray-300 text-center py-4">Empty</p>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {(section.tasks ?? []).map((task: any) => (
                                                    <TaskRow key={task._id} task={task} projectId={projectId} slug={slug!} qc={qc} projectMembers={members} sections={sections.map((s: any) => s.section || s)} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── Members tab ── */}
                    {activeTab === "members" && (
                        <div className="space-y-4">
                            {/* Add member */}
                            {isOwnerOrAdmin && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Add member by email</p>
                                    <Input type="email" placeholder="jane@company.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                                    {addMemberMutation.isError && <p className="text-[11px] text-red-500">{(addMemberMutation.error as any)?.response?.data?.message}</p>}
                                    {addMemberMutation.isSuccess && <p className="text-[11px] text-green-600">Member added!</p>}
                                    <button
                                        onClick={() => addMemberMutation.mutate()}
                                        disabled={addMemberMutation.isPending || !memberEmail.trim()}
                                        className="w-full h-8 bg-gray-900 text-white text-[12px] font-semibold rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all"
                                    >
                                        {addMemberMutation.isPending ? "Adding…" : "Add member"}
                                    </button>
                                </div>
                            )}

                            {/* Member list */}
                            {membersLoading ? (
                                <div className="space-y-2.5">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                            ) : members.length === 0 ? (
                                <p className="text-[13px] text-gray-400 text-center py-8">No members yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {members.map((m: any) => (
                                        <MemberRow key={m._id ?? m.userId?._id} member={m} projectId={projectId} slug={slug!} qc={qc} isOwnerOrAdmin={isOwnerOrAdmin} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
