import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useProjectMembers, useProjectById, useBoard } from "../../hooks/useProjects";
import { MemberRow } from "../../components/projects/MemberRow";
import { useState } from "react";
import { api } from "../../lib/axios";
import { motion } from "framer-motion";

const ProjectMembers = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const { data: membersData } = useProjectMembers(projectId!);
    const { data: projectData } = useProjectById(projectId!);
    const { data: boardData } = useBoard(projectId!);

    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const project = projectData?.project ?? projectData;
    const board: any[] = boardData?.board ?? boardData ?? [];

    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

    // Members Logic
    const [inviteType, setInviteType] = useState<"project" | "workspace">("project");
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

    // Settings Logic
    const archiveMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/toggle-archive`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["project", slug, projectId] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/${slug}/projects/${projectId}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", slug] }); navigate(`/${slug}/projects`); },
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pt-8 pb-10 px-2 sm:px-4 h-full overflow-y-auto bg-white"
        >
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 2xl:gap-8">

                {/* ── LEFT COLUMN: MEMBERS ── */}
                <div className="space-y-3 md:col-span-1">
                    <div>
                        <h2 className="text-[12px] font-medium text-gray-900 uppercase tracking-widest">Team</h2>
                        <p className="text-[11px] text-gray-400 mt-1">{members.length} member{members.length !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="divide-y divide-gray-50">
                            {members.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-[13px] text-gray-400">No members yet.</p>
                                </div>
                            ) : (
                                members.map(m => (
                                    <div key={m._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                        <MemberRow member={m} projectId={projectId!} slug={slug!} qc={qc} isOwnerOrAdmin={isOwnerOrAdmin} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {isOwnerOrAdmin && (
                        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-3 mt-4">
                            <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Add member</h3>
                            <div className="flex gap-2">
                                {(["project", "workspace"] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setInviteType(t)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${inviteType === t ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                    >
                                        {t === "project" ? "Project" : "Workspace"}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 w-full pt-1">
                                <input
                                    type="email"
                                    placeholder="name@email.com"
                                    value={memberEmail}
                                    onChange={e => setMemberEmail(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (inviteType === "project" ? addMemberMutation.mutate() : workspaceInviteMutation.mutate())}
                                    className="flex-1 h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                                />
                                <button
                                    onClick={() => inviteType === "project" ? addMemberMutation.mutate() : workspaceInviteMutation.mutate()}
                                    disabled={!memberEmail.trim() || addMemberMutation.isPending || workspaceInviteMutation.isPending}
                                    className="h-10 px-4
                                     bg-gray-900 text-white rounded-xl text-[11px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all uppercase tracking-wider shadow-sm"
                                >
                                    {addMemberMutation.isPending || workspaceInviteMutation.isPending ? "…" : "Invite"}
                                </button>
                            </div>
                            {(addMemberMutation.isError || workspaceInviteMutation.isError) && (
                                <p className="text-[11px] text-rose-500 font-medium pt-1">
                                    {((addMemberMutation.error || workspaceInviteMutation.error) as any)?.response?.data?.message ?? "Something went wrong"}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: SETTINGS ── */}
                <div className="space-y-3 md:col-span-2 lg:col-span-3">
                    <div>
                        <h2 className="text-[12px] font-medium text-gray-900 uppercase tracking-widest">Settings</h2>
                        <p className="text-[11px] text-gray-400 mt-1">Project configuration</p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                            <span className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">Name</span>
                            <span className="text-[13px] text-gray-900 font-bold">{project?.name}</span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                            <span className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">Status</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${project?.status === "ARCHIVED" ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-600"}`}>
                                {project?.status ?? "ACTIVE"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                            <span className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">Columns</span>
                            <span className="text-[13px] text-gray-900 font-bold">{board.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">Created</span>
                            <span className="text-[13px] text-gray-900 font-bold">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A"}</span>
                        </div>
                    </div>

                    {isOwnerOrAdmin && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mt-6">Danger Zone</p>
                            <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <p className="text-[13px] font-bold text-orange-900">{project?.status === "ARCHIVED" ? "Restore Project" : "Archive Project"}</p>
                                    <p className="text-[11px] text-orange-600/70 mt-0.5 leading-tight font-medium">Hide this project across the workspace.</p>
                                </div>
                                <button
                                    onClick={() => archiveMutation.mutate()}
                                    className="h-9 px-4 bg-white text-orange-600 border border-orange-200 text-[11px] font-bold rounded-xl hover:bg-orange-600 hover:text-white transition-colors uppercase tracking-wider shrink-0 shadow-sm"
                                >
                                    {archiveMutation.isPending ? "…" : project?.status === "ARCHIVED" ? "Restore" : "Archive"}
                                </button>
                            </div>

                            <div className="bg-red-50/30 border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <p className="text-[13px] font-bold text-red-900">Delete Project</p>
                                    <p className="text-[11px] text-red-600/70 mt-0.5 leading-tight font-medium">Permanent action. Cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => { if (window.confirm("Delete this project permanently?")) deleteMutation.mutate(); }}
                                    className="h-9 px-4 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700 transition-colors uppercase tracking-wider shrink-0 shadow-sm shadow-red-600/20"
                                >
                                    {deleteMutation.isPending ? "…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </motion.div>
    );
};

export default ProjectMembers;
