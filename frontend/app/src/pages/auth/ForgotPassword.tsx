import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios";
import { motion } from "framer-motion";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus("loading");
        try {
            const res = await api.post("/auth/forgot-password", { email });
            setStatus("success");
            setMessage(res.data.message || "Reset link sent to your email.");
        } catch (err: any) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center font-[Inter,sans-serif] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3" />

            <div className="sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                    </div>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white px-8 py-10 shadow-2xl shadow-gray-200/50 rounded-3xl border border-gray-100"
                >
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-center mb-2">Reset Password</h2>
                    <p className="text-[13px] text-gray-500 text-center mb-8">Enter your email and we'll send you a link to reset your password.</p>

                    {status === "success" ? (
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </div>
                            <p className="text-[14px] font-medium text-green-800">{message}</p>
                            <Link to="/login" className="block mt-6 text-[13px] font-semibold text-gray-900 hover:text-blue-600 transition-colors">Return to Login</Link>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {status === "error" && (
                                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    {message}
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-[12px] font-semibold text-gray-700 uppercase tracking-widest mb-1.5 ml-1">Email address</label>
                                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[14px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" placeholder="you@company.com" />
                            </div>
                            <button type="submit" disabled={status === "loading"} className="w-full h-12 flex justify-center items-center rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md shadow-gray-900/20 disabled:opacity-70">
                                {status === "loading" ? "Processing..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}

                    {status !== "success" && (
                        <div className="mt-8 text-center">
                            <Link to="/login" className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wide flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                                Back to login
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
