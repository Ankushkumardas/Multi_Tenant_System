import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useProjectMembers, useBoard } from "../../hooks/useProjects";
import { Skeleton, Modal, Label } from "../../components/projects/ProjectUI";
import { TaskRow } from "../../components/projects/TaskRow";
import { useState } from "react";
import { api } from "../../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// TODO: Implement actual drag-and-drop using @dnd-kit
import { DndContext } from "@dnd-kit/core";

const ProjectBoard = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();
    const { user } = useAuthStore();

    const { data: membersData } = useProjectMembers(projectId!);
    const { data: boardData, isLoading: boardLoading } = useBoard(projectId!);

    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const board: any[] = boardData?.board ?? boardData ?? [];

    const isOwnerOrAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(user?.role || "");
    const canCreateTask = ["OWNER", "ADMIN", "MANAGER", "USER"].includes(user?.role || "");

    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
    const [taskSectionId, setTaskSectionId] = useState("");

    const [newSectionName, setNewSectionName] = useState("");
    const [showAddSection, setShowAddSection] = useState(false);

    const createSectionMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/sections`, { name: newSectionName }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setNewSectionName("");
            setShowAddSection(false);
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/projects/${projectId}/tasks`, {
            title: newTaskTitle,
            sectionId: taskSectionId,
            description: newTaskDescription,
            priority: newTaskPriority,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board", slug, projectId] });
            setNewTaskTitle("");
            setNewTaskDescription("");
            setShowAddTask(false);
        },
    });

    const handleDragEnd = (event: any) => {
        console.log("Drag end", event);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 h-full flex flex-col"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[15px] font-medium text-gray-900 tracking-tight">Kanban Board</h2>
                {isOwnerOrAdmin && (
                    <button
                        onClick={() => setShowAddSection(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[11px] hover:bg-gray-700 transition-all uppercase tracking-wider"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Column
                    </button>
                )}
            </div>

            {boardLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <DndContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide flex-1">
                        {board.map((item: any, idx: number) => (
                            <div key={item.section._id} className="w-64 shrink-0 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-red-400" : idx === 1 ? "bg-amber-400" : idx === 2 ? "bg-green-400" : "bg-violet-400"}`} />
                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest flex-1">{item.section.name}</span>
                                    <span className="text-[10px] text-gray-300">{item.tasks?.length ?? 0}</span>
                                </div>
                                <div className="space-y-2.5 flex-1 overflow-y-auto min-h-[150px] p-1 -m-1">
                                    {item.tasks?.map((task: any) => (
                                        <TaskRow
                                            key={task._id}
                                            task={task}
                                            projectId={projectId!}
                                            slug={slug!}
                                            qc={qc}
                                            projectMembers={members}
                                            sections={board.map((i: any) => i.section)}
                                        />
                                    ))}
                                    {canCreateTask && (
                                        <button
                                            onClick={() => { setTaskSectionId(item.section._id); setShowAddTask(true); }}
                                            className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-[11px] text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                                        >
                                            + Add Task
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DndContext>
            )}

            {/* ── Modal: Add Column ── */}
            <AnimatePresence>
                {showAddSection && (
                    <Modal title="New Column" onClose={() => setShowAddSection(false)}>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:border-gray-300 transition-all">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5 block">Column Name</Label>
                                <input
                                    autoFocus
                                    placeholder="e.g. Backlog, Testing…"
                                    value={newSectionName}
                                    onChange={e => setNewSectionName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && newSectionName.trim() && createSectionMutation.mutate()}
                                    className="w-full text-[14px] bg-transparent outline-none placeholder-gray-300 text-gray-900"
                                />
                            </div>
                            <button
                                onClick={() => createSectionMutation.mutate()}
                                disabled={!newSectionName.trim() || createSectionMutation.isPending}
                                className="w-full py-2.5 bg-gray-900 text-white text-[11px] rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-all uppercase tracking-wider"
                            >
                                {createSectionMutation.isPending ? "Creating…" : "Create Column"}
                            </button>
                        </motion.div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* ── Modal: Add Task ── */}
            <AnimatePresence>
                {showAddTask && (
                    <Modal title="New Task" onClose={() => setShowAddTask(false)}>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:border-gray-300 transition-all">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5 block">Title</Label>
                                <input
                                    autoFocus
                                    placeholder="What needs to be done?"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="w-full text-[14px] bg-transparent outline-none placeholder-gray-300 text-gray-900"
                                />
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 focus-within:border-gray-300 transition-all">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5 block">Description</Label>
                                <textarea
                                    placeholder="Optional details…"
                                    value={newTaskDescription}
                                    onChange={e => setNewTaskDescription(e.target.value)}
                                    className="w-full text-[13px] bg-transparent outline-none placeholder-gray-300 text-gray-600 min-h-[80px] resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5 block">Priority</Label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value)}
                                        className="w-full bg-transparent outline-none text-[13px] text-gray-900 appearance-none cursor-pointer"
                                    >
                                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 opacity-70">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5 block">Column</Label>
                                    <div className="text-[13px] text-gray-900 uppercase">
                                        {(board.find((i: any) => i.section._id === taskSectionId) as any)?.section.name}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => createTaskMutation.mutate()}
                                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                                className="w-full py-2.5 bg-gray-900 text-white text-[11px] rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-all uppercase tracking-wider"
                            >
                                {createTaskMutation.isPending ? "Creating…" : "Create Task"}
                            </button>
                        </motion.div>
                    </Modal>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProjectBoard;
