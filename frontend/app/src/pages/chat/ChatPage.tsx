import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const ChatPage = () => {
    const { user, tenant } = useAuthStore();
    const slug = tenant?.slug;
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoom, setActiveRoom] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchRooms();
        const socket = io("http://localhost:5000", {
            auth: { token: localStorage.getItem("token") }
        });
        socketRef.current = socket;

        socket.on("newMessage", (msg: any) => {
            if (activeRoom && msg.chatRoomId === activeRoom._id) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => { socket.disconnect(); };
    }, [activeRoom]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchRooms = async () => {
        try {
            const res = await api.get(`/${slug}/chat`);
            setRooms(res.data.rooms || []);
            if (res.data.rooms?.length > 0 && !activeRoom) {
                setActiveRoom(res.data.rooms[0]);
                fetchMessages(res.data.rooms[0]._id);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchMessages = async (roomId: string) => {
        try {
            const res = await api.get(`/${slug}/chat/${roomId}/messages`);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = () => {
        if (!newMsg.trim() || !activeRoom) return;
        socketRef.current.emit("sendMessage", {
            chatRoomId: activeRoom._id,
            content: newMsg
        });
        setNewMsg("");
    };

    return (
        <DashboardLayout title="Secure Comms" noPadding>
            <div className="w-full h-[calc(100vh-64px)] bg-white flex overflow-hidden">

                {/* ── Chat Sidebar ── */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-[18px] font-medium text-gray-900 tracking-tight">Channels</h2>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest">Workspace discussions</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-gray-100/50 animate-pulse rounded-2xl mb-2" />)
                        ) : rooms.length === 0 ? (
                            <p className="text-[12px] text-gray-400 text-center py-10">No active channels</p>
                        ) : (
                            rooms.map(room => (
                                <button
                                    key={room._id}
                                    onClick={() => { setActiveRoom(room); fetchMessages(room._id); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeRoom?._id === room._id ? "bg-white shadow-md border border-gray-100" : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-900"}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-medium ${activeRoom?._id === room._id ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"}`}>
                                        {room.name?.[0]?.toUpperCase() ?? "C"}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[13px] font-medium truncate">{room.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate tracking-tight">{room.type || "Group"}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Main Chat Area ── */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {activeRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 border-b border-gray-50 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                <div>
                                    <h3 className="text-[15px] font-medium text-gray-900 tracking-tight">{activeRoom.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Channel Active</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    </button>
                                    <button className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
                            >
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={msg._id || idx}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex items-start gap-4 ${(msg.senderId?._id || msg.senderId) === user?.userId ? "flex-row-reverse" : ""}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                                                {msg.senderId?.name?.[0]?.toUpperCase() ?? "U"}
                                            </div>
                                            <div className={`max-w-[70%] ${(msg.senderId?._id || msg.senderId) === user?.userId ? "items-end" : "items-start"} flex flex-col`}>
                                                <div className={`px-5 py-3 rounded-[24px] text-[13px] leading-relaxed shadow-sm ${(msg.senderId?._id || msg.senderId) === user?.userId ? "bg-gray-900 text-white rounded-tr-none" : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-gray-300 mt-1 uppercase tracking-tighter">
                                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Input Area */}
                            <div className="p-6 bg-white border-t border-gray-50">
                                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[28px] border border-gray-100 focus-within:border-gray-200 focus-within:bg-white focus-within:shadow-xl transition-all duration-300">
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Type your transmission..."
                                        value={newMsg}
                                        onChange={e => setNewMsg(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                                        className="flex-1 bg-transparent outline-none text-[13px] text-gray-900 placeholder-gray-300 px-2"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMsg.trim()}
                                        className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-110 active:scale-95 shadow-lg"
                                    >
                                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/20">
                            <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.303.025-.607.038-.912.038a33.107 33.107 0 01-1.393-.038L15 17.067V20.25a.75.75 0 01-1.5 0v-4.124l-1.928-1.928a.75.75 0 010-1.061l.928-.928V8.511z" /></svg>
                            </div>
                            <h3 className="text-[18px] font-medium text-gray-900 tracking-tight">Select a transmission node</h3>
                            <p className="text-[13px] text-gray-400 mt-1 max-w-sm">Initiate a secure channel to begin collaborative exchange across the workspace.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatPage;
