import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";


const PLANS = [
  {
    id: "FREE" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Great for small teams getting started",
    highlight: false,
    badge: null,
    features: [
      { label: "Up to 10 users", ok: true },
      { label: "Up to 2 projects", ok: true },
      { label: "Direct Chat", ok: true },
      { label: "Kanban Board", ok: true },
      { label: "Notifications", ok: true },
      { label: "Audit Logs", ok: true },
      { label: "Email Notifications", ok: true },
      { label: "Analytics", ok: false },
      { label: "Group Chat", ok: false },
      { label: "File Sharing", ok: false },
      { label: "Reminders", ok: false },
      { label: "Integrations", ok: false },
    ],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$29",
    period: "/ mo",
    tagline: "Everything growing teams need",
    highlight: true,
    badge: "Most popular",
    features: [
      { label: "Up to 50 users", ok: true },
      { label: "Up to 20 projects", ok: true },
      { label: "Direct Chat", ok: true },
      { label: "Kanban Board", ok: true },
      { label: "Notifications", ok: true },
      { label: "Audit Logs", ok: true },
      { label: "Email Notifications", ok: true },
      { label: "Analytics", ok: true },
      { label: "Group Chat", ok: true },
      { label: "File Sharing", ok: true },
      { label: "Reminders", ok: true },
      { label: "Integrations", ok: false },
    ],
  },
  {
    id: "ENTERPRISE" as const,
    name: "Enterprise",
    price: "$99",
    period: "/ mo",
    tagline: "Advanced security, SLAs & support",
    highlight: false,
    badge: null,
    features: [
      { label: "Up to 1000 users", ok: true },
      { label: "Unlimited projects", ok: true },
      { label: "Direct Chat", ok: true },
      { label: "Kanban Board", ok: true },
      { label: "Notifications", ok: true },
      { label: "Audit Logs", ok: true },
      { label: "Email Notifications", ok: true },
      { label: "Analytics", ok: true },
      { label: "Group Chat", ok: true },
      { label: "File Sharing", ok: true },
      { label: "Reminders", ok: true },
      { label: "Integrations", ok: true },
    ],
  },
] as const;


const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-900 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const XIcon = () => (
  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Stepper = ({ step }: { step: 1 | 2 }) => (
  <div className="flex items-center gap-2 mb-8">
    {/* Step 1 */}
    <div className={`flex items-center gap-2 text-[12px] font-semibold transition-colors ${step >= 1 ? "text-gray-900" : "text-gray-300"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step > 1 ? "bg-gray-900 text-white" : step === 1 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
        {step > 1 ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : "1"}
      </div>
      Account
    </div>

    {/* Connector */}
    <div className={`flex-1 h-px max-w-[40px] transition-all ${step > 1 ? "bg-gray-900" : "bg-gray-200"}`} />

    {/* Step 2 */}
    <div className={`flex items-center gap-2 text-[12px] font-semibold transition-colors ${step >= 2 ? "text-gray-900" : "text-gray-300"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${step === 2 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
        2
      </div>
      Choose plan
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const SignupPage = () => {
  interface Register {
    name: string,
    email: string,
    password: string,
    companyName: string,
    plan: "FREE" | "PRO" | "ENTERPRISE"
  }

  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const [formData, setformData] = useState({ name: "", email: "", password: "", plan: selectedPlan, companyName: "" });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selected = PLANS.find((p) => p.id === selectedPlan);
    navigate("/checkout", {
      state: {
        mode: "signup",
        planId: selectedPlan,
        planName: selected?.name ?? selectedPlan,
        priceLabel: selected?.price ?? "$0",
        tagline: selected?.tagline ?? "",
        signupData: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          plan: selectedPlan,
        } as Register,
      },
    });
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep(2);
  };

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
              Free to start, no credit card needed
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-snug tracking-tight">
              Set up your<br />workspace in<br />minutes.
            </h2>
            <p className="text-gray-400 text-[14px] leading-relaxed mt-3 max-w-xs">
              Create your account, invite your team and start shipping projects — all from one place.
            </p>
          </div>

          {/* Stat cards */}
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
            "Onboarding took less than five minutes. Our whole team was up and running the same day."
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-400 to-indigo-500" />
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Sarah K.</p>
              <p className="text-[11px] text-gray-400">Engineering Lead, Stacklane</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={`flex-1 flex flex-col justify-center px-6 sm:px-12 py-12 ${step === 2 ? "lg:px-10" : "lg:px-16"}`}>

        {/* Mobile logo */}
        <Link to="/" className="flex lg:hidden items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">FlowSpace</span>
        </Link>

        <div className={`w-full mx-auto ${step === 2 ? "max-w-3xl" : "max-w-md"}`}>

          {/* Stepper */}
          <Stepper step={step} />

          {/* ─── STEP 1: Account details ─────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create your account</h1>
                <p className="text-gray-400 text-[13px] mt-1.5">
                  Already have an account?{" "}
                  <Link to="/login" className="text-gray-900 font-semibold hover:underline">Sign in</Link>
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleNextStep}>
                {/* Name */}
                <div>
                  <label htmlFor="signup-name" className="block text-[12px] font-semibold text-gray-700 mb-1.5">Full name</label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={(e) => setformData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="signup-email" className="block text-[12px] font-semibold text-gray-700 mb-1.5">Work email</label>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(e) => setformData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="signup-password" className="block text-[12px] font-semibold text-gray-700 mb-1.5">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setformData({ ...formData, password: e.target.value })}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    required
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="signup-company" className="block text-[12px] font-semibold text-gray-700 mb-1.5">Company name</label>
                  <input
                    id="signup-company"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={(e) => setformData({ ...formData, companyName: e.target.value })}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    required
                  />
                </div>

                {/* Next */}
                <button
                  id="signup-next"
                  type="submit"
                  className="w-full h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 active:scale-[0.98] transition-all duration-150 mt-2 flex items-center justify-center gap-2"
                >
                  Continue to plan selection
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </form>
            </>
          )}

          {/* ─── STEP 2: Plan selection ──────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Choose your plan</h1>
                <p className="text-gray-400 text-[13px] mt-1.5">You can always upgrade or downgrade later from your dashboard.</p>
              </div>

              <form onSubmit={handleRegister}>
                {/* Plan cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        id={`plan-${plan.id.toLowerCase()}`}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative text-left rounded-xl border-2 p-5 transition-all duration-150 focus:outline-none ${isSelected
                          ? "border-gray-900 bg-gray-50 shadow-md"
                          : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
                          }`}
                      >
                        {/* Badge */}
                        {plan.badge && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {plan.badge}
                          </span>
                        )}

                        {/* Selected indicator */}
                        <div className={`absolute top-3.5 right-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-gray-900 bg-gray-900" : "border-gray-200"
                          }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          )}
                        </div>

                        {/* Plan name & price */}
                        <p className="text-[13px] font-bold text-gray-900 pr-6">{plan.name}</p>
                        <div className="flex items-baseline gap-1 mt-1 mb-1">
                          <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                          <span className="text-[11px] text-gray-400">{plan.period}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-4 leading-snug">{plan.tagline}</p>

                        {/* Feature list */}
                        <ul className="space-y-1.5">
                          {plan.features.map((f) => (
                            <li key={f.label} className="flex items-center gap-2">
                              {f.ok ? <CheckIcon /> : <XIcon />}
                              <span className={`text-[11px] ${f.ok ? "text-gray-700" : "text-gray-300"}`}>{f.label}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {/* Action row */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    id="signup-back"
                    onClick={() => setStep(1)}
                    className="h-10 px-4 text-[13px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    id="signup-submit"
                    type="submit"
                    className="flex-1 h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <>
                      Create account with {PLANS.find(p => p.id === selectedPlan)?.name} plan
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  </button>
                </div>

              </form>
            </>
          )}

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

export default SignupPage;