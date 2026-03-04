import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBoard, useProjectMembers } from "../../hooks/useProjects";
import { TaskRow } from "../../components/projects/TaskRow";
import { Skeleton } from "../../components/projects/ProjectUI";
import { motion } from "framer-motion";

const ProjectTasks = () => {
    const { slug, projectId } = useParams();
    const qc = useQueryClient();

    const { data: membersData } = useProjectMembers(projectId!);
    const { data: boardData, isLoading: boardLoading } = useBoard(projectId!);

    const members: any[] = membersData?.projectMembers ?? membersData?.members ?? membersData ?? [];
    const board: any[] = boardData?.board ?? boardData ?? [];

    const sections = board.map((item: any) => item.section);

    if (boardLoading) {
        return (
            <div className="p-6 space-y-4 max-w-5xl mx-auto">
                {Array(3).fill(0).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-2">
                            {Array(2).fill(0).map((_, j) => (
                                <Skeleton key={j} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 h-full overflow-y-auto"
        >
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-4">
                    <h2 className="text-[15px] font-medium text-gray-900 tracking-tight">List View</h2>
                    <div className="flex gap-2">
                        <select className="h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-[11px] outline-none hover:bg-white text-gray-600 appearance-none font-medium cursor-pointer">
                            <option>All Tasks</option>
                            <option>Assigned to Me</option>
                        </select>
                        <select className="h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-[11px] outline-none hover:bg-white text-gray-600 appearance-none font-medium cursor-pointer">
                            <option>Priority: All</option>
                            <option>High / Urgent</option>
                        </select>
                    </div>
                </div>

                {board.map((item: any) => (
                    <div key={item.section._id} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[12px] font-medium text-gray-900 uppercase tracking-widest">{item.section.name}</h3>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{item.tasks?.length ?? 0}</span>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        {item.tasks?.length === 0 ? (
                            <p className="text-[12px] text-gray-400 italic pl-4">No tasks in this column.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 pl-4">
                                {item.tasks?.map((task: any) => (
                                    <TaskRow
                                        key={task._id}
                                        task={task}
                                        projectId={projectId!}
                                        slug={slug!}
                                        qc={qc}
                                        projectMembers={members}
                                        sections={sections}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {board.length === 0 && (
                    <div className="py-20 text-center text-gray-400">
                        <p className="text-[12px] uppercase tracking-widest">No columns exist yet.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectTasks;
