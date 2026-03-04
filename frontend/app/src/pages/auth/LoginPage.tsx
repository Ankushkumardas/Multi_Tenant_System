import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useAuthStore } from "../../store/authStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setTenant } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  interface LoginData {
    email: string;
    password: string;
  }
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: ""
  })

  const mutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data: any) => {
      // Store access token and populate auth store before navigating
      localStorage.setItem("token", data.accessToken);
      setUser(data.user);
      setTenant(data.tenant);
      navigate(`/${data.tenant.slug}/dashboard`);
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(formData);
  }
  return (
    <div className="min-h-screen bg-white flex font-[Inter,sans-serif] antialiased">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-gray-50 border-r border-gray-100 flex-col justify-between p-12 relative overflow-hidden">

        {/* Subtle grid pattern */}
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
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-green-600 mb-4">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Secure, role-based access
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-snug tracking-tight">
              Welcome back.<br />Pick up where<br />you left off.
            </h2>
            <p className="text-gray-400 text-[14px] leading-relaxed mt-3 max-w-xs">
              Your workspace is ready. Log in to manage projects, chat with your team and track tasks in real time.
            </p>
          </div>

          {/* Stat cards row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Active teams</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">2.4k+</p>
            </div>
            <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Tasks done</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">98k+</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[13px] text-gray-600 leading-relaxed italic">
            "Logging in every morning is the first thing I do. Everything I need is in one place."
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-400 to-teal-500" />
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Marcus T.</p>
              <p className="text-[11px] text-gray-400">Product Manager, Drift Studio</p>
            </div>
          </div>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to your account</h1>
            <p className="text-gray-400 text-[13px] mt-1.5">
              Don't have an account?{" "}
              <Link to="/signup" className="text-gray-900 font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={formData.email}
                placeholder="jane@company.com"
                className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-[12px] font-semibold text-gray-700">
                  Password
                </label>
                <a href="#" className="text-[12px] text-gray-500 hover:text-gray-900 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  className="w-full h-10 px-3 pr-10 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="login-remember"
                className="w-4 h-4 accent-gray-900 rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="login-remember" className="text-[12px] text-gray-500 cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 active:scale-[0.98] transition-all duration-150 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Signing in…" : (
                <>
                  Sign in
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Error */}
            {mutation.isError && (
              <p className="text-[12px] text-red-500 text-center mt-1">
                Invalid email or password. Please try again.
              </p>
            )}
          </form>


          {/* Back to home */}
          <p className="text-center text-[12px] text-gray-400 mt-8">
            <Link to="/" className="hover:text-gray-700 transition-colors flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;