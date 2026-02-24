import React from "react";

export const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
);

export const TrafficLights = () => (
    <div className="flex gap-1.5 px-1">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm shadow-red-500/20" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm shadow-yellow-500/20" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm shadow-green-500/20" />
    </div>
);

export const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const Badge = ({ text, color = "gray" }: { text: string; color?: string }) => {
    const map: Record<string, string> = {
        gray: "bg-gray-100 text-gray-600",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-600",
        yellow: "bg-yellow-50 text-yellow-700",
        blue: "bg-blue-50 text-blue-700",
        purple: "bg-purple-50 text-purple-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[color] ?? map.gray}`}>{text}</span>
    );
};

export const priorityColor: Record<string, string> = {
    HIGH: "red", MEDIUM: "yellow", LOW: "green", CRITICAL: "purple", URGENT: "red",
};

export const statusColor: Record<string, string> = {
    ACTIVE: "green", COMPLETED: "blue", ON_HOLD: "yellow", ARCHIVED: "gray", CANCELLED: "red",
};

export const statusDot: Record<string, string> = {
    ACTIVE: "bg-green-500", COMPLETED: "bg-blue-500", ON_HOLD: "bg-yellow-500", ARCHIVED: "bg-gray-400", CANCELLED: "bg-red-500",
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all ${props.className ?? ""}`} />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={3} className={`w-full px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all resize-none ${props.className ?? ""}`} />
);

export const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <label className={`block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide ${className}`}>{children}</label>
);

export const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4 -mx-6 px-6">
                <h2 className="text-[14px] font-medium text-gray-900 uppercase tracking-wider">{title}</h2>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {children}
        </div>
    </div>
);
