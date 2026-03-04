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
    const tabs = ["Overview", "Plans & Tiers", "Billing History"];

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
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Subscription & Billing</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage your plan, billing cycle, and payment details.</p>
                </div>
                <button
                    onClick={() => setActiveTab("Plans & Tiers")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    Upgrade Plan
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-6 border-b border-gray-100 mb-6">
                {tabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === t
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
                <div className="space-y-5">
                    {/* Top row: plan card + usage */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Current plan card */}
                        <div className="lg:col-span-2 bg-gray-950 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className={`absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusColor[planStatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {planStatus}
                            </div>

                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Current Plan</p>
                            <h2 className="text-2xl font-extrabold mb-1">{planName}</h2>
                            <p className="text-2xl font-light text-gray-300 mb-6">
                                ${planPrice}<span className="text-sm text-gray-500">/mo</span>
                            </p>

                            <div className="space-y-3 text-sm mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Billing cycle</span>
                                    <span className="font-medium capitalize">{billingCycle.replace("_", " ").toLowerCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Start date</span>
                                    <span className="font-medium">{fmt(subscription?.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Next payment</span>
                                    <span className="font-medium">{fmt(subscription?.endDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Payment via</span>
                                    <span className="font-medium">{paymentProvider}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Auto-renew</span>
                                    <button
                                        onClick={() => toggleAutoRenewMutation.mutate()}
                                        disabled={toggleAutoRenewMutation.isPending}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${autoRenew ? "bg-blue-500" : "bg-gray-600"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRenew ? "translate-x-5" : "translate-x-0.5"}`} />
                                    </button>
                                </div>
                            </div>

                            {planStatus === "EXPIRED" && (
                                <button
                                    onClick={() => renewMutation.mutate()}
                                    disabled={renewMutation.isPending}
                                    className="w-full py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-60"
                                >
                                    {renewMutation.isPending ? "Renewing…" : "Renew Subscription"}
                                </button>
                            )}
                        </div>

                        {/* Usage + billing cycle */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Usage meters */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Projects */}
                                <div className="bg-white border border-gray-100 rounded-2xl p-5">
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
                                <div className="bg-white border border-gray-100 rounded-2xl p-5">
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
                                <div className="bg-white border border-gray-100 rounded-2xl p-5">
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

                    {/* Billing History Preview */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
                            <h3 className="text-sm font-bold text-gray-900">Recent Billing History</h3>
                            <button onClick={() => setActiveTab("Billing History")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                                View All
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-400">No billing history yet.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.slice(-5).reverse().map((h: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-gray-900">{h.planId?.name ?? planName}</td>
                                            <td className="px-5 py-3.5 text-gray-500">
                                                {fmt(h.startDate)} → {fmt(h.endDate)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${actionColor[h.action] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {actionLabel[h.action] ?? h.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900 text-right">
                                                ${h.planId?.price ?? planPrice}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════  PLANS & TIERS TAB  ══════════════════════ */}
            {activeTab === "Plans & Tiers" && (
                <div>
                    <p className="text-sm text-gray-500 mb-6">Compare plans and switch at any time. Changes apply from the next billing period.</p>
                    {!plansData || plansData.length === 0 ? (
                        <p className="text-sm text-gray-400">No plans available.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[...plansData].sort((a: any, b: any) => a.price - b.price).map((p: any, idx: number) => {
                                const isCurrent = planObj?._id === p._id;
                                const isMiddle = idx === 1;
                                return (
                                    <div
                                        key={p._id}
                                        className={`rounded-2xl flex flex-col relative ${isCurrent
                                                ? "border-2 border-blue-600 shadow-lg"
                                                : isMiddle
                                                    ? "border-2 border-gray-900 shadow-lg"
                                                    : "border border-gray-100"
                                            } bg-white`}
                                    >
                                        {isCurrent && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                                                Current Plan
                                            </div>
                                        )}
                                        {!isCurrent && isMiddle && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                                                Popular
                                            </div>
                                        )}
                                        <div className="p-6 flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{p.name}</p>
                                            <div className="flex items-baseline gap-1 mb-5">
                                                <span className="text-3xl font-extrabold text-gray-900">${p.price ?? 0}</span>
                                                <span className="text-sm text-gray-400 font-medium">/mo</span>
                                            </div>
                                            <div className="space-y-2.5 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100"><CheckIcon /></div>
                                                    {(p.limits?.maxProjects ?? 0) > 0 ? p.limits.maxProjects : "Unlimited"} Projects
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100"><CheckIcon /></div>
                                                    {(p.limits?.maxUsers ?? 0) > 0 ? p.limits.maxUsers : "Unlimited"} Members
                                                </div>
                                                {[
                                                    { key: "chat", label: "Direct Chat" },
                                                    { key: "kanban", label: "Kanban Boards" },
                                                    { key: "analytics", label: "Analytics" },
                                                    { key: "notifications", label: "Notifications" },
                                                ].map(({ key, label }) => (
                                                    <div key={key} className={`flex items-center gap-2 ${!p.features?.[key] ? "opacity-40" : ""}`}>
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${p.features?.[key] ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-300 border-gray-100"}`}>
                                                            <CheckIcon />
                                                        </div>
                                                        {label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-6 pb-6">
                                            <button
                                                onClick={() => !isCurrent && handleSwitchPlan(p._id)}
                                                disabled={isCurrent}
                                                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${isCurrent
                                                        ? "bg-blue-50 text-blue-600 cursor-default"
                                                        : isMiddle
                                                            ? "bg-gray-900 text-white hover:bg-black"
                                                            : "border border-gray-200 text-gray-900 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {isCurrent ? "Your Current Plan" : `Switch to ${p.name}`}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════  BILLING HISTORY TAB  ════════════════════ */}
            {activeTab === "Billing History" && (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-900">Full Billing History</h3>
                        <span className="text-[11px] text-gray-400">{history.length} records</span>
                    </div>
                    {history.length === 0 ? (
                        <div className="px-5 py-12 text-center text-sm text-gray-400">No billing history available yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">End</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Changed</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[...history].reverse().map((h: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 text-gray-400 text-[11px]">{history.length - i}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900">{h.planId?.name ?? planName}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${actionColor[h.action] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {actionLabel[h.action] ?? h.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">{fmt(h.startDate)}</td>
                                            <td className="px-5 py-3 text-gray-500">{fmt(h.endDate)}</td>
                                            <td className="px-5 py-3 text-gray-500">{fmt(h.changedAt)}</td>
                                            <td className="px-5 py-3 font-bold text-gray-900 text-right">${h.planId?.price ?? planPrice}</td>
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
