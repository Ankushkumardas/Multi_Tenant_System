import React, { useState } from "react";
import { useWorkspaceMembers } from "../../hooks/useDashboard";
import { useAuthStore } from "../../store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const MembersPage = () => {
    const { slug } = useParams();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

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
        mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
            const res = await api.put(`/${slug}/admin/update-role`, { userId, role, status: "ACTIVE" });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
    });

    const removeUserMutation = useMutation({
        mutationFn: async (userId: string) => api.post(`/${slug}/admin/force-logout/${userId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] }),
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Users</p>
                    <h2 className="text-3xl font-extrabold text-gray-900">{members.length}</h2>
                    <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        +12% this month
                    </p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Active Now</p>
                    <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-extrabold text-gray-900">{activeNow}</h2>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-2">Across workspace locations</p>
                </div>
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[13px] font-bold text-gray-900">Roles Distribution</p>
                        <button className="text-[12px] font-medium text-blue-600 hover:text-blue-700">Manage Permissions</button>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 border-l-2 border-blue-600 pl-2">Admins</p>
                            <p className="text-lg font-bold text-gray-900 pl-2 border-l-2 border-transparent">{rolesCount['OWNER'] || 0 + rolesCount['ADMIN'] || 0}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 border-l-2 border-emerald-500 pl-2">Managers</p>
                            <p className="text-lg font-bold text-gray-900 pl-2 border-l-2 border-transparent">{rolesCount['MANAGER'] || 0}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 border-l-2 border-orange-500 pl-2">Editors/Users</p>
                            <p className="text-lg font-bold text-gray-900 pl-2 border-l-2 border-transparent">{rolesCount['USER'] || 0}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 border-l-2 border-gray-300 pl-2">Viewers</p>
                            <p className="text-lg font-bold text-gray-900 pl-2 border-l-2 border-transparent">{rolesCount['VIEWER'] || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-sm font-bold text-gray-900">Invite New User</h3>
                    <span className="text-xs text-gray-400">24 invites remaining this month</span>
                </div>
                <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input value={inviteName} onChange={e => setInviteName(e.target.value)} type="text" placeholder="John Doe" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-4">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                        <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" required placeholder="john@acme.co" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assign Role</label>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer">
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="USER">User</option>
                            <option value="VIEWER">Viewer</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" disabled={inviteMutation.isPending} className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Active Members Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">
                        Active Members <span className="text-gray-400 font-normal ml-2">Showing {paginatedMembers.length} of {members.length}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400">
                        <button className="p-1 hover:text-gray-900 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg></button>
                        <button className="p-1 hover:text-gray-900 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg></button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
                        ) : (
                            paginatedMembers.map((member: any) => (
                                <tr key={member._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                {member.name?.[0] || member.email?.[0] || "U"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{member.name || "User"}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {['OWNER', 'ADMIN'].includes(user?.role || '') && member._id !== user?._id && member.role !== 'OWNER' ? (
                                            <select
                                                value={member.role}
                                                onChange={(e) => updateRoleMutation.mutate({ userId: member._id, role: e.target.value })}
                                                className="border-none bg-transparent cursor-pointer text-sm font-medium text-gray-700 outline-none focus:ring-0"
                                            >
                                                <option value="ADMIN">Super Admin</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="USER">User</option>
                                                <option value="VIEWER">Viewer</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-700">{member.role}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {member.status === 'ACTIVE' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold tracking-wider uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> ONLINE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-bold tracking-wider uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> OFFLINE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {member.lastLoginAt ? formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true }) : "Never"}
                                    </td>
                                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center justify-end gap-3 text-gray-400">
                                            <button className="hover:text-gray-900 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></button>
                                            <button className="hover:text-blue-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                            {member._id !== user?._id && member.role !== 'OWNER' && (
                                                <button onClick={() => removeUserMutation.mutate(member._id)} className="hover:text-red-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50">‹ Previous</button>
                    <div className="flex gap-1.5">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded text-sm font-medium">{page}</span>
                    </div>
                    <button disabled={page * pageSize >= members.length} onClick={() => setPage(page + 1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50">Next ›</button>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Invitations */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-900">Pending Invitations</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded">{invites.length} Waiting</span>
                    </div>
                    <div className="p-5 space-y-4 flex-1">
                        {invites.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No pending invitations.</p>
                        ) : (
                            invites.map((invite: any) => (
                                <div key={invite._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{invite.email}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{invite.role} • Invited {formatDistanceToNow(new Date(invite.createdAt))} ago</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors">Resend</button>
                                        <button onClick={() => revokeInviteMutation.mutate(invite._id)} className="px-3 py-1.5 border border-red-100 text-red-600 text-xs font-semibold rounded hover:bg-red-50 transition-colors">Revoke</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Log */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-900">Admin Activity Audit</h3>
                        <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700">Full Log</button>
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                        {/* Mock logs */}
                        <div className="flex gap-4">
                            <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                            <div>
                                <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{user?.name}</span> logged in securely.</p>
                                <p className="text-xs text-gray-400 mt-1">Today at {new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shrink-0"></div>
                            <div>
                                <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">System</span> updated roles permissions.</p>
                                <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MembersPage;
