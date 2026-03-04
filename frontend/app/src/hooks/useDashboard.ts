import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/axios";

// ── Activity ──────────────────────────────────────────────────────────────────
export const useActivityFeed = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["activity", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity`);
            return res.data;
        },
    });
};

export const useActivityStats = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["activity-stats", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity/stats`);
            return res.data;
        },
    });
};

export const useTaskActivityChart = (days = 14) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["task-activity-chart", slug, days],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity/task-chart?days=${days}`);
            return res.data; // { daily: [...], totals: [...] }
        },
    });
};



// ── Audit ─────────────────────────────────────────────────────────────────────
export const useAuditLogs = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["audit", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/audit`);
            // console.log("Fetched audit logs:", res.data);
            return res.data;
        },
    });
};

export const useAuditStats = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["audit-stats", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/audit/stats`);
            console.log("Fetched audit stats:", res.data);
            return res.data;
        },
    });
};



// ── Subscription ──────────────────────────────────────────────────────────────
export const useSubscriptionHistory = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["subscription-history", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/subscription/history`);
            return res.data;
        },
        // staleTime: 5 * 60_000, // subscription data rarely changes
    });
};

export const useSubscriptionExpiry = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["subscription-expiry", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/subscription/expiry-reminder`);
            return res.data;
        },
        // refetchInterval: 10 * 60_000,
    });
};

// ── User profile ──────────────────────────────────────────────────────────────
export const useProfile = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["profile", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/user/profile`);
            return res.data;
        },
        // staleTime: 5 * 60_000,
    });
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const useDashboardStats = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["dashboard-stats", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity/dashboard-stats`);
            return res.data;
        },
    });
};

// ── Workspace Members ─────────────────────────────────────────────────────────
export const useWorkspaceMembers = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["workspace-members", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/admin/get-users`);
            return res.data;
        },
    });
};

// ── Assigned Tasks ────────────────────────────────────────────────────────────
export const useAssignedTasks = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["assigned-tasks", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity/assigned-tasks`);
            return res.data;
        },
    });
};

// ── Plans ──────────────────────────────────────────────────────────────────────
export const usePlans = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["plans", slug],
        queryFn: async () => {
            const { data } = await api.get(`/${slug}/subscription/plans`);
            return data;
        },
    });
};


