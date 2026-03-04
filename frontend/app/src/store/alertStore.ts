import { create } from "zustand";

type AlertType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: string;
    type: AlertType;
    title: string;
    message?: string;
}

interface ConfirmDialog {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface AlertStore {
    toasts: ToastItem[];
    confirm: ConfirmDialog | null;
    // Toast actions
    showToast: (type: AlertType, title: string, message?: string) => void;
    removeToast: (id: string) => void;
    // Confirm dialog actions
    showConfirm: (dialog: ConfirmDialog) => void;
    closeConfirm: () => void;
    // Shorthand helpers
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
    toasts: [],
    confirm: null,

    showToast: (type, title, message) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, type, title, message }] }));
        setTimeout(() => get().removeToast(id), 4000);
    },

    removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    showConfirm: (dialog) => set({ confirm: dialog }),
    closeConfirm: () => set({ confirm: null }),

    success: (title, message) => get().showToast("success", title, message),
    error: (title, message) => get().showToast("error", title, message),
    warning: (title, message) => get().showToast("warning", title, message),
    info: (title, message) => get().showToast("info", title, message),
}));
