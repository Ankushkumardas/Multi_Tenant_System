import React, { useState } from "react";
import { useWorkspaceMembers } from "../../hooks/useDashboard";
import { useAuthStore } from "../../store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAlertStore } from "../../store/alertStore";

const MembersPage = () => {
    const { slug } = useParams();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { success } = useAlertStore();

    const { data: teamData, isLoading } = useWorkspaceMembers();
    const members = teamData?.users ?? [];
    const invites = teamData?.invites ?? [];

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("USER");
    const [inviteName, setInviteName] = useState("");

    const [page, setPage] = useState(1);
    const pageSize = 5;
    const paginatedMembers = members.slice((page - 1) * pageSize, page * pageSize);

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
        mutationFn: async ({ userId, role, status }: { userId: string, role: string, status?: string }) => {
            const res = await api.put(`/${slug}/admin/update-role`, { userId, role, status: status || "ACTIVE" });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const removeUserMutation = useMutation({
        mutationFn: async (userId: string) => api.post(`/${slug}/admin/force-logout/${userId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const resendInviteMutation = useMutation({
        mutationFn: async (inviteId: string) => api.post(`/${slug}/admin/resend-invite/${inviteId}`),
        onSuccess: () => success("Invitation resent!"),
    });

    const revokeInviteMutation = useMutation({
        mutationFn: async (inviteId: string) => api.post(`/${slug}/admin/revoke-invite/${inviteId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        inviteMutation.mutate({ email: inviteEmail, role: inviteRole, name: inviteName });
    };

    const rolesCount = members.reduce((acc: any, member: any) => {
        const r = member.role || "USER";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {});

    const activeNow = members.filter((m: any) => m.status === "ACTIVE").length;

    return (
        <div className="space-y-6 max-w-[1500px] mx-auto pb-10">

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Total Users</p>
                    <div className="flex items-end gap-1.5">
                        <p className="text-xl font-bold text-gray-900 leading-none">{members.length}</p>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 tracking-wider">+12% month</span>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Active Now</p>
                    <div className="flex items-end gap-1.5">
                        <p className="text-xl font-bold text-gray-900 leading-none">{activeNow}</p>
                        <span className="w-2 h-2 mb-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 tracking-wider hidden sm:inline">Members</span>
                    </div>
                </div>
                <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Roles Distribution</p>
                        <button className="text-[9px] uppercase tracking-wider font-bold text-blue-600 hover:text-blue-700">Manage</button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4">
                        <div className="flex-1 min-w-[60px]">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Admins</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{rolesCount['OWNER'] || 0 + rolesCount['ADMIN'] || 0}</p>
                        </div>
                        <div className="flex-1 min-w-[60px]">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mgrs</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{rolesCount['MANAGER'] || 0}</p>
                        </div>
                        <div className="flex-1 min-w-[60px]">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Users</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{rolesCount['USER'] || 0}</p>
                        </div>
                        <div className="flex-1 min-w-[60px]">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Viewers</p>
                            <p className="text-lg font-bold text-gray-900 leading-none">{rolesCount['VIEWER'] || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ── Left Column: Invite & Pending (1/4 space) ── */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Invite Form */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-shadow">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-[13px] font-bold text-gray-900">Invite New User</h3>
                            <span className="text-[11px] text-gray-400">24 left</span>
                        </div>
                        <form onSubmit={handleInvite} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input value={inviteName} onChange={e => setInviteName(e.target.value)} type="text" placeholder="John Doe" className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" required placeholder="john@acme.co" className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Assign Role</label>
                                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer">
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="USER">User</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                            </div>
                            <button type="submit" disabled={inviteMutation.isPending} className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 tracking-wider uppercase mt-1">
                                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                            </button>
                        </form>
                    </div>

                    {/* Pending Invitations */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 rounded-t-2xl">
                            <h3 className="text-[13px] font-bold text-gray-900">Pending Invites</h3>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded">{invites.length}</span>
                        </div>
                        <div className="p-4 space-y-3 flex-1 max-h-[300px] overflow-y-auto">
                            {invites.length === 0 ? (
                                <p className="text-[11px] text-gray-400 text-center py-4 uppercase font-bold tracking-wider">No pending invites</p>
                            ) : (
                                invites.map((invite: any) => (
                                    <div key={invite._id} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-900 break-all leading-tight">{invite.email}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                {invite.role} • {formatDistanceToNow(new Date(invite.createdAt))} ago
                                            </p>
                                        </div>
                                        <div className="flex gap-2 w-full pt-1">
                                            <button onClick={() => resendInviteMutation.mutate(invite._id)} disabled={resendInviteMutation.isPending} className="flex-1 py-1 px-2 border border-blue-100 text-blue-600 bg-blue-50 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 uppercase tracking-wider" >
                                                {resendInviteMutation.isPending ? "..." : "Resend"}
                                            </button>
                                            <button onClick={() => revokeInviteMutation.mutate(invite._id)} className="flex-1 py-1 px-2 border border-red-100 text-red-600 bg-red-50 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors uppercase tracking-wider">
                                                Revoke
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Table & Audit (3/4 space) ── */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Active Members Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-50 bg-gray-50/30 gap-3">
                            <h3 className="text-[13px] font-bold text-gray-900">
                                Active Members <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-2">Showing {paginatedMembers.length} of {members.length}</span>
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400">
                                <button className="p-1 hover:text-gray-900 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-gray-50/50">
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Active</th>
                                        <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Loading...</td></tr>
                                    ) : (
                                        paginatedMembers.map((member: any) => (
                                            <tr key={member._id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
                                                            {member.name?.[0] || member.email?.[0] || "U"}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-gray-900 leading-tight">{member.name || "User"}</p>
                                                            <p className="text-[11px] text-gray-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {['OWNER', 'ADMIN'].includes(user?.role || '') && member._id !== user?._id && member.role !== 'OWNER' ? (
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateRoleMutation.mutate({ userId: member._id, role: e.target.value })}
                                                            className="border-none bg-transparent cursor-pointer text-[11px] font-bold text-gray-700 outline-none focus:ring-0 uppercase tracking-wider px-0 py-0 h-auto"
                                                        >
                                                            <option value="ADMIN">Admin</option>
                                                            <option value="MANAGER">Manager</option>
                                                            <option value="USER">User</option>
                                                            <option value="VIEWER">Viewer</option>
                                                        </select>
                                                    ) : (
                                                        <span className="text-[11px] font-bold text-gray-700 tracking-wider uppercase">{member.role}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {member.status === 'ACTIVE' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-bold tracking-widest uppercase">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> ONLINE
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold tracking-widest uppercase">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> OFFLINE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-[11px] font-medium text-gray-500">
                                                    {member.lastLoginAt ? formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true }) : "Never"}
                                                </td>
                                                <td className="px-4 py-2.5 text-right opacity-0 group-[.hover]:opacity-100 lg:group-hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center justify-end gap-3 text-gray-400">
                                                        <button
                                                            onClick={() => updateRoleMutation.mutate({ userId: member._id, role: member.role, status: member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                                                            title={member.status === 'ACTIVE' ? "Suspend User" : "Activate User"}
                                                            className={`transition-colors ${member.status === 'ACTIVE' ? 'hover:text-amber-600' : 'hover:text-green-600'}`}
                                                        >
                                                            {member.status === 'ACTIVE' ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            )}
                                                        </button>
                                                        {member._id !== user?._id && member.role !== 'OWNER' && (
                                                            <button onClick={() => removeUserMutation.mutate(member._id)} title="Force Logout" className="hover:text-red-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 disabled:opacity-50">‹ Previous</button>
                            <span className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded text-[11px] font-bold">{page}</span>
                            <button disabled={page * pageSize >= members.length} onClick={() => setPage(page + 1)} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 disabled:opacity-50">Next ›</button>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default MembersPage;
