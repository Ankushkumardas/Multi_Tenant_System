import { Link } from "react-router-dom";
import { useState, useEffect } from "react";


const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Multi-Tenant Architecture",
    description: "Fully isolated workspaces per organisation. Each tenant gets their own data, members, and subscription — completely separated.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    title: "Kanban Board",
    description: "Visualise work with drag-and-drop Kanban boards. Organise tasks across Todo, In Progress, Review and Done with ease.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Real-Time Chat",
    description: "Built-in team messaging per project. Direct messages, group channels, mentions and reply threads — all real-time via WebSockets.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Role-Based Access",
    description: "Granular RBAC with Owner, Admin, Manager, User and Viewer roles. Control exactly who can create, edit or view resources.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Smart Notifications",
    description: "Real-time alerts for task assignments, mentions, project updates and billing events, delivered instantly across all devices.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Analytics & Audit",
    description: "Track team activity, subscription usage, and security events. Full audit trails give you complete visibility across your organisation.",
  },
];

const steps = [
  { step: "01", title: "Create your workspace", desc: "Sign up and set up your organisation in under a minute." },
  { step: "02", title: "Invite your team", desc: "Add members and assign roles tailored to your workflow." },
  { step: "03", title: "Ship faster together", desc: "Manage projects, chat in real-time, and track every task." },
];

const plans = [
  { name: "Free", price: "$0", desc: "Perfect for small teams just getting started.", highlight: false, cta: "Get started" },
  { name: "Pro", price: "$12", desc: "Everything teams need to move fast and stay in sync.", highlight: true, cta: "Start free trial" },
  { name: "Enterprise", price: "Custom", desc: "Advanced security, SLAs, and dedicated support.", highlight: false, cta: "Talk to sales" },
];

const ProductMockup = () => (
  <div className="relative w-full max-w-[520px] mx-auto select-none">
    {/* Browser chrome */}
    <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-3 h-5 bg-gray-200 rounded-full" />
      </div>
      {/* Content */}
      <div className="flex gap-0 h-[280px]">
        {/* Sidebar */}
        <div className="w-[160px] bg-gray-50 border-r border-gray-100 p-3 flex flex-col gap-2 shrink-0">
          <div className="h-4 w-20 bg-gray-300 rounded mb-3" />
          {["Dashboard", "Projects", "Tasks", "Chat", "Members"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-300" />
              <div className="h-3 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
        {/* Main panel */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Board header */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-gray-800 rounded" />
            <div className="h-6 w-16 bg-green-500 rounded-lg" />
          </div>
          {/* Kanban columns */}
          <div className="flex gap-2 h-[200px]">
            {[
              { label: "Todo", color: "bg-gray-300", tasks: [80, 60, 70] },
              { label: "In Progress", color: "bg-blue-300", tasks: [65, 90] },
              { label: "Review", color: "bg-yellow-300", tasks: [55] },
              { label: "Done", color: "bg-green-300", tasks: [70, 60] },
            ].map((col) => (
              <div key={col.label} className="flex-1 bg-gray-50 rounded-lg p-2">
                <div className={`h-2 w-3/4 ${col.color} rounded mb-2`} />
                <div className="flex flex-col gap-2">
                  {col.tasks.map((w, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded p-2">
                      <div className={`h-2 rounded`} style={{ width: `${w}%`, background: "#e5e7eb" }} />
                      <div className="h-2 w-2/3 bg-gray-100 rounded mt-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Floating stat card */}
    <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Task completion</span>
      <span className="text-2xl font-bold text-gray-900 leading-none">87%</span>
      <span className="text-[10px] text-green-500 font-medium">↑ 12% this week</span>
    </div>

    {/* Floating member pill */}
    <div className="absolute -top-3 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
      <div className="flex -space-x-2">
        {["#6366f1", "#10b981", "#f59e0b"].map((c, i) => (
          <div key={i} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: c }} />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-700">+14 online</span>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────
const Home = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-[Inter,sans-serif] antialiased">

      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-transparent"
          }`}
      >
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 tracking-tight text-[15px]">FlowSpace</span>
          </div>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-7 text-[13px] text-gray-500 font-medium">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-[13px] font-semibold bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left copy */}
          <div className="flex-1 max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-green-600 mb-5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              New — Multi-tenant support now live
            </div>

            <h1 className="text-[2.6rem] leading-[1.15] font-bold text-gray-900 tracking-tight mb-5">
              The project workspace<br />your team actually needs
            </h1>

            <p className="text-[15px] text-gray-500 leading-relaxed mb-8 max-w-md">
              Isolated workspaces, Kanban boards, real-time chat and role-based access — all in one platform built for growing organisations.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#features"
                className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[12px] text-gray-400">
                <span className="text-gray-700 font-semibold">2,400+</span> teams already running on FlowSpace
              </p>
            </div>
          </div>

          {/* Right mockup */}
          <div className="flex-1 flex justify-center w-full mt-4 lg:mt-0">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-widest text-green-600 font-semibold mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Built for modern teams</h2>
            <p className="text-gray-400 mt-3 text-[14px] max-w-sm mx-auto">
              All the essentials in one place — no integrations required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 mb-4 group-hover:bg-gray-900 group-hover:text-white transition-all duration-200">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-[14px] mb-1.5">{f.title}</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-widest text-green-600 font-semibold mb-3">Simple onboarding</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-[13px] mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-[14px] mb-2">{s.title}</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-widest text-green-600 font-semibold mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-gray-400 mt-3 text-[14px]">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-6 flex flex-col gap-4 transition-all duration-200 ${p.highlight
                    ? "bg-gray-900 border-gray-900 text-white shadow-xl scale-[1.03]"
                    : "bg-white border-gray-100 text-gray-900 hover:shadow-md"
                  }`}
              >
                <div>
                  <p className={`text-[11px] uppercase tracking-widest font-semibold mb-1 ${p.highlight ? "text-green-400" : "text-green-600"}`}>
                    {p.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{p.price}</span>
                    {p.price !== "Custom" && <span className={`text-[12px] mb-1 ${p.highlight ? "text-gray-400" : "text-gray-400"}`}>/mo per user</span>}
                  </div>
                  <p className={`text-[13px] mt-2 leading-relaxed ${p.highlight ? "text-gray-300" : "text-gray-400"}`}>
                    {p.desc}
                  </p>
                </div>
                <Link
                  to="/signup"
                  className={`mt-auto text-[13px] font-semibold px-4 py-2.5 rounded-lg text-center transition-all duration-200 ${p.highlight
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Ready to ship faster as a team?
          </h2>
          <p className="text-gray-400 text-[14px] mb-8">
            Start free today. No credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-[13px] font-semibold px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md"
          >
            Create your workspace
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gray-900 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-[13px]">FlowSpace</span>
          </div>
          <p className="text-[12px] text-gray-400">© 2026 FlowSpace. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[12px] text-gray-400">
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;