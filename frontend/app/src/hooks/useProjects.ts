import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/axios";

// ── List all projects for the tenant ─────────────────────────────────────────
export const useProjects = () => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["projects", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects`);
            return res.data;
        },
    });
};

// ── Single project by ID ──────────────────────────────────────────────────────
export const useProjectById = (projectId: string | undefined) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["project", slug, projectId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}`);
            return res.data;
        },
        enabled: !!projectId,
    });
};

// ── Project members ───────────────────────────────────────────────────────────
export const useProjectMembers = (projectId: string | undefined) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["project-members", slug, projectId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}/members`);
            return res.data;
        },
        enabled: !!projectId,
    });
};

// ── Kanban board (sections + tasks) ──────────────────────────────────────────
export const useBoard = (projectId: string | undefined) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["board", slug, projectId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}/board`);
            return res.data;
        },
        enabled: !!projectId,
    });
};

// ── Project sections ──────────────────────────────────────────────────────────
export const useProjectSections = (projectId: string | undefined) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["sections", slug, projectId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}/sections`);
            return res.data;
        },
    });
};

// ── Task comments ─────────────────────────────────────────────────────────────
export const useTaskComments = (projectId: string, taskId: string) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["task-comments", slug, taskId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}/tasks/${taskId}/comments`);
            return res.data;
        },
        enabled: !!taskId && !!projectId,
    });
};

// ── Project Stats (tasks by status/priority, member roles, sections) ──────────
export const useProjectStats = (projectId: string | undefined) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["project-stats", slug, projectId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/projects/${projectId}/stats`);
            return res.data;
        },
        enabled: !!projectId && !!slug,
    });
};

// ── Task Activity ─────────────────────────────────────────────────────────────
export const useTaskActivity = (taskId: string) => {
    const { slug } = useParams();
    return useQuery({
        queryKey: ["task-activity", slug, taskId],
        queryFn: async () => {
            const res = await api.get(`/${slug}/activity/task/${taskId}`);
            return res.data;
        },
        enabled: !!taskId,
    });
};
