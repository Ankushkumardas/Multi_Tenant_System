import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

const SessionsPage = () => {
    const { slug } = useParams();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const { data: sessionsData } = useQuery({
        queryKey: ["sessions", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/user/sessions`);
            return res.data;
        }
    });

    const activeSessions = sessionsData?.sessions || [];

    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/${slug}/user/change-password`, { oldPassword, newPassword });
            return res.data;
        },
        onSuccess: () => {
            alert("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to change password");
        }
    });

    return (
        <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-[20px] font-medium text-gray-900 tracking-tight">Security & Access</h2>
                <p className="text-[13px] text-gray-400 mt-1">Manage your password and connected sessions</p>
            </div>

            <div className="p-8 rounded-[32px] border border-gray-100 bg-gray-50/50 space-y-6">
                <h3 className="text-[14px] font-semibold text-gray-900 uppercase tracking-widest">Change Password</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">Current Password</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full max-w-sm h-11 px-4 bg-white border border-gray-100 rounded-xl text-[13px] focus:border-gray-200 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full max-w-sm h-11 px-4 bg-white border border-gray-100 rounded-xl text-[13px] focus:border-gray-200 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => changePasswordMutation.mutate()}
                        disabled={changePasswordMutation.isPending || !oldPassword || !newPassword}
                        className="h-10 px-6 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-black transition-all uppercase tracking-wider disabled:opacity-75 mt-2"
                    >
                        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>

            <div className="p-8 rounded-[32px] border border-gray-100 bg-gray-50/50 space-y-6">
                <h3 className="text-[14px] font-semibold text-gray-900 uppercase tracking-widest">Active Sessions</h3>
                <div className="space-y-3">
                    {activeSessions.length === 0 ? (
                        <p className="text-[13px] text-gray-400 italic">No active sessions found.</p>
                    ) : (
                        activeSessions.map((_: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-medium text-gray-900">Session {index + 1}</p>
                                        <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-1">Status: Active</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SessionsPage;
