import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useAlertStore } from "../../store/alertStore";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { success, error: showError } = useAlertStore();

    const [token, setToken] = useState(searchParams.get("token") ?? "");
    const [resendEmail, setResendEmail] = useState("");

    const mutation = useMutation({
        mutationFn: async (token: string) => {
            const res = await api.post("/auth/verify-owner-email", { token });
            return res.data;
        },
        onSuccess: () => {
            success("Email verified!", "Redirecting you to login…");
            setTimeout(() => navigate("/login"), 1500);
        },
        onError: (err: any) => {
            showError(err?.response?.data?.message ?? "Invalid or expired token. Please try again.");
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutation.mutate(token.trim());
    };

    const resendMutation = useMutation({
        mutationFn: async (email: string) => {
            const res = await api.post("/auth/resend-verification-email", { email });
            return res.data;
        },
        onSuccess: () => {
            success("Verification email sent!", "Check your inbox for a new verification link.");
            setResendEmail("");
        },
        onError: (err: any) => {
            showError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
        },
    });

    const handleResend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        resendMutation.mutate(resendEmail.trim());
    };

    return (
        <div className="min-h-screen bg-white flex font-[Inter,sans-serif] antialiased">

            {/* ── Left brand panel ── */}
            <div className="hidden lg:flex lg:w-[46%] bg-gray-50 border-r border-gray-100 flex-col justify-between p-12 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shadow">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-900 tracking-tight text-[15px]">FlowSpace</span>
                </Link>

                {/* Centre copy */}
                <div className="relative z-10 space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-green-600 mb-4">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            One last step
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 leading-snug tracking-tight">
                            Verify your<br />email to<br />get started.
                        </h2>
                        <p className="text-gray-400 text-[14px] leading-relaxed mt-3 max-w-xs">
                            Paste the verification token from your email and click Verify to activate your account.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        {[
                            "Check your email inbox",
                            "Copy the verification token",
                            "Paste it here and click Verify",
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {i + 1}
                                </div>
                                <span className="text-[13px] text-gray-600">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom tip */}
                <div className="relative z-10 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                        <span className="font-semibold text-gray-800">Can't find the email?</span>{" "}
                        Check your spam or promotions folder. Tokens expire in <span className="font-semibold text-gray-700">10 minutes</span>.
                    </p>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">

                {/* Mobile logo */}
                <Link to="/" className="flex lg:hidden items-center gap-2 mb-10">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-900 text-[15px]">FlowSpace</span>
                </Link>

                <div className="w-full max-w-md mx-auto">

                    {/* Mail icon badge */}
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verify your email</h1>
                        <p className="text-gray-400 text-[13px] mt-1.5 leading-relaxed">
                            Enter the verification token from the email we sent you.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="verify-token" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                                Verification token
                            </label>
                            <input
                                id="verify-token"
                                type="text"
                                placeholder="Paste your token here…"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all font-mono"
                                required
                            />
                        </div>

                        <button
                            id="verify-submit"
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {mutation.isPending ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verifying…
                                </>
                            ) : (
                                <>
                                    Verify email
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </>
                            )}
                        </button>

                        {/* Error */}
                        {mutation.isError && (
                            <p className="text-[12px] text-red-500 text-center">
                                Verification failed — please check your token and try again.
                            </p>
                        )}
                    </form>

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Didn't receive an email?</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* ── Resend section ── */}
                    <form className="space-y-3 mb-6" onSubmit={handleResend}>
                        <div>
                            <label htmlFor="resend-email" className="block text-[12px] font-semibold text-gray-700 mb-1.5">Your email address</label>
                            <input id="resend-email" type="email" placeholder="jane@company.com" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all" required />
                        </div>
                        <button id="resend-submit" type="submit" disabled={resendMutation.isPending} className="w-full h-10 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg hover:border-gray-400 hover:text-gray-900 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                            {resendMutation.isPending ? (
                                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending…</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>Resend verification email</>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-8 text-[12px] text-gray-400">
                        <Link to="/login" className="hover:text-gray-700 transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Back to sign in
                        </Link>
                        <Link to="/signup" className="hover:text-gray-700 transition-colors">
                            Create new account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;