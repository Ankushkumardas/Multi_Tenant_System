import { Badge, statusColor, formatDate } from "./ProjectUI";

interface ProjectCardProps {
    project: any;
    onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => (
    <div
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white text-[14px] font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                {project.name?.[0]?.toUpperCase()}
            </div>
            <Badge text={project.status ?? "ACTIVE"} color={statusColor[project.status] ?? "gray"} />
        </div>
        <h3 className="text-[14px] font-bold text-gray-900 mb-1 truncate">{project.name}</h3>
        {project.description && (
            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-3">{project.description}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-3 border-t border-gray-50">
            <span>Started {formatDate(project.startDate)}</span>
            {project.isArchived && <Badge text="Archived" color="yellow" />}
        </div>
    </div>
);
