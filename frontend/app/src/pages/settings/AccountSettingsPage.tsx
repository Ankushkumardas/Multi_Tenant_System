import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AccountSettingsPage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const { user, tenant } = useAuthStore();

    // UI State
    const [activeTab, setActiveTab] = useState<"security" | "general">("security");

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    // Security State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    // Queries
    const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/user/sessions`);
            return res.data;
        }
    });

    const activeSessions = sessionsData?.sessions || [];

    // Mutations
    const updateProfileMutation = useMutation({
        mutationFn: async ({ name, email }: { name?: string, email?: string }) => {
            const res = await api.put(`/${slug}/user/update-profile`, { name, email });
            return res.data;
        },
        onSuccess: (data) => {
            alert(data.message || "Profile updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["profile", slug] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to update profile");
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
            const res = await api.post(`/${slug}/user/change-password`, { oldPassword, newPassword });
            return res.data;
        },
        onSuccess: () => {
            alert("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err: any) => {
            alert(err.message || err.response?.data?.message || "Failed to change password");
        }
    });

    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/${slug}/user/sessions/${sessionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessions", slug] });
        }
    });

    const handleProfileSave = () => {
        const payload: any = {};
        if (name && name !== user?.name) payload.name = name;
        if (email && email !== user?.email) payload.email = email;

        if (Object.keys(payload).length > 0) {
            updateProfileMutation.mutate(payload);
        }
    };

    const isProfileDirty = name !== user?.name || email !== user?.email;

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
            {/* Minimalist Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Manage your personal profile and account security</p>
                </div>
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`px-4 py-1.5 text-[12px] font-medium transition-all rounded-md ${activeTab === "security" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Security & Access
                    </button>
                    <button
                        onClick={() => setActiveTab("general")}
                        className={`px-4 py-1.5 text-[12px] font-medium transition-all rounded-md ${activeTab === "general" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        General Info
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "security" && (
                    <motion.div
                        key="security-compact"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="space-y-6"
                    >
                        {/* 2nd column for status and rotation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Change Password Card */}
                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden h-fit">
                                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                                    <h2 className="text-[14px] font-semibold text-gray-900">Update Password</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Current Password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Min. 8 characters"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Repeat new key"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={() => changePasswordMutation.mutate()}
                                            disabled={changePasswordMutation.isPending || !oldPassword || !newPassword}
                                            className="h-10 px-6 bg-gray-900 text-white text-[12px] font-semibold rounded-lg hover:bg-black transition-all disabled:opacity-50"
                                        >
                                            {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Organization Info */}
                            <div className="space-y-6">
                                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-5">
                                    <h2 className="text-[14px] font-semibold text-gray-900">Security Health</h2>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[13px]">
                                            <span className="text-gray-500">Email Verification</span>
                                            {user?.isEmailVerified ? (
                                                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="text-rose-500 font-semibold flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-[13px]">
                                            <span className="text-gray-500">Workspace</span>
                                            <span className="text-gray-900 font-medium">{tenant?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[13px]">
                                            <span className="text-gray-500">System Role</span>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded font-bold uppercase">{user?.role}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Last Login</span>
                                            <span className="text-[13px] text-gray-700 font-medium">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Just now'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-semibold text-rose-600">Delete Account</span>
                                        <span className="text-[11px] text-gray-500">This action cannot be undone</span>
                                    </div>
                                    <button className="px-4 py-2 bg-white text-rose-600 border border-rose-200 text-[11px] font-bold rounded-lg hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest">Delete</button>
                                </div>
                            </div>
                        </div>

                        {/* Active Sessions Mini-Table */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <h2 className="text-[14px] font-semibold text-gray-900">Active Authorized Devices</h2>
                                <button className="text-[12px] font-medium text-rose-500 hover:underline">Revoke others</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Device / IP</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sessionsLoading ? (
                                            Array(2).fill(0).map((_, i) => (
                                                <tr key={i}><td colSpan={3} className="px-6 py-8 animate-pulse bg-gray-50/10"></td></tr>
                                            ))
                                        ) : activeSessions.length === 0 ? (
                                            <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-[13px]">No active remote sessions found</td></tr>
                                        ) : (
                                            activeSessions.map((session: any, i: number) => {
                                                const meta = session.meta;
                                                const isCurrent = i === 0;
                                                const ip = meta?.ip === "::1" || meta?.ip === "::ffff:127.0.0.1" ? "127.0.0.1" : meta?.ip || "Unknown";

                                                return (
                                                    <tr key={i} className="group hover:bg-gray-50/30">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-semibold text-gray-900">{meta?.userAgent?.includes("Chrome") ? "Chrome" : meta?.userAgent?.includes("Firefox") ? "Firefox" : "Browser Session"}</span>
                                                                <span className="text-[12px] text-gray-500 font-mono">{ip}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isCurrent ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Current</span>
                                                            ) : (
                                                                <span className="text-[12px] text-gray-400">Offline</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {!isCurrent && (
                                                                <button onClick={() => revokeSessionMutation.mutate(session.sessionId)} className="text-[12px] font-medium text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">Revoke</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "general" && (
                    <motion.div
                        key="general-compact"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="max-w-[600px] border border-gray-100 bg-white rounded-xl shadow-sm p-8 space-y-6"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <div>
                                <button className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Change Photo</button>
                                <p className="text-[11px] text-gray-400 mt-0.5 uppercase tracking-wide">JPG/PNG up to 2MB</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Display Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Work Email"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                onClick={handleProfileSave}
                                disabled={updateProfileMutation.isPending || !isProfileDirty}
                                className="h-10 px-8 bg-blue-600 text-white text-[12px] font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {updateProfileMutation.isPending ? "Syncing..." : "Update Profile"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccountSettingsPage;
