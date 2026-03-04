import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

const NotificationsPage = () => {
    const { slug } = useParams();
    const queryClient = useQueryClient();

    const { data: notifData, isLoading } = useQuery({
        queryKey: ["notifications", slug],
        queryFn: async () => {
            const res = await api.get(`/${slug}/notification/all`);
            return res.data;
        }
    });

    const notifications = notifData?.notifications || [];

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.post(`/${slug}/notification/mark-as-read/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", slug] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/${slug}/notification/mark-all-read`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", slug] });
        }
    });

    return (
        <DashboardLayout title="Alert Center" noPadding>
            <div className="w-full min-h-screen bg-gray-50/30 flex flex-col">
                <div className="bg-white border-b border-gray-100 px-8 py-6 sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[20px] font-medium text-gray-900 tracking-tight">Notification Archive</h1>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest">System alerts & updates</p>
                    </div>
                    {notifications.some((n: any) => !n.isRead) && (
                        <button
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                            className="h-10 px-5 text-gray-500 bg-white border border-gray-200 text-[12px] font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Mark All Read
                        </button>
                    )}
                </div>

                <div className="p-8 max-w-[800px] mx-auto w-full">
                    <div className="space-y-3">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-white border border-gray-100 rounded-3xl animate-pulse" />
                            ))
                        ) : notifications.length === 0 ? (
                            <div className="bg-white rounded-[32px] border border-gray-100 p-16 text-center shadow-sm">
                                <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4">🔔</div>
                                <h3 className="text-[16px] font-medium text-gray-900 tracking-tight">All caught up!</h3>
                                <p className="text-[13px] text-gray-400 mt-2">There are no internal signals right now.</p>
                            </div>
                        ) : (
                            notifications.map((n: any, i: number) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={n._id}
                                    className={`relative p-5 rounded-3xl border transition-all ${!n.isRead ? 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50/50' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-sm'}`}
                                >
                                    {!n.isRead && (
                                        <div className="absolute top-5 left-5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                    )}
                                    <div className="pl-6 pr-12 flex justify-between items-start gap-4">
                                        <div>
                                            <p className={`text-[14px] leading-relaxed tracking-tight ${!n.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                {n.message}
                                            </p>
                                            <span className="inline-block mt-3 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {!n.isRead && (
                                            <button
                                                onClick={() => markAsReadMutation.mutate(n._id)}
                                                className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                                title="Mark as read"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                        )}
                                    </div>
                                    {n.link && (
                                        <a href={n.link} className="absolute inset-0 z-0" aria-label="View Details" />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NotificationsPage;
