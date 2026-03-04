import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
    useSubscriptionHistory,
    usePlans,
    useDashboardStats,
    useWorkspaceMembers,
} from "../../hooks/useDashboard";
import { api } from "../../lib/axios";

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";

const CheckIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
);

const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700 border-green-100",
    EXPIRED: "bg-red-50 text-red-600 border-red-100",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const actionLabel: Record<string, string> = {
    CREATED: "Created",
    UPGRADED: "Upgraded",
    DOWNGRADED: "Downgraded",
    RENEWED: "Renewed",
    BILLING_CYCLE_CHANGED: "Cycle changed",
};

const actionColor: Record<string, string> = {
    CREATED: "bg-blue-50 text-blue-700",
    UPGRADED: "bg-green-50 text-green-700",
    DOWNGRADED: "bg-orange-50 text-orange-600",
    RENEWED: "bg-purple-50 text-purple-700",
    BILLING_CYCLE_CHANGED: "bg-gray-100 text-gray-600",
};

// ─────────────────────────────────────────────────────────────────────────────

const SubscriptionPage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: subData, isLoading: subLoading, error: subError } = useSubscriptionHistory();
    const { data: plansData, isLoading: plansLoading, error: plansError } = usePlans();
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers();

    const [activeTab, setActiveTab] = useState("Overview");
    const tabs = ["Overview", "Billing History"];

    // ── mutations ──────────────────────────────────────────────────────────────
    const toggleAutoRenewMutation = useMutation({
        mutationFn: async () => {
            if (!slug) throw new Error("No slug");
            await api.post(`/${slug}/subscription/toggle-auto-renew`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] }),
    });

    const renewMutation = useMutation({
        mutationFn: async () => {
            if (!slug) throw new Error("No slug");
            await api.post(`/${slug}/subscription/renew`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] }),
    });

    const updateCycleMutation = useMutation({
        mutationFn: async (cycle: string) => {
            if (!slug) throw new Error("No slug");
            await api.post(`/${slug}/subscription/billing-cycle`, { billingCycle: cycle });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] }),
    });

    // ── data ───────────────────────────────────────────────────────────────────
    const subscription = subData?.subscription ?? {};
    const history: any[] = subscription?.history ?? [];
    const planObj = subscription?.planId ?? {};

    const planName = planObj?.name ?? "—";
    const planPrice = planObj?.price ?? 0;
    const planStatus = subscription?.status ?? "ACTIVE";
    const billingCycle = subscription?.billingCycle ?? "MONTHLY";
    const autoRenew = subscription?.autoRenew ?? false;
    const paymentProvider = subscription?.paymentProvider ?? "MANUAL";

    const maxProjects = planObj?.limits?.maxProjects ?? 0;
    const maxMembers = planObj?.limits?.maxUsers ?? 0;
    const usedProjects: number = statsData?.stats?.totalProjects ?? 0;
    const usedMembers: number = membersData?.users?.length ?? 0;

    const projectPct = maxProjects > 0 ? Math.min(100, Math.round((usedProjects / maxProjects) * 100)) : 0;
    const memberPct = maxMembers > 0 ? Math.min(100, Math.round((usedMembers / maxMembers) * 100)) : 0;

    const handleSwitchPlan = (planId: string) => {
        if (!plansData || !slug) return;
        const plan = plansData.find((p: any) => p._id === planId);
        if (!plan) return;
        navigate(`/${slug}/settings/subscription/checkout`, {
            state: { mode: "change", slug, planId: plan._id, planName: plan.name, priceLabel: `$${plan.price}`, tagline: "Adjust your workspace limits instantly." },
        });
    };

    // ── loading / error ────────────────────────────────────────────────────────
    if (subLoading || plansLoading || statsLoading || membersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-sm text-gray-400 animate-pulse">Loading subscription data…</div>
            </div>
        );
    }

    if (subError || plansError) {
        return (
            <div className="m-6 p-4 rounded-xl border border-red-100 bg-red-50 text-sm text-red-600">
                {(subError as any)?.message || (plansError as any)?.message || "Failed to load data."}
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="w-full">
            {/* ── Page header ── */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Subscription & Billing</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Manage your plan, billing cycle, and payment details.</p>
                </div>
                <button
                    onClick={() => {
                        const el = document.getElementById('plans-comparison');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    Upgrade Plan
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-6 border-b border-gray-100 mb-4">
                {tabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`pb-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${activeTab === t
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ══════════════════════  OVERVIEW TAB  ══════════════════════════ */}
            {activeTab === "Overview" && (
                <div className="space-y-6">
                    {/* Top row: plan card + usage */}
                    <div className="grid grid-cols-1 lg:grid-cols-7
                     gap-4">
                        {/* Current plan card */}
                        <div className="lg:col-span-2 relative p-[1.5px] rounded-2xl bg-linear-to-br from-blue-600 via-violet-600 to-emerald-500 shadow-lg overflow-hidden group">
                            <div className="bg-white rounded-[14.5px] p-5 relative z-10">
                                <div className={`absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor[planStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                    {planStatus}
                                </div>

                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Current Plan</p>
                                <h2 className="text-xl font-black text-gray-900 mb-0.5 leading-tight">{planName}</h2>
                                <p className="text-xl font-semibold text-gray-900 mb-4">
                                    ${planPrice}<span className="text-xs text-gray-400 font-normal">/mo</span>
                                </p>

                                <div className="space-y-2.5 text-xs mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-medium">Billing cycle</span>
                                        <span className="font-bold text-gray-900 capitalize px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">{billingCycle.replace("_", " ").toLowerCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="font-medium">Start date</span>
                                        <span className="font-bold text-gray-900">{fmt(subscription?.startDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="font-medium">Next payment</span>
                                        <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">{fmt(subscription?.endDate)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="font-medium">Payment via</span>
                                        <span className="font-bold text-gray-900">{paymentProvider}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-gray-500 font-medium">Auto-renew</span>
                                        <button
                                            onClick={() => toggleAutoRenewMutation.mutate()}
                                            disabled={toggleAutoRenewMutation.isPending}
                                            className={`w-9 h-5 rounded-full relative transition-colors ${autoRenew ? "bg-blue-600" : "bg-gray-300"}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoRenew ? "translate-x-4.5" : "translate-x-0.5"}`} />
                                        </button>
                                    </div>
                                </div>

                                {planStatus === "EXPIRED" && (
                                    <button
                                        onClick={() => renewMutation.mutate()}
                                        disabled={renewMutation.isPending}
                                        className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60 shadow-lg shadow-gray-200"
                                    >
                                        {renewMutation.isPending ? "Renewing…" : "Renew Subscription"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Usage + billing cycle */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Usage meters */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Projects */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Projects</p>
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-extrabold text-gray-900 mb-1">
                                        {usedProjects}
                                        <span className="text-sm font-normal text-gray-400"> / {maxProjects > 0 ? maxProjects : "∞"}</span>
                                    </p>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${projectPct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5">{projectPct}% used</p>
                                </div>

                                {/* Members */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Members</p>
                                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-extrabold text-gray-900 mb-1">
                                        {usedMembers}
                                        <span className="text-sm font-normal text-gray-400"> / {maxMembers > 0 ? maxMembers : "∞"}</span>
                                    </p>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${memberPct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5">{memberPct}% utilized</p>
                                </div>
                            </div>

                            {/* Billing cycle switcher */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Billing Cycle</p>
                                <div className="flex flex-wrap gap-2">
                                    {(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"] as const).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => updateCycleMutation.mutate(c)}
                                            disabled={billingCycle === c || updateCycleMutation.isPending}
                                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${billingCycle === c
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                                                }`}
                                        >
                                            {c === "HALF_YEARLY" ? "Half-Yearly" : c.charAt(0) + c.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-3">
                                    Changes apply from the next billing period.
                                </p>
                            </div>

                            {/* Plan features */}
                            {planObj?.features && (
                                <div className="bg-white border border-gray-100 rounded-2xl p-4">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Plan Features</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: "chat", label: "Direct Chat" },
                                            { key: "analytics", label: "Analytics" },
                                            { key: "notifications", label: "Notifications" },
                                            { key: "kanban", label: "Kanban Boards" },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="flex items-center gap-2 text-sm">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${planObj.features[key] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-300"}`}>
                                                    <CheckIcon />
                                                </div>
                                                <span className={planObj.features[key] ? "text-gray-700" : "text-gray-300 line-through"}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plans Comparison Section */}
                    <div id="plans-comparison" className="pt-6 border-t border-gray-100">
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-gray-900 tracking-tight">Available Plans & Tiers</h3>
                            <p className="text-xs text-gray-500">Compare plans and switch at any time.</p>
                        </div>

                        {!plansData || plansData.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No plans available.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {[...plansData].sort((a: any, b: any) => a.price - b.price).map((p: any, idx: number) => {
                                    const isCurrent = planObj?._id === p._id;
                                    const isMiddle = idx === 1;
                                    return (
                                        <div
                                            key={p._id}
                                            className={`rounded-2xl flex flex-col relative transition-all duration-300 ${isCurrent
                                                ? "border-2 border-blue-600 shadow-lg scale-[1.01] z-20"
                                                : "border border-gray-100 hover:border-gray-300 hover:shadow-sm"
                                                } bg-white`}
                                        >
                                            {isCurrent && (
                                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md shadow-blue-200">
                                                    Current Plan
                                                </div>
                                            )}
                                            {!isCurrent && isMiddle && (
                                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md shadow-gray-200">
                                                    Popular Choice
                                                </div>
                                            )}
                                            <div className="p-5 flex-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{p.name}</p>
                                                <div className="flex items-baseline gap-1 mb-4">
                                                    <span className="text-3xl font-black text-gray-900 tracking-tight">${p.price ?? 0}</span>
                                                    <span className="text-xs text-gray-400 font-bold">/mo</span>
                                                </div>
                                                <div className="space-y-2.5 text-[12px] text-gray-600 font-medium">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-4.5 h-4.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><CheckIcon /></div>
                                                        <span className="text-gray-900 font-bold">{(p.limits?.maxProjects ?? 0) > 0 ? p.limits.maxProjects : "Unlimited"}</span> Projects
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-4.5 h-4.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><CheckIcon /></div>
                                                        <span className="text-gray-900 font-bold">{(p.limits?.maxUsers ?? 0) > 0 ? p.limits.maxUsers : "Unlimited"}</span> Members
                                                    </div>
                                                    {[
                                                        { key: "chat", label: "Direct Chat" },
                                                        { key: "kanban", label: "Kanban Boards" },
                                                        { key: "analytics", label: "Analytics" },
                                                        { key: "notifications", label: "Notifications" },
                                                    ].map(({ key, label }) => (
                                                        <div key={key} className={`flex items-center gap-2.5 ${!p.features?.[key] ? "opacity-30" : ""}`}>
                                                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 border ${p.features?.[key] ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-300 border-gray-100"}`}>
                                                                <CheckIcon />
                                                            </div>
                                                            {label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="px-5 pb-5">
                                                <button
                                                    onClick={() => !isCurrent && handleSwitchPlan(p._id)}
                                                    disabled={isCurrent}
                                                    className={`w-full py-2.5 rounded-xl text-[11px] font-black tracking-wide uppercase transition-all ${isCurrent
                                                        ? "bg-gray-50 text-gray-400 cursor-default border border-gray-100"
                                                        : isMiddle
                                                            ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-gray-200"
                                                            : "border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                                                        }`}
                                                >
                                                    {isCurrent ? "Active" : `Upgrade`}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* ══════════════════════  BILLING HISTORY TAB  ════════════════════ */}
            {activeTab === "Billing History" && (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900">Full Billing History</h3>
                        <span className="text-[10px] text-gray-400">{history.length} records</span>
                    </div>
                    {history.length === 0 ? (
                        <div className="px-4 py-10 text-center text-xs text-gray-400">No billing history available yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Start</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">End</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Changed</th>
                                        <th className="px-4 py-2.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...history].reverse().map((h: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-2.5 text-gray-400 text-[10px]">{history.length - i}</td>
                                            <td className="px-4 py-2.5 font-medium text-gray-900">{h.planId?.name ?? planName}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${actionColor[h.action] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {actionLabel[h.action] ?? h.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500">{fmt(h.startDate)}</td>
                                            <td className="px-4 py-2.5 text-gray-500">{fmt(h.endDate)}</td>
                                            <td className="px-4 py-2.5 text-gray-500">{fmt(h.changedAt)}</td>
                                            <td className="px-4 py-2.5 font-bold text-gray-900 text-right">${h.planId?.price ?? planPrice}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SubscriptionPage;
