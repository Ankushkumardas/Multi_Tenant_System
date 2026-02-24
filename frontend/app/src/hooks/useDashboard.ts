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
        // refetchInterval: 30_000, // auto-refresh every 30s
    });
};



// ── Audit ─────────────────────────────────────────────────────────────────────
export const useAuditLogs = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["audit", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/audit`);
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


