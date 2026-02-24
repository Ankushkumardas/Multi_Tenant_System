import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/authStore";
import { useProjectById, useProjectMembers, useBoard } from "../../hooks/useProjects";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Skeleton, Modal, Label, TrafficLights, statusDot } from "../../components/projects/ProjectUI";
import { TaskRow } from "../../components/projects/TaskRow";
import { MemberRow } from "../../components/projects/MemberRow";
import { motion, AnimatePresence } from "framer-motion";

const ProjectPage = () => {
    const { slug, projectId } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { user } = useAuthStore();

    const { data: projectData } = useProjectById(projectId!);
    const { data: membersData } = useProjectMembers(projectId!);
    const { data: boardData, isLoading: boardLoading } = useBoard(projectId!);

    const project = projectData?.project ?? projectData;
    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const board: any[] = boardData?.board ?? boardData ?? [];

    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

    const [activeTab, setActiveTab] = useState<"kanban" | "members" | "settings">("kanban");
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
    const [taskSectionId, setTaskSectionId] = useState("");
    const [inviteType, setInviteType] = useState<"project" | "workspace">("project");

    // ── Member state
    const [memberEmail, setMemberEmail] = useState("");
    const addMemberMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/add-member`, { email: memberEmail }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["project-members", slug, projectId] });
            setMemberEmail("");
        },
    });

    const workspaceInviteMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/admin/send-invite`, { email: memberEmail, role: "USER" }),
        onSuccess: () => { setMemberEmail(""); },
    });

    // ── Section state
    const [newSectionName, setNewSectionName] = useState("");
    const [showAddSection, setShowAddSection] = useState(false);
    const createSectionMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/sections`, { name: newSectionName }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setNewSectionName("");
            setShowAddSection(false);
        },
    });

    // ── Delete/Archive logic
    const archiveMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/toggle-archive`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["project", slug, projectId] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/${slug}/projects/${projectId}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", slug] }); navigate(`/${slug}/projects`); },
    });

    const createTaskMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/tasks`, {
            title: newTaskTitle,
            sectionId: taskSectionId,
            description: newTaskDescription,
            priority: newTaskPriority
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setNewTaskTitle("");
            setNewTaskDescription("");
            setShowAddTask(false);
        },
    });

    const tabs = [
        {
            id: "kanban", label: "Board", icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
            )
        },
        {
            id: "members", label: "Team", icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )
        },
        {
            id: "settings", label: "Settings", icon: (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )
        },
    ];

    return (
        <DashboardLayout title={project?.name || "Project"} noPadding>
            <div className="w-full min-h-screen bg-gray-50 flex flex-col">

                {/* ── Header Area ── */}
                <div className="bg-white border-b border-gray-100 p-6 shadow-sm sticky top-0 z-30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <TrafficLights />
                            <div className="h-4 w-px bg-gray-100" />
                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                <Link to={`/${slug}/projects`} className="hover:text-gray-900 transition-colors">Projects</Link>
                                <span className="text-gray-200">/</span>
                                <span className="text-gray-600 font-medium">{project?.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-medium text-gray-400 border border-gray-100 uppercase">
                                {project?.name?.[0]}
                            </div>
                            <button onClick={() => setActiveTab("members")} className="bg-white text-gray-400 text-[10px] font-medium px-3 py-1.5 rounded-lg border border-gray-100 hover:text-gray-900 transition-all uppercase tracking-wider">
                                Team
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${statusDot[project?.status] ?? "bg-green-500"}`} />
                                <h1 className="text-[20px] font-medium text-gray-900 tracking-tight uppercase">
                                    {project?.name}
                                </h1>
                            </div>
                            <p className="text-[13px] text-gray-400 font-normal mt-1">{project?.description}</p>
                        </div>

                        {/* ── Project Tabs ── */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-2 -mx-6 px-6">
                            <div className="flex gap-1 -mb-px">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-6 py-3 text-[13px] font-medium transition-all relative ${activeTab === tab.id
                                            ? "text-gray-900"
                                            : "text-gray-400 hover:text-gray-600"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "kanban" && isOwnerOrAdmin && (
                                <button
                                    onClick={() => setShowAddSection(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[11px] font-medium hover:bg-gray-800 transition-all uppercase tracking-wider shadow-md"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Column
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-8">

                    <AnimatePresence mode="wait">
                        {/* ── KANBAN TAB ── */}
                        {activeTab === "kanban" && (
                            <motion.div
                                key="kanban"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full"
                            >
                                {boardLoading ? (
                                    <div className="grid grid-cols-4 gap-8">
                                        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}
                                    </div>
                                ) : (
                                    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide">
                                        {board.map((item: any, idx: number) => (
                                            <div key={item.section._id} className="w-72 shrink-0">
                                                <div className="flex items-center gap-2 mb-4 px-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-red-400' : idx === 1 ? 'bg-yellow-400' : idx === 2 ? 'bg-green-400' : 'bg-indigo-400'}`} />
                                                    <h3 className="text-[11px] font-medium text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                                        {item.section.name}
                                                        <span className="text-[10px] font-normal text-gray-300">{item.tasks?.length ?? 0}</span>
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {item.tasks?.map((task: any) => (
                                                        <TaskRow key={task._id} task={task} projectId={projectId!} slug={slug!} qc={qc} projectMembers={members} sections={board.map((i: any) => i.section)} />
                                                    ))}
                                                    {isOwnerOrAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                setTaskSectionId(item.section._id);
                                                                setShowAddTask(true);
                                                            }}
                                                            className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-[11px] font-medium text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all duration-300"
                                                        >
                                                            + Add Task
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── MEMBERS TAB ── */}
                        {activeTab === "members" && (
                            <motion.div
                                key="members"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-6xl"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    <div className="lg:col-span-8">
                                        <div className="bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm shadow-gray-200/50">
                                            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white relative">
                                                <div>
                                                    <h3 className="text-[17px] font-medium text-gray-900 tracking-tight">Project Team</h3>
                                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.1em] mt-1">{members.length} Active Collaborators</p>
                                                </div>
                                            </div>
                                            <div className="divide-y divide-gray-50 bg-white">
                                                {members.map(m => (
                                                    <MemberRow key={m._id} member={m} projectId={projectId!} slug={slug!} qc={qc} isOwnerOrAdmin={isOwnerOrAdmin} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4">
                                        {isOwnerOrAdmin && (
                                            <div className="sticky top-24 space-y-8">
                                                <div className="bg-gray-900 rounded-4xl p-8 text-white shadow-md relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />

                                                    <div className="relative z-10">
                                                        <div className="flex bg-white/10 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner">
                                                            <button
                                                                onClick={() => setInviteType("project")}
                                                                className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all uppercase tracking-wider ${inviteType === "project" ? "bg-white text-gray-900 shadow-md" : "text-white/40 hover:text-white"}`}
                                                            >
                                                                Add
                                                            </button>
                                                            <button
                                                                onClick={() => setInviteType("workspace")}
                                                                className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all uppercase tracking-wider ${inviteType === "workspace" ? "bg-white text-gray-900 shadow-md" : "text-white/40 hover:text-white"}`}
                                                            >
                                                                Invite
                                                            </button>
                                                        </div>

                                                        <h3 className="font-medium text-lg mb-2 leading-tight tracking-tight uppercase">
                                                            {inviteType === "project" ? "Extend the Circle" : "Acquire Talent"}
                                                        </h3>
                                                        <p className="text-[12px] text-gray-400 mb-8 leading-relaxed font-medium">
                                                            {inviteType === "project"
                                                                ? "Seamlessly add established workspace partners to this project's core team."
                                                                : "Cast a broadcast to bring fresh visionaries into your organization."}
                                                        </p>

                                                        <div className="space-y-4">
                                                            <input
                                                                type="email"
                                                                placeholder="visionary@flowspace.co"
                                                                value={memberEmail}
                                                                onChange={e => setMemberEmail(e.target.value)}
                                                                className="w-full h-12 px-6 bg-white/10 border border-white/10 rounded-2xl text-[14px] text-white placeholder-white/20 outline-none focus:bg-white/15 focus:border-white/30 transition-all font-medium shadow-inner"
                                                            />
                                                            <button
                                                                onClick={() => inviteType === "project" ? addMemberMutation.mutate() : workspaceInviteMutation.mutate()}
                                                                disabled={!memberEmail.trim() || addMemberMutation.isPending || workspaceInviteMutation.isPending}
                                                                className="w-full py-3 bg-white text-gray-900 text-[11px] font-medium rounded-2xl hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider shadow-md"
                                                            >
                                                                {addMemberMutation.isPending || workspaceInviteMutation.isPending ? "Syncing…" : inviteType === "project" ? "Bind to Project" : "Dispatch Invite"}
                                                            </button>

                                                            {(addMemberMutation.isError || workspaceInviteMutation.isError) && (
                                                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
                                                                    <p className="text-[10px] text-red-400 font-medium uppercase tracking-widest">
                                                                        {((addMemberMutation.error || workspaceInviteMutation.error) as any)?.response?.data?.message ?? "Access Failure"}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── SETTINGS TAB ── */}
                        {activeTab === "settings" && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-2xl"
                            >
                                <section className="bg-white border border-gray-100 rounded-4xl p-10 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full blur-3xl -mr-16 -mt-16" />

                                    <h3 className="text-[18px] font-medium text-gray-900 mb-2 uppercase tracking-tight">Danger Zone</h3>
                                    <p className="text-[13px] text-gray-400 mb-8 leading-relaxed font-normal">Proceed with extreme caution. These operations are destructive and generally permanent.</p>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-8 bg-orange-50/50 rounded-4xl border border-orange-100/50 transition-all hover:bg-orange-50">
                                            <div>
                                                <p className="text-[15px] font-medium text-orange-900 uppercase tracking-tight">{project?.status === "ARCHIVED" ? "Restore Signal" : "Silence Project"}</p>
                                                <p className="text-[11px] text-orange-700/60 font-medium mt-1 uppercase tracking-wider">Move to cold storage. Not destructive.</p>
                                            </div>
                                            <button
                                                onClick={() => archiveMutation.mutate()}
                                                className="px-6 py-2.5 bg-white text-orange-600 border border-orange-200 text-[11px] font-medium rounded-xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-wider"
                                            >
                                                {archiveMutation.isPending ? "..." : project?.status === "ARCHIVED" ? "Restore" : "Archive"}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-8 bg-red-50/50 rounded-4xl border border-red-100/50 transition-all hover:bg-red-50">
                                            <div>
                                                <p className="text-[15px] font-medium text-red-900 uppercase tracking-tight">Purge Everything</p>
                                                <p className="text-[11px] text-red-700/60 font-medium mt-1 uppercase tracking-wider">Irreversible destruction of all sub-data.</p>
                                            </div>
                                            <button
                                                onClick={() => { if (window.confirm("CONFIRM TOTAL DESTRUCTION?")) deleteMutation.mutate(); }}
                                                className="px-6 py-2.5 bg-red-600 text-white text-[11px] font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-100 uppercase tracking-wider"
                                            >
                                                {deleteMutation.isPending ? "Purging..." : "Purge Now"}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {showAddSection && (
                        <Modal title="Create New Column" onClose={() => setShowAddSection(false)}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6 pt-2"
                            >
                                <div className="space-y-4">
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Column Name</Label>
                                        <input
                                            autoFocus
                                            placeholder="e.g. Backlog, Testing..."
                                            value={newSectionName}
                                            onChange={e => setNewSectionName(e.target.value)}
                                            className="w-full text-base font-medium bg-transparent outline-none placeholder-gray-200 text-gray-900"
                                        />
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium px-1">
                                        Columns help you organize tasks into logical stages of your workflow.
                                    </p>
                                </div>

                                <button
                                    onClick={() => createSectionMutation.mutate()}
                                    disabled={!newSectionName.trim() || createSectionMutation.isPending}
                                    className="w-full py-3 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all uppercase tracking-wider shadow-md"
                                >
                                    {createSectionMutation.isPending ? "Creating..." : "Create Column"}
                                </button>
                            </motion.div>
                        </Modal>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAddTask && (
                        <Modal title="Quick Task Create" onClose={() => setShowAddTask(false)}>
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
                                            value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            className="w-full text-base font-medium bg-transparent outline-none placeholder-gray-200 text-gray-900"
                                        />
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 transition-all focus-within:border-gray-300 focus-within:bg-white">
                                        <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Description</Label>
                                        <textarea
                                            placeholder="Add details…"
                                            value={newTaskDescription}
                                            onChange={e => setNewTaskDescription(e.target.value)}
                                            className="w-full text-[13px] font-normal bg-transparent outline-none placeholder-gray-200 text-gray-600 min-h-[100px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                            <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Priority</Label>
                                            <select
                                                value={newTaskPriority}
                                                onChange={e => setNewTaskPriority(e.target.value)}
                                                className="w-full bg-transparent outline-none text-[13px] font-medium text-gray-900 appearance-none cursor-pointer"
                                            >
                                                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 opacity-60">
                                            <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-2 block">Column</Label>
                                            <div className="text-[13px] font-medium text-gray-900 uppercase">
                                                {(board.find((i: any) => i.section._id === taskSectionId) as any)?.section.name}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 text-[11px] text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Adding to <span className="text-gray-900 uppercase">{(board.find((i: any) => i.section._id === taskSectionId) as any)?.section.name}</span>
                                </div>

                                <button
                                    onClick={() => createTaskMutation.mutate()}
                                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                                    className="w-full py-3 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all uppercase tracking-wider shadow-md"
                                >
                                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                                </button>
                            </motion.div>
                        </Modal>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout >
    );
};

export default ProjectPage;
