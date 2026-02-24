import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";

const AcceptInvite = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [formData, setFormData] = useState({
        name: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post(`/auth/accept-invite?token=${token}`, data);
            return res.data;
        },
        onSuccess: () => {
            navigate("/login?message=Account activated successfully. Please login.");
        },
        onError: (err: any) => {
            setError(err.response?.data?.message ?? "Something went wrong. Please try again.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.password) {
            setError("All fields are required.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        mutation.mutate({
            name: formData.name,
            password: formData.password,
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Missing Token</h2>
                    <p className="text-gray-400 text-[13px] mt-2">The invitation link is invalid or incomplete.</p>
                    <Link to="/login" className="block mt-6 px-4 py-2 bg-gray-900 text-white rounded-xl text-[13px] font-bold">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex font-[Inter,sans-serif] antialiased">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-[46%] bg-gray-900 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />

                <div className="relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow">
                            <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </div>
                        <span className="font-semibold text-white text-[15px]">FlowSpace</span>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
                        Complete your<br />registration.
                    </h2>
                    <p className="text-gray-400 text-[15px] mt-4 leading-relaxed max-w-sm">
                        You've been invited to join the workspace. Set up your profile and password to get started.
                    </p>
                </div>

                <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <p className="text-[12px] text-gray-400 leading-relaxed italic">
                        "FlowSpace has completely transformed how our team manages multi-tenant infrastructures."
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500" />
                        <div>
                            <p className="text-[12px] font-bold text-white">Alex Johnson</p>
                            <p className="text-[10px] text-gray-500">CTO at TechGrid</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Accept Invitation</h1>
                        <p className="text-gray-400 text-[14px] mt-2 leading-relaxed">Fill in your details to join the team.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:bg-white focus:border-gray-900/10 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:bg-white focus:border-gray-900/10 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full h-11 px-4 bg-gray-50 border border-transparent rounded-xl text-[14px] outline-none focus:bg-white focus:border-gray-900/10 transition-all font-medium"
                            />
                        </div>

                        {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

                        <button
                            disabled={mutation.isPending}
                            className="w-full h-11 bg-gray-900 text-white text-[14px] font-bold rounded-xl hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {mutation.isPending ? "Setting up account…" : "Complete Setup"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvite;
