import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useEffect, useRef } from "react";

export const NotificationDropdown = () => {
    const { slug } = useParams();
    const qc = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
        const SOCKET_URL = new URL(API_URL).origin;

        const socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem("token") }
        });
        socketRef.current = socket;

        socket.on("newnotification", (data: any) => {
            // Unread count is updated real-time, invalidate queries to fetch
            qc.invalidateQueries({ queryKey: ["notifications", slug] });
        });

        return () => {
            socket.disconnect();
        };
    }, [slug, qc]);

    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ["notifications", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/notification/all`);
            return res.data;
        },
    });

    const notifications = Array.isArray(notificationsData) ? notificationsData : notificationsData?.notifications ?? [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => api.post(`/${slug}/notification/mark-as-read/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", slug] }),
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => api.post(`/${slug}/notification/mark-all-read`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", slug] }),
    });

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative ${isOpen ? "bg-gray-100 text-gray-900 shadow-inner" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm"
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 flex flex-col overflow-hidden origin-top-right"
                        >
                            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                                <div>
                                    <h3 className="text-[14px] font-bold text-gray-900 tracking-tight leading-none">Notifications</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">{unreadCount} Unread</p>
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllReadMutation.mutate()}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors uppercase tracking-wide"
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50 scrollbar-hide">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="w-8 h-8 border-2 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                                        <p className="text-gray-400 text-[11px] font-medium">Syncing activity…</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-10 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        </div>
                                        <h4 className="text-[13px] font-bold text-gray-900">All caught up!</h4>
                                        <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">No new notifications for you right now.</p>
                                    </div>
                                ) : (
                                    notifications.map((n: any) => (
                                        <motion.div
                                            key={n._id}
                                            whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
                                            onClick={() => !n.isRead && markAsReadMutation.mutate(n._id)}
                                            className={`p-4 transition-all cursor-pointer relative ${!n.isRead ? "bg-white" : "bg-gray-50/20"}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${n.type === 'LOGIN' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                    n.type === 'ASSIGN_TASK' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                                        'bg-gray-50 border-gray-100 text-gray-600'
                                                    }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-[12px] truncate tracking-tight ${!n.isRead ? "font-bold text-gray-900" : "text-gray-600 font-medium"}`}>{n.title}</p>
                                                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed font-medium">{n.message}</p>
                                                    <p className="text-[9px] text-gray-300 mt-2 font-bold uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 bg-white text-center border-t border-gray-50">
                                <button className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest">
                                    View Full History
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

