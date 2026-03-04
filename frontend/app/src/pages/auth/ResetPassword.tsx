import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/axios";
import { motion } from "framer-motion";
import { useAlertStore } from "../../store/alertStore";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { success, error: showError } = useAlertStore();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) { showError("Password is required"); return; }
        if (!token) { showError("Missing reset token in URL"); return; }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password });
            success("Password reset successfully!", "Redirecting you to login…");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            showError(err.response?.data?.message || "Invalid or expired token.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center font-[Inter,sans-serif] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />

            <div className="sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>
                    </div>
                </Link>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white px-8 py-10 shadow-2xl shadow-gray-200/50 rounded-3xl border border-gray-100"
                >
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-center mb-2">Create New Password</h2>
                    <p className="text-[13px] text-gray-500 text-center mb-8">Enter your new secure password below.</p>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[14px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading || !token} className="w-full h-12 flex justify-center items-center rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md shadow-gray-900/20 disabled:opacity-70">
                            {loading ? "Processing..." : "Save Password"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;
