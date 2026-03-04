import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
    useSubscriptionHistory,
    usePlans,
    useDashboardStats,
    useWorkspaceMembers,
} from "../../hooks/useDashboard";
import { api } from "../../lib/axios";

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const SubscriptionPage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: subData, isLoading: subLoading, error: subError } = useSubscriptionHistory();
    const { data: plansData, isLoading: plansLoading, error: plansError } = usePlans();
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 5;

    const toggleAutoRenewMutation = useMutation({
        mutationFn: async () => {
            if (!slug) throw new Error("Workspace slug missing");
            await api.post(`/${slug}/subscription/toggle-auto-renew`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] });
        },
    });

    const renewSubscriptionMutation = useMutation({
        mutationFn: async () => {
            if (!slug) throw new Error("Workspace slug missing");
            await api.post(`/${slug}/subscription/renew`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] });
        },
    });

    const updateBillingCycleMutation = useMutation({
        mutationFn: async (cycle: "MONTHLY" | "YEARLY" | "QUARTERLY" | "HALF_YEARLY") => {
            if (!slug) throw new Error("Workspace slug missing");
            await api.post(`/${slug}/subscription/billing-cycle`, { billingCycle: cycle });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscription-history", slug] });
        },
    });

    const handlePlanChange = (planId: string | null) => {
        if (!planId || !plansData || !slug) return;
        const plan = plansData.find((p: any) => p._id === planId);
        if (!plan) return;

        navigate(`/${slug}/settings/subscription/checkout`, {
            state: {
                mode: "change",
                slug,
                planId: plan._id,
                planName: plan.name,
                priceLabel: `$${plan.price}`,
                tagline: "Adjust your workspace limits instantly.",
            },
        });
    };

    // Ensure hooks are called unconditionally by providing default values
    const subscription = subData?.subscription ?? subData ?? {};
    const history = subscription?.history ?? [];
    const planObj = subscription?.planId ?? subscription?.plan ?? {};
    console.log(subscription)
    const plan = planObj?.name || "Free Tier"; // Default to "Enterprise" if plan name is missing
    const status = subscription?.status ?? "ACTIVE";
    const billingCycle =
        (subscription?.billingCycle as "MONTHLY" | "YEARLY" | "QUARTERLY" | "HALF_YEARLY") ?? "MONTHLY";
    const projectLimit = planObj?.limits?.maxProjects ?? 0;
    const memberLimit = planObj?.limits?.maxUsers ?? 0;
    const totalProjects: number = statsData?.stats?.totalProjects ?? 0;
    const memberCount: number = membersData?.users?.length ?? 0;

    const projectUsagePct =
        projectLimit > 0 ? Math.min(100, Math.round((totalProjects / projectLimit) * 100)) : null;
    const memberUsagePct =
        memberLimit > 0 ? Math.min(100, Math.round((memberCount / memberLimit) * 100)) : null;

    const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
    const currentPage = Math.min(historyPage, totalPages);
    const pagedHistory = useMemo(
        () => history.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [history, currentPage],
    );

    // Format subscription data for display
    // const formattedSubscription = {
    //     planName: planObj?.name || "N/A",
    //     price: planObj?.price || "N/A",
    //     billingCycle: subscription?.billingCycle || "N/A",
    //     startDate: subscription?.startDate ? formatDate(subscription.startDate) : "N/A",
    //     endDate: subscription?.endDate ? formatDate(subscription.endDate) : "N/A",
    //     autoRenew: subscription?.autoRenew ? "Enabled" : "Disabled",
    //     status: subscription?.status || "N/A",
    //     features: planObj?.features || {},
    //     limits: planObj?.limits || {},
    //     history: subscription?.history || [],
    // };

    if (subLoading || plansLoading || statsLoading || membersLoading) {
        return (<div>Loading...</div>);
    }

    if (subError || plansError) {
        return (
            <div className="w-full p-8">
                <p className="text-sm text-red-500">
                    {(subError as any)?.message || (plansError as any)?.message || "Failed to load subscription data."}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-6 py-4 sticky top-0 z-10">
                <h1 className="text-[18px] font-semibold text-gray-900 tracking-tight">Billing & plans</h1>
                <p className="text-[12px] text-gray-400 mt-1">Manage your workspace subscription, invoices and renewal.</p>
            </div>

            <div className="space-y-6">
                {/* Top row: current plan + available plans */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1.4fr] gap-6">
                    {/* Current Plan & usage */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.16em]">Current plan</p>
                                <h2 className="text-[22px] font-semibold text-gray-900 mt-1 tracking-tight">{plan}</h2>
                                <p className="text-[12px] text-gray-500 mt-1">
                                    Next billing date{" "}
                                    <span className="font-medium text-gray-900">
                                        {subscription?.endDate ? formatDate(subscription.endDate) : "—"}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="h-10 px-5 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-black transition-all uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={!selectedPlan}
                                    onClick={() => handlePlanChange(selectedPlan)}
                                >
                                    Upgrade tier
                                </button>
                                <button className="h-10 px-5 border border-gray-100 bg-white text-gray-900 text-[12px] font-medium rounded-xl hover:bg-gray-50 transition-all uppercase tracking-wider">
                                    Manage methods
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[0.16em] mb-1">Status</p>
                                <p className={`text-[14px] font-medium uppercase tracking-tight ${status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>{status}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[0.16em] mb-1">Billing cycle</p>
                                <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => updateBillingCycleMutation.mutate("MONTHLY")}
                                        disabled={billingCycle === "MONTHLY" || updateBillingCycleMutation.isPending}
                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition ${
                                            billingCycle === "MONTHLY" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateBillingCycleMutation.mutate("QUARTERLY")}
                                        disabled={billingCycle === "QUARTERLY" || updateBillingCycleMutation.isPending}
                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition ${
                                            billingCycle === "QUARTERLY" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                        }`}
                                    >
                                        Quarterly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateBillingCycleMutation.mutate("HALF_YEARLY")}
                                        disabled={billingCycle === "HALF_YEARLY" || updateBillingCycleMutation.isPending}
                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition ${
                                            billingCycle === "HALF_YEARLY" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                        }`}
                                    >
                                        6 months
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateBillingCycleMutation.mutate("YEARLY")}
                                        disabled={billingCycle === "YEARLY" || updateBillingCycleMutation.isPending}
                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition ${
                                            billingCycle === "YEARLY" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                                        }`}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-[0.16em] mb-1">Auto-renew</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-[14px] font-medium text-gray-900 uppercase tracking-tight">
                                        {subscription?.autoRenew ? "Enabled" : "Disabled"}
                                    </p>
                                    <button
                                        onClick={() => toggleAutoRenewMutation.mutate()}
                                        className="h-8 px-4 text-[11px] font-medium rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={toggleAutoRenewMutation.isPending}
                                    >
                                        {toggleAutoRenewMutation.isPending ? "Saving..." : "Toggle"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Usage cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                            {projectLimit > 0 && (
                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.16em] mb-1">
                                        Projects
                                    </p>
                                    <p className="text-[20px] font-semibold text-gray-900">
                                        {totalProjects}{" "}
                                        <span className="text-[13px] text-gray-400">
                                            / {projectLimit}
                                        </span>
                                    </p>
                                    {projectUsagePct !== null && (
                                        <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                            <div
                                                className="h-full bg-gray-900 rounded-full"
                                                style={{ width: `${projectUsagePct}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            {memberLimit > 0 && (
                                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60">
                                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.16em] mb-1">
                                        Members
                                    </p>
                                    <p className="text-[20px] font-semibold text-gray-900">
                                        {memberCount}{" "}
                                        <span className="text-[13px] text-gray-400">
                                            / {memberLimit}
                                        </span>
                                    </p>
                                    {memberUsagePct !== null && (
                                        <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                            <div
                                                className="h-full bg-gray-900 rounded-full"
                                                style={{ width: `${memberUsagePct}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {status === "EXPIRED" && (
                            <div className="mt-6">
                                <button
                                    onClick={() => renewSubscriptionMutation.mutate()}
                                    className="h-9 px-4 bg-blue-600 text-white text-[12px] font-medium rounded-xl hover:bg-blue-700 transition-all uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={renewSubscriptionMutation.isPending}
                                >
                                    {renewSubscriptionMutation.isPending ? "Renewing..." : "Renew subscription"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Available Plans */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Available plans</h2>
                        <p className="text-[12px] text-gray-400 mb-4">
                            Switch plans at any time. Changes apply from the next billing period.
                        </p>
                        <ul>
                            {plansData?.map((plan: any) => (
                                <li
                                    key={plan._id}
                                    className="flex justify-between items-center py-3 border-t border-gray-50 first:border-t-0"
                                >
                                    <div>
                                        <span className="text-[14px] font-medium text-gray-900">
                                            {plan.name}
                                        </span>
                                        <p className="text-[12px] text-gray-400">
                                            {`$${plan.price} / month`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPlan(plan._id)}
                                        className={`h-8 px-4 text-[12px] font-medium rounded-full transition-all uppercase tracking-wider ${
                                            selectedPlan === plan._id
                                                ? "bg-gray-900 text-white shadow-md"
                                                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                        }`}
                                    >
                                        {selectedPlan === plan._id ? "Selected" : "Select"}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4">
                            <button
                                onClick={() => handlePlanChange(selectedPlan)}
                                className="w-full h-10 bg-gray-900 text-white text-[12px] font-medium rounded-xl hover:bg-black transition-all uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={!selectedPlan}
                            >
                                Change plan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Billing history bottom */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-[13px] font-semibold text-gray-900">Billing history</h3>
                        <button className="text-[11px] font-medium text-gray-400 hover:text-gray-900 transition-colors">Download all</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/60">
                                <tr>
                                    <th className="px-5 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-[0.16em] border-b border-gray-100">Invoice date</th>
                                    <th className="px-5 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-[0.16em] border-b border-gray-100">Tier</th>
                                    <th className="px-5 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-[0.16em] border-b border-gray-100">Amount</th>
                                    <th className="px-5 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-[0.16em] border-b border-gray-100 text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-10 text-center text-[12px] text-gray-400 italic">
                                            No invoices yet
                                        </td>
                                    </tr>
                                ) : (
                                    pagedHistory.map((h: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 text-[13px] text-gray-600">
                                                {formatDate(h.startDate || h.createdAt)}
                                            </td>
                                            <td className="px-5 py-4 text-[13px] text-gray-900 font-medium">{h.planId?.name ?? "Base"}</td>
                                            <td className="px-5 py-4 text-[13px] text-gray-600">${h.planId?.price ?? 0}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button className="text-[11px] font-medium text-blue-600 hover:underline uppercase tracking-wide">View PDF</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {history.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 text-[12px] text-gray-500">
                            <span>
                                Showing{" "}
                                <span className="font-medium">
                                    {(currentPage - 1) * pageSize + 1}-
                                    {Math.min(currentPage * pageSize, history.length)}
                                </span>{" "}
                                of <span className="font-medium">{history.length}</span>
                            </span>
                            <div className="inline-flex gap-1">
                                <button
                                    type="button"
                                    className="h-7 px-3 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={currentPage === 1}
                                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    className="h-7 px-3 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plan comparison */}
                {plansData && plansData.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-[16px] font-semibold text-gray-900">Plan comparison</h2>
                                <p className="text-[12px] text-gray-400">
                                    See what each plan includes and choose the one that fits your team.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plansData
                                .slice()
                                .sort((a: any, b: any) => a.price - b.price)
                                .map((p: any) => {
                                    const isCurrent = planObj?._id && planObj._id === p._id;
                                    return (
                                        <div
                                            key={p._id}
                                            className={`rounded-2xl border p-5 flex flex-col gap-3 ${
                                                isCurrent
                                                    ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                                                    : "border-gray-100 bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-[0.16em] font-semibold opacity-70">
                                                        {p.name}
                                                    </p>
                                                    <div className="flex items-baseline gap-1 mt-1">
                                                        <span className="text-2xl font-bold">
                                                            ${p.price ?? 0}
                                                        </span>
                                                        <span className="text-[11px] opacity-70">/month</span>
                                                    </div>
                                                </div>
                                                {isCurrent && (
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                            <div className={`text-[12px] ${isCurrent ? "text-gray-200" : "text-gray-500"}`}>
                                                <p>
                                                    Up to{" "}
                                                    <span className="font-medium">
                                                        {p.limits?.maxProjects ?? "—"}
                                                    </span>{" "}
                                                    projects ·{" "}
                                                    <span className="font-medium">
                                                        {p.limits?.maxUsers ?? "—"}
                                                    </span>{" "}
                                                    members
                                                </p>
                                            </div>

                                            <ul className="mt-1 space-y-1.5 text-[12px]">
                                                <li className="flex items-center gap-2">
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            p.features?.chat ? "bg-emerald-400" : "bg-gray-400/40"
                                                        }`}
                                                    />
                                                    <span className={p.features?.chat ? "" : "opacity-60"}>
                                                        Direct chat
                                                    </span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            p.features?.kanban ? "bg-emerald-400" : "bg-gray-400/40"
                                                        }`}
                                                    />
                                                    <span className={p.features?.kanban ? "" : "opacity-60"}>
                                                        Kanban boards
                                                    </span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            p.features?.notifications ? "bg-emerald-400" : "bg-gray-400/40"
                                                        }`}
                                                    />
                                                    <span className={p.features?.notifications ? "" : "opacity-60"}>
                                                        In‑app notifications
                                                    </span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            p.features?.analytics ? "bg-emerald-400" : "bg-gray-400/40"
                                                        }`}
                                                    />
                                                    <span className={p.features?.analytics ? "" : "opacity-60"}>
                                                        Workspace analytics
                                                    </span>
                                                </li>
                                            </ul>

                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPlan(p._id);
                                                        handlePlanChange(p._id);
                                                    }}
                                                    className={`w-full h-9 text-[12px] font-semibold rounded-lg border ${
                                                        isCurrent
                                                            ? "bg-white text-gray-900 border-transparent hover:bg-gray-100"
                                                            : "bg-gray-900 text-white border-gray-900 hover:bg-black"
                                                    }`}
                                                >
                                                    {isCurrent ? "Manage current plan" : `Switch to ${p.name}`}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionPage;
