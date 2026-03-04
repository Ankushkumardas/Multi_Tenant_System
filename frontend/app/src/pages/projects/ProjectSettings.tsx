import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useProjectById, useProjectMembers, useBoard } from "../../hooks/useProjects";
import { api } from "../../lib/axios";
import { motion } from "framer-motion";

const ProjectSettings = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const { data: projectData } = useProjectById(projectId!);
    const { data: membersData } = useProjectMembers(projectId!);
    const { data: boardData } = useBoard(projectId!);

    const project = projectData?.project ?? projectData;
    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const board: any[] = boardData?.board ?? boardData ?? [];

    const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "MANAGER";

    const archiveMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/toggle-archive`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["project", slug, projectId] }),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/${slug}/projects/${projectId}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", slug] }); navigate(`/${slug}/projects`); },
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 overflow-y-auto"
        >
            <div className="max-w-2xl mx-auto space-y-10">
                <div>
                    <div className="mb-6">
                        <h2 className="text-[14px] font-medium text-gray-900 uppercase tracking-widest">Settings</h2>
                        <p className="text-[11px] text-gray-400 mt-1">Project configuration and metrics</p>
                    </div>

                    {/* Project meta rows */}
                    <div className="bg-white border border-gray-100 rounded-[28px] p-6 divide-y divide-gray-50 mb-8">
                        {[
                            { label: "Name", value: project?.name },
                            {
                                label: "Status", value: (
                                    <span className={`text-[11px] px-2 py-0.5 rounded ${project?.status === "ARCHIVED" ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700 font-medium"}`}>
                                        {project?.status ?? "ACTIVE"}
                                    </span>
                                )
                            },
                            { label: "Members", value: members.length },
                            { label: "Columns", value: board.length },
                            { label: "Created At", value: project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : "N/A" }
                        ].map(row => (
                            <div key={row.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                <span className="text-[11px] text-gray-400 uppercase tracking-widest">{row.label}</span>
                                <span className="text-[13px] text-gray-900 font-medium">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                {isOwnerOrAdmin && (
                    <div>
                        <p className="text-[10px] fon-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Danger Zone</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-5 rounded-2xl border border-orange-100 bg-orange-50/40">
                                <div>
                                    <p className="text-[13px] font-medium text-orange-900">
                                        {project?.status === "ARCHIVED" ? "Restore Project" : "Archive Project"}
                                    </p>
                                    <p className="text-[11px] text-orange-600/60 mt-0.5 leading-tight">This will hide project across the workspace.</p>
                                </div>
                                <button
                                    onClick={() => archiveMutation.mutate()}
                                    className="px-4 py-2 bg-white text-orange-600 border border-orange-200 text-[11px] font-medium rounded-xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-wider whitespace-nowrap"
                                >
                                    {archiveMutation.isPending ? "…" : project?.status === "ARCHIVED" ? "Restore" : "Archive"}
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-2xl border border-red-100 bg-red-50/40">
                                <div>
                                    <p className="text-[13px] font-medium text-red-900">Delete Project</p>
                                    <p className="text-[11px] text-red-600/60 mt-0.5 leading-tight">Permanent action. Cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => { if (window.confirm("Delete this project permanently?")) deleteMutation.mutate(); }}
                                    className="px-4 py-2 bg-red-600 text-white font-medium text-[11px] rounded-xl hover:bg-red-700 transition-all uppercase tracking-wider shadow-sm"
                                >
                                    {deleteMutation.isPending ? "…" : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectSettings;
