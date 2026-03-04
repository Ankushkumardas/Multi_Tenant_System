import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskDetailPanel from "./TaskDetailPanel";

interface TaskRowProps {
    task: any;
    projectId: string;
    slug: string;
    qc: any;
    projectMembers: any[];
    sections: any[];
}

export const TaskRow = ({ task, projectId, slug, qc, projectMembers, sections }: TaskRowProps) => {
    const [showDetail, setShowDetail] = useState(false);

    // ── dnd-kit sortable ──────────────────────────────────────────────────────
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const deleteTaskMutation = useMutation({
        mutationFn: async () => {
            const res = await api.delete(`/${slug}/projects/${projectId}/tasks/${task._id}`);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => setShowDetail(true)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 relative group cursor-pointer active:cursor-grabbing"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider 
                            ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' :
                                task.priority === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {task.priority || "MEDIUM"}
                        </span>
                    </div>

                    <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignedTo?.slice(0, 3).map((u: any) => (
                            <div key={u._id} title={u.name} className="w-5.5 h-5.5 rounded-full bg-gray-900 border-2 border-white text-[8px] font-bold text-white flex items-center justify-center uppercase shrink-0 shadow-sm">
                                {u.name?.[0]}
                            </div>
                        ))}
                        {task.assignedTo?.length > 3 && (
                            <div className="w-5.5 h-5.5 rounded-full bg-gray-100 border-2 border-white text-[8px] font-bold text-gray-500 flex items-center justify-center shrink-0">
                                +{task.assignedTo.length - 3}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-2">
                    <h4 className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-black transition-colors">{task.title}</h4>
                    {task.description && <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete task?")) deleteTaskMutation.mutate(); }}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {showDetail && (
                <TaskDetailPanel
                    task={task}
                    projectId={projectId}
                    slug={slug}
                    projectMembers={projectMembers}
                    sections={sections}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </>
    );
};

