import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAlertStore } from "../../store/alertStore";

const AccountSettingsPage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const { user, tenant } = useAuthStore();
    const { success, error: showError } = useAlertStore();

    // UI State
    const [activeTab, setActiveTab] = useState<"security" | "general" | "workspace">("security");

    // Profile State
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [location, setLocation] = useState(user?.location || "");
    const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
    const [profilePhoto, setProfilePhoto] = useState(user?.profileImage || "");

    // Workspace Profile State
    const [workspaceName, setWorkspaceName] = useState(tenant?.name || "");
    const [workspaceSlug, setWorkspaceSlug] = useState(tenant?.slug || "");
    const [industry, setIndustry] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");
    const [logoUrl, setLogoUrl] = useState("");

    // Security State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setPhone(user.phone || "");
            setBio(user.bio || "");
            setLocation(user.location || "");
            setJobTitle(user.jobTitle || "");
            setProfilePhoto(user.profileImage || "");
        }
        if (tenant) {
            setWorkspaceName(tenant.name || "");
            setWorkspaceSlug(tenant.slug || "");
        }
    }, [user, tenant]);

    const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/user/sessions`);
            return res.data;
        }
    });

    const { data: tenantSettingsData } = useQuery({
        queryKey: ["tenant-settings", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/admin/settings`);
            return res.data;
        },
        enabled: !!slug && (user?.role === "OWNER" || user?.role === "ADMIN")
    });

    useEffect(() => {
        if (tenantSettingsData?.tenant) {
            setIndustry(tenantSettingsData.tenant.industry || "");
            setWebsite(tenantSettingsData.tenant.website || "");
            setDescription(tenantSettingsData.tenant.description || "");
            setLogoUrl(tenantSettingsData.tenant.logoUrl || "");
            setWorkspaceName(tenantSettingsData.tenant.name || "");
            setWorkspaceSlug(tenantSettingsData.tenant.slug || "");
        }
    }, [tenantSettingsData]);

    const activeSessions = sessionsData?.sessions || [];

    // Mutations
    const updateProfileMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.put(`/${slug}/user/update-profile`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            success(data.message || "Profile updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["profile", slug] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || "Failed to update profile");
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
            const res = await api.post(`/${slug}/user/change-password`, { oldPassword, newPassword });
            return res.data;
        },
        onSuccess: () => {
            success("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        },
        onError: (err: any) => {
            showError(err.message || err.response?.data?.message || "Failed to change password");
        }
    });

    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/${slug}/user/sessions/${sessionId}`);
        },
        onSuccess: () => {
            success("Device revoked successfully");
            queryClient.invalidateQueries({ queryKey: ["sessions", slug] });
        }
    });

    const revokeOthersMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/${slug}/user/sessions-revoke-others`);
        },
        onSuccess: () => {
            success("Other devices logged out successfully");
            queryClient.invalidateQueries({ queryKey: ["sessions", slug] });
        }
    });

    const updateWorkspaceProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.put(`/${slug}/admin/settings`, data);
            return res.data;
        },
        onSuccess: (data) => {
            success("Workspace settings updated!");
            queryClient.invalidateQueries({ queryKey: ["tenant-settings", slug] });
            if (data.tenant?.slug && data.tenant.slug !== slug) {
                window.location.href = `/${data.tenant.slug}/settings/account`;
            }
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || "Workspace update failed");
        }
    });

    const handleProfileSave = () => {
        const payload: any = {};
        if (name && name !== user?.name) payload.name = name;
        if (email && email !== user?.email) payload.email = email;
        if (phone !== user?.phone) payload.phone = phone;
        if (location !== user?.location) payload.location = location;
        if (jobTitle !== user?.jobTitle) payload.jobTitle = jobTitle;
        if (bio !== user?.bio) payload.bio = bio;
        if (profilePhoto !== user?.profileImage) payload.profileImage = profilePhoto;

        if (Object.keys(payload).length > 0) {
            updateProfileMutation.mutate(payload);
        }
    };

    const isProfileDirty = name !== user?.name || email !== user?.email || phone !== user?.phone || bio !== user?.bio || profilePhoto !== user?.profileImage;

    return (
        <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
            {/* Minimalist Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">Manage your personal profile and account security</p>
                </div>
                <div className="flex flex-nowrap bg-gray-50 p-1 rounded-lg border border-gray-200 overflow-x-auto scrollbar-hide">
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
                    {(user?.role === "OWNER" || user?.role === "ADMIN") && (
                        <button
                            onClick={() => setActiveTab("workspace")}
                            className={`px-4 py-1.5 text-[12px] font-medium transition-all rounded-md ${activeTab === "workspace" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Workspace
                        </button>
                    )}
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
                        <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto">
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
                        </div>

                        {/* Active Sessions Mini-Table */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <h2 className="text-[14px] font-semibold text-gray-900">Active Authorized Devices</h2>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to log out from all other devices?")) {
                                            revokeOthersMutation.mutate();
                                        }
                                    }}
                                    disabled={revokeOthersMutation.isPending || activeSessions.length <= 1}
                                    className="text-[12px] font-medium text-rose-500 hover:underline disabled:opacity-50"
                                >
                                    {revokeOthersMutation.isPending ? "Revoking..." : "Revoke others"}
                                </button>
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
                                                const isCurrent = session.isCurrent;
                                                const ip = meta?.ip === "::1" || meta?.ip === "::ffff:127.0.0.1" ? "127.0.0.1" : meta?.ip || "Unknown";
                                                const loginTime = meta?.loginAt ? new Date(meta.loginAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
                                                const ua = meta?.userAgent || "";
                                                let deviceName = "Unknown Device";
                                                if (ua.includes("Windows")) deviceName = "Windows PC";
                                                else if (ua.includes("Macintosh")) deviceName = "MacBook / iMac";
                                                else if (ua.includes("iPhone")) deviceName = "iPhone";
                                                else if (ua.includes("Android")) deviceName = "Android Phone";

                                                let browserName = "Browser";
                                                if (ua.includes("Chrome")) browserName = "Chrome";
                                                else if (ua.includes("Firefox")) browserName = "Firefox";
                                                else if (ua.includes("Safari") && !ua.includes("Chrome")) browserName = "Safari";
                                                else if (ua.includes("Edge")) browserName = "Edge";

                                                return (
                                                    <tr key={i} className="group hover:bg-gray-50/30">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-semibold text-gray-900">{deviceName} — {browserName}</span>
                                                                <span className="text-[12px] text-gray-500 font-mono">{ip}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isCurrent ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Current</span>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] text-gray-500 font-medium">{loginTime}</span>
                                                                    <span className="text-[10px] text-gray-400 capitalize">Previous Session</span>
                                                                </div>
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
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden shrink-0">
                                    {profilePhoto ? (
                                        <img src={profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        const url = prompt("Enter profile image URL:", profilePhoto);
                                        if (url !== null) setProfilePhoto(url);
                                    }}
                                    className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                                >
                                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-[9px] font-bold uppercase">Change</span>
                                </button>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-gray-900">{name || "Your Name"}</h3>
                                <p className="text-[13px] text-gray-500">{email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Job Title</label>
                                <input
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. Senior Product Designer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Location</label>
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="San Francisco, CA"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Bio / About</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Write a short bio about yourself..."
                            />
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
                    </motion.div >
                )}

                {
                    activeTab === "workspace" && (user?.role === "OWNER" || user?.role === "ADMIN") && (
                        <motion.div
                            key="workspace-control"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
                                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 space-y-6 h-fit">
                                    <div>
                                        <h2 className="text-[14px] font-semibold text-gray-900">Workspace Identity</h2>
                                        <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-tight">Public details and identification</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Company Name</label>
                                                <input
                                                    value={workspaceName}
                                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="Enter company name"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Industry</label>
                                                <input
                                                    value={industry}
                                                    onChange={(e) => setIndustry(e.target.value)}
                                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="e.g. Technology"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workspace Identifier (URL)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">app.space/</span>
                                                <input
                                                    value={workspaceSlug}
                                                    onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                                    className="w-full h-10 pl-[80px] pr-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                                    placeholder="unique-id"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400">Warning: Changing this will break existing deep links</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Website URL</label>
                                            <input
                                                value={website}
                                                onChange={(e) => setWebsite(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="https://acme.com"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Description</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                                placeholder="Tell us about your organization..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <button
                                            onClick={() => updateWorkspaceProfileMutation.mutate({
                                                name: workspaceName,
                                                slug: workspaceSlug, // The backend needs to support slug update in settings if we want it here
                                                industry,
                                                website,
                                                description,
                                                logoUrl
                                            })}
                                            disabled={updateWorkspaceProfileMutation.isPending}
                                            className="h-10 px-8 bg-gray-900 text-white text-[12px] font-semibold rounded-lg hover:bg-black transition-all disabled:opacity-50"
                                        >
                                            {updateWorkspaceProfileMutation.isPending ? "Applying Changes..." : "Save Workspace Profile"}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
                                        <div className="w-20 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center mb-4 transition-colors group cursor-pointer hover:bg-gray-100">
                                            {logoUrl ? (
                                                <img src={logoUrl} className="w-full h-full object-cover rounded-xl" alt="logo" />
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Logo</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-[13px] font-bold text-gray-900">{workspaceName || tenant?.name}</h3>
                                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest font-medium">{industry || "General Industry"}</p>
                                    </div>

                                    <div className="p-6 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-2">Subscription</p>
                                        <h4 className="text-[14px] font-bold mb-1">Standard Workspace</h4>
                                        <p className="text-[11px] opacity-80 leading-relaxed mb-4">You have access to all core features for manageable teams.</p>
                                        <button className="w-full h-8 bg-white text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-50 transition-colors">Manage Billing</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default AccountSettingsPage;
