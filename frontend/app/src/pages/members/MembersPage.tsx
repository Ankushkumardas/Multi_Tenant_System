import { useState } from "react";
import { useWorkspaceMembers } from "../../hooks/useDashboard";
import { useAuthStore } from "../../store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
const MembersPage = () => {
    const { slug } = useParams();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: teamData, isLoading } = useWorkspaceMembers();
    const members = teamData?.users ?? [];

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("USER");
    const [inviteName, setInviteName] = useState("");

    const inviteMutation = useMutation({
        mutationFn: async ({ email, role, name }: { email: string, role: string, name: string }) => {
            const res = await api.post(`/${slug}/admin/send-invite`, { email, role, name });
            return res.data;
        },
        onSuccess: () => {
            setInviteEmail("");
            setInviteName("");
            queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            const res = await api.put(`/${slug}/admin/update-role`, { targetUserId: userId, newRole: role });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const removeUserMutation = useMutation({
        mutationFn: async (userId: string) => api.post(`/${slug}/admin/force-logout/${userId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        inviteMutation.mutate({ email: inviteEmail, role: inviteRole, name: inviteName });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your team and their workspace permissions.</p>
                </div>
            </div>

            {/* Invite Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Invite New Member</h3>
                <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                        <input
                            value={inviteName}
                            onChange={e => setInviteName(e.target.value)}
                            type="text"
                            placeholder="Full name"
                            className="w-full h-10 px-4 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white border border-transparent focus:border-gray-200"
                        />
                    </div>
                    <div className="md:col-span-4">
                        <input
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            type="email"
                            required
                            placeholder="Email address"
                            className="w-full h-10 px-4 bg-gray-50 rounded-xl text-sm outline-none focus:bg-white border border-transparent focus:border-gray-200"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                            className="w-full h-10 px-3 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-gray-200"
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="USER">Member</option>
                            <option value="VIEWER">Observer</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={inviteMutation.isPending}
                            className="w-full h-10 bg-gray-900 text-white rounded-xl text-[13px] font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {inviteMutation.isPending ? "Sending..." : "Invite"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={3} className="px-6 py-8"><div className="h-6 bg-gray-50 animate-pulse rounded-lg" /></td></tr>
                            ))
                        ) : (
                            members.map((member: any) => (
                                <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-500 uppercase">
                                                {member.name?.[0] || member.email?.[0] || "U"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{member.name || "User"}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {['OWNER', 'ADMIN'].includes(user?.role || '') && member._id !== user?._id && member.role !== 'OWNER' ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => updateRoleMutation.mutate({ userId: member._id, role: e.target.value })}
                                                className="h-8 px-2 bg-gray-50 border border-transparent rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-gray-200 transition-all cursor-pointer"
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="USER">Member</option>
                                                <option value="VIEWER">Observer</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                {member.role?.replace('USER', 'MEMBER')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {['OWNER', 'ADMIN'].includes(user?.role || '') && member._id !== user?._id && member.role !== 'OWNER' && (
                                            <button
                                                onClick={() => removeUserMutation.mutate(member._id)}
                                                className="text-xs font-medium text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MembersPage;
