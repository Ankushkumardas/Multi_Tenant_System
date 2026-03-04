import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { motion } from "framer-motion";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ProfilePage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    const updateProfileMutation = useMutation({
        mutationFn: async ({ name, email }: { name?: string, email?: string }) => {
            const res = await api.put(`/${slug}/user/update-profile`, { name, email });
            return res.data;
        },
        onSuccess: () => {
            alert("Profile updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["profile", slug] });
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to update profile");
        }
    });

    const handleSave = () => {
        const payload: any = {};
        if (name !== user?.name) payload.name = name;
        if (email !== user?.email) payload.email = email;
        if (Object.keys(payload).length > 0) {
            updateProfileMutation.mutate(payload);
        }
    };

    return (
        <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-[20px] font-medium text-gray-900 tracking-tight">Account Core</h2>
                <p className="text-[13px] text-gray-400 mt-1">Manage your primary identity and access credentials</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">Email Identifier</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-900/5 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">Role Hierarchy</label>
                    <div className="h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-[12px] flex items-center font-medium text-gray-900 uppercase tracking-wider">
                        {user?.role}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button onClick={handleSave} disabled={updateProfileMutation.isPending} className="h-10 px-6 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-black transition-all uppercase tracking-wider disabled:opacity-75">
                        {updateProfileMutation.isPending ? "Saving..." : "Save Protocol"}
                    </button>
                    <button onClick={() => { setName(user?.name || ""); setEmail(user?.email || ""); }} className="h-10 px-6 text-gray-400 text-[12px] font-medium hover:text-gray-900 transition-all uppercase tracking-wider">Cancel</button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfilePage;
