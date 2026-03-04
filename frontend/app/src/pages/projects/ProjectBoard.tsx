import { useParams } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useProjectMembers, useBoard } from "../../hooks/useProjects";
import { Skeleton, Modal, Label } from "../../components/projects/ProjectUI";
import { TaskRow } from "../../components/projects/TaskRow";
import { useState } from "react";
import { api } from "../../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// ── dnd-kit imports ──────────────────────────────────────────────────────────
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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

    // ── Drag state ──
    const [activeTask, setActiveTask] = useState<any>(null);

    // ── Sensors ──
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

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

    const updateTaskSectionMutation = useMutation({
        mutationFn: async ({ taskId, sectionId }: { taskId: string; sectionId: string }) =>
            api.put(`/${slug}/projects/${projectId}/tasks/${taskId}`, { sectionId }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug, projectId] }),
    });

    // ── DnD Handlers ──
    const handleDragStart = (event: any) => {
        const { active } = event;
        // find task in board
        let foundTask = null;
        for (const col of board) {
            const task = col.tasks.find((t: any) => t._id === active.id);
            if (task) {
                foundTask = task;
                break;
            }
        }
        setActiveTask(foundTask);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // If dropped over a column or another task
        // We need to find which column the 'overId' belongs to
        let overSectionId = "";

        // 1. Is overId a section ID?
        const isOverSection = board.some(col => col.section._id === overId);
        if (isOverSection) {
            overSectionId = overId;
        } else {
            // 2. Is overId a task ID? Find the section it belongs to
            for (const col of board) {
                if (col.tasks.some((t: any) => t._id === overId)) {
                    overSectionId = col.section._id;
                    break;
                }
            }
        }

        if (!overSectionId) return;

        // Find the active task's current section
        let activeSectionId = "";
        for (const col of board) {
            if (col.tasks.some((t: any) => t._id === activeId)) {
                activeSectionId = col.section._id;
                break;
            }
        }

        // If moved to a different section, update backend
        if (activeSectionId !== overSectionId) {
            updateTaskSectionMutation.mutate({ taskId: activeId, sectionId: overSectionId });
        }
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide flex-1">
                        {board.map((item: any, idx: number) => (
                            <div key={item.section._id} className="w-64 shrink-0 flex flex-col">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-red-400" : idx === 1 ? "bg-amber-400" : idx === 2 ? "bg-green-400" : "bg-violet-400"}`} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1">{item.section.name}</span>
                                    <span className="bg-gray-100 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{item.tasks?.length ?? 0}</span>
                                </div>

                                <SortableContext
                                    id={item.section._id}
                                    items={item.tasks.map((t: any) => t._id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2.5 flex-1 overflow-y-auto min-h-[200px] p-1 -m-1 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
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
                                                className="w-full py-2.5 bg-white/40 border border-dashed border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-white transition-all mt-2"
                                            >
                                                + Add Task
                                            </button>
                                        )}
                                    </div>
                                </SortableContext>
                            </div>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: { opacity: "0.5" }
                            }
                        })
                    }}>
                        {activeTask ? (
                            <div className="w-64 scale-105 rotate-2">
                                <TaskRow
                                    task={activeTask}
                                    projectId={projectId!}
                                    slug={slug!}
                                    qc={qc}
                                    projectMembers={members}
                                    sections={board.map((i: any) => i.section)}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
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
