import React, { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

export const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`bg-linear-to-r from-gray-50 via-gray-100 to-gray-50 bg-size-[200%_100%] animate-shimmer rounded-3xl ${className}`} />
);

export const TrafficLights = () => (
    <div className="flex gap-1.5 px-1">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm shadow-red-500/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm shadow-yellow-500/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm shadow-green-500/10" />
    </div>
);

export const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const Badge = ({ text, color = "gray" }: { text: string; color?: string }) => {
    const map: Record<string, string> = {
        gray: "bg-gray-50 text-gray-500 border-gray-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        red: "bg-rose-50 text-rose-600 border-rose-100",
        yellow: "bg-amber-50 text-amber-600 border-amber-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        purple: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
    return (
        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-colors ${map[color] ?? map.gray}`}>{text}</span>
    );
};

export const priorityColor: Record<string, string> = {
    HIGH: "red", MEDIUM: "yellow", LOW: "green", CRITICAL: "purple", URGENT: "red",
};

export const statusColor: Record<string, string> = {
    ACTIVE: "green", COMPLETED: "blue", ON_HOLD: "yellow", ARCHIVED: "gray", CANCELLED: "red",
};

export const statusDot: Record<string, string> = {
    ACTIVE: "bg-emerald-500", COMPLETED: "bg-blue-500", ON_HOLD: "bg-amber-500", ARCHIVED: "bg-gray-400", CANCELLED: "bg-rose-500",
};

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full h-10 px-4 text-sm bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 transition-all ${props.className ?? ""}`} />
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={3} className={`w-full px-4 py-2 text-sm bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-gray-200 transition-all resize-none ${props.className ?? ""}`} />
);

export const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <label className={`block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider ${className}`}>{children}</label>
);

export const Modal = ({ title, onClose, children, size = "md" }: { title: string; onClose: () => void; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) => {
    const maxWidths = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-5xl"
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidths[size]} max-h-[90vh] flex flex-col z-10`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
