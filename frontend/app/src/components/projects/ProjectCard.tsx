import { motion } from "framer-motion";
import { useState } from "react";

interface ProjectCardProps {
    project: any;
    onClick: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (id: string) => void;
}

export const ProjectCard = ({ project, onClick, onEdit, onDelete }: ProjectCardProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(project.id); // Added optional chaining to handle undefined
        setShowDeleteConfirm(false);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    const formatDate = (date: string) => {
        if (!date) return "Just now";
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const completedTasks = project.completedTasks ?? 0;
    const totalTasks = project.totalTasks ?? 0;
    const progress = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group transition-all"
        >
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Created {formatDate(project.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(e); // Added optional chaining to handle undefined
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">Are you sure you want to delete this project?</p>
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={cancelDelete} className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={confirmDelete} className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg">Delete</button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                    {project.membersCount || 0} Members
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-blue-600"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
