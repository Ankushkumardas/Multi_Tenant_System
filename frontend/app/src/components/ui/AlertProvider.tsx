import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlertStore } from "../../store/alertStore";

// ── Icons ─────────────────────────────────────────────────────────────────────

const SuccessIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ErrorIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);
const WarningIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);
const InfoIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);
const DangerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

// ── Config per type ───────────────────────────────────────────────────────────

const toastConfig = {
    success: {
        icon: <SuccessIcon />,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        actionColor: "text-emerald-600 hover:text-emerald-700",
    },
    error: {
        icon: <ErrorIcon />,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        actionColor: "text-red-600 hover:text-red-700",
    },
    warning: {
        icon: <WarningIcon />,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        actionColor: "text-amber-600 hover:text-amber-700",
    },
    info: {
        icon: <InfoIcon />,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        actionColor: "text-blue-600 hover:text-blue-700",
    },
};

// ── Toast Modal ────────────────────────────────────────────────────────────────
// Each toast looks exactly like the confirm dialog — centered card, icon, title, subtitle, divider, Dismiss button

const ToastModal = ({ toast }: { toast: any }) => {
    const { removeToast } = useAlertStore();
    const cfg = toastConfig[toast.type as keyof typeof toastConfig];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center p-4"
        >
            {/* Backdrop — click to dismiss */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={() => removeToast(toast.id)}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 12 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 w-full max-w-[380px] overflow-hidden"
            >
                {/* Body */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}>
                        {cfg.icon}
                    </div>

                    {/* Title */}
                    <p className="text-[16px] font-semibold text-gray-900 tracking-tight mb-1.5">
                        {toast.title}
                    </p>

                    {/* Subtitle */}
                    {toast.message && (
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                            {toast.message}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Footer */}
                <div className="p-4">
                    <button
                        onClick={() => removeToast(toast.id)}
                        className={`w-full h-9 rounded-lg text-[13px] font-semibold transition-all border ${cfg.iconBg} ${cfg.iconColor} border-transparent hover:opacity-80`}
                    >
                        Got it
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

const ConfirmModal = () => {
    const { confirm, closeConfirm } = useAlertStore();

    useEffect(() => {
        if (!confirm) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeConfirm();
            if (e.key === "Enter") { confirm.onConfirm(); closeConfirm(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [confirm]);

    if (!confirm) return null;

    const handleConfirm = () => { confirm.onConfirm(); closeConfirm(); };
    const handleCancel = () => { confirm.onCancel?.(); closeConfirm(); };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center p-4"
            onClick={handleCancel}
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 12 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 w-full max-w-[400px] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Body */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${confirm.danger ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-500"}`}>
                        {confirm.danger ? <DangerIcon /> : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3.75h.008v.008H12v-.008z" />
                            </svg>
                        )}
                    </div>

                    {/* Title */}
                    <p className="text-[16px] font-semibold text-gray-900 tracking-tight mb-1.5">
                        {confirm.title}
                    </p>

                    {/* Message */}
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                        {confirm.message}
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Actions */}
                <div className="flex items-center gap-2.5 p-4">
                    <button
                        onClick={handleCancel}
                        className="flex-1 h-9 px-4 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        {confirm.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition-all ${confirm.danger
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-900 hover:bg-black"
                            }`}
                    >
                        {confirm.confirmLabel ?? "Confirm"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Provider ───────────────────────────────────────────────────────────────────

export const AlertProvider = () => {
    const { toasts, confirm } = useAlertStore();

    // Only show one toast at a time (the latest one)
    const activeToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

    return (
        <>
            {/* Toast — centered, one at a time */}
            <AnimatePresence mode="wait">
                {activeToast && !confirm && (
                    <ToastModal key={activeToast.id} toast={activeToast} />
                )}
            </AnimatePresence>

            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirm && <ConfirmModal key="confirm-modal" />}
            </AnimatePresence>
        </>
    );
};
