import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useProjectMembers } from "../../hooks/useProjects";
import { MemberRow } from "../../components/projects/MemberRow";
import { useState } from "react";
import { api } from "../../lib/axios";
import { motion } from "framer-motion";

const ProjectMembers = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();
    const { user } = useAuthStore();

    const { data: membersData } = useProjectMembers(projectId!);

    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];

    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 overflow-y-auto"
        >
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-[12px] font-medium text-gray-900 uppercase tracking-widest">Team</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
                </div>

                {/* Members list */}
                <div className="divide-y divide-gray-50 mb-8 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                    {members.length === 0 ? (
                        <div className="py-10 text-center">
                            <svg className="w-7 h-7 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-[12px] text-gray-400">No members yet</p>
                        </div>
                    ) : (
                        members.map(m => (
                            <MemberRow key={m._id} member={m} projectId={projectId!} slug={slug!} qc={qc} isOwnerOrAdmin={isOwnerOrAdmin} />
                        ))
                    )}
                </div>

                {/* Add Member inline */}
                {isOwnerOrAdmin && (
                    <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Add member</p>

                        <div className="flex gap-1.5 mb-4">
                            {(["project", "workspace"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setInviteType(t)}
                                    className={`px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition-all ${inviteType === t ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                                >
                                    {t === "project" ? "Project" : "Workspace"}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full">
                            <input
                                type="email"
                                placeholder="name@email.com"
                                value={memberEmail}
                                onChange={e => setMemberEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (inviteType === "project" ? addMemberMutation.mutate() : workspaceInviteMutation.mutate())}
                                className="flex-1 max-w-sm h-10 px-3 bg-white border border-gray-100 rounded-lg text-[12px] text-gray-900 placeholder-gray-300 outline-none focus:border-gray-300 transition-all font-medium"
                            />
                            <button
                                onClick={() => inviteType === "project" ? addMemberMutation.mutate() : workspaceInviteMutation.mutate()}
                                disabled={!memberEmail.trim() || addMemberMutation.isPending || workspaceInviteMutation.isPending}
                                className="h-10 px-6 bg-gray-900 text-white rounded-lg text-[11px] hover:bg-gray-700 disabled:opacity-40 transition-all uppercase tracking-wider"
                            >
                                {addMemberMutation.isPending || workspaceInviteMutation.isPending ? "…" : "Add"}
                            </button>
                        </div>

                        {(addMemberMutation.isError || workspaceInviteMutation.isError) && (
                            <p className="text-[11px] text-red-500 mt-2 font-medium">
                                {((addMemberMutation.error || workspaceInviteMutation.error) as any)?.response?.data?.message ?? "Something went wrong"}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectMembers;
