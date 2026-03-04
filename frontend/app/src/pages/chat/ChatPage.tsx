import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/axios";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { CreateRoomModal } from "../../components/chat/CreateRoomModal";
import { useWorkspaceMembers } from "../../hooks/useDashboard";

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
    const inputRef = useRef<HTMLInputElement>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [activeThread, setActiveThread] = useState<any>(null);
    const [threadMessages, setThreadMessages] = useState<any[]>([]);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardMessage, setForwardMessage] = useState<any>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, any[]>>({});
    const typingTimeoutRef = useRef<any>(null);
    const [editingMsg, setEditingMsg] = useState<any>(null);
    const [editContent, setEditContent] = useState("");

    // Mention state
    const { data: teamData, isLoading: membersLoading } = useWorkspaceMembers();
    const members = teamData?.users ?? [];
    const [mentionSearch, setMentionSearch] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [focusedMentionIdx, setFocusedMentionIdx] = useState(0);

    useEffect(() => {
        fetchRooms();
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
        const SOCKET_URL = new URL(API_URL).origin;
        const socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem("token") }
        });
        socketRef.current = socket;

        socket.on("newMessage", (msg: any) => {
            if (activeRoom && msg.chatRoomId === activeRoom._id) {
                if (msg.parentMessageId) {
                    if (activeThread && msg.parentMessageId === activeThread._id) {
                        setThreadMessages((prev: any[]) => [...prev, msg]);
                    }
                } else {
                    setMessages((prev: any[]) => [...prev, msg]);
                    // Mark as read if active
                    api.post(`/${slug}/chat/${activeRoom._id}/read`).catch(console.error);
                }
            } else {
                // Update unread count for other rooms
                setRooms(prev => prev.map(r => r._id === msg.chatRoomId ? { ...r, unreadCount: (r.unreadCount || 0) + 1 } : r));
            }
        });

        socket.on("messageUpdated", (updatedMsg: any) => {
            if (activeRoom && updatedMsg.chatRoomId === activeRoom._id) {
                setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
            }
            if (activeThread && updatedMsg._id === activeThread._id) {
                setActiveThread(updatedMsg);
            }
            if (activeThread && updatedMsg.parentMessageId === activeThread._id) {
                setThreadMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
            }
        });

        socket.on("messageDeleted", ({ messageId, chatRoomId }: any) => {
            if (activeRoom?._id === chatRoomId) {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
            if (activeThread?._id === messageId) {
                setActiveThread(null);
            }
            if (activeThread?._id === chatRoomId) {
                setThreadMessages(prev => prev.filter(m => m._id !== messageId));
            }
        });

        socket.on("typing", ({ chatRoomId, userId }: any) => {
            if (userId === user?._id) return;
            const userName = members.find((m: any) => m._id === userId)?.name || "Someone";
            setTypingUsers(prev => ({
                ...prev,
                [chatRoomId]: [...(prev[chatRoomId] || []).filter(u => u !== userName), userName]
            }));
        });

        socket.on("stopTyping", ({ chatRoomId, userId }: any) => {
            const userName = members.find((m: any) => m._id === userId)?.name || "Someone";
            setTypingUsers(prev => ({
                ...prev,
                [chatRoomId]: (prev[chatRoomId] || []).filter(u => u !== userName)
            }));
        });

        return () => { socket.disconnect(); };
    }, [activeRoom, activeThread, members]);

    useEffect(() => {
        if (activeRoom) {
            fetchMessages(activeRoom._id);
            // Mark as read
            api.post(`/${slug}/chat/${activeRoom._id}/read`).then(() => {
                setRooms(prev => prev.map(r => r._id === activeRoom._id ? { ...r, unreadCount: 0 } : r));
            }).catch(console.error);
        }
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

    const handleSendMessage = async () => {
        if (!newMsg.trim() || !activeRoom) return;

        if (replyingTo) {
            try {
                await api.post(`/${slug}/messages/${replyingTo._id}/reply`, { content: newMsg });
                setReplyingTo(null);
            } catch (err) {
                console.error(err);
            }
        } else if (activeThread) {
            try {
                await api.post(`/${slug}/messages/${activeThread._id}/reply`, { content: newMsg });
            } catch (err) {
                console.error(err);
            }
        } else {
            socketRef.current.emit("sendMessage", {
                chatRoomId: activeRoom._id,
                content: newMsg
            });
        }
        setNewMsg("");
        setShowMentions(false);
    };

    const fetchThread = async (msg: any) => {
        try {
            setActiveThread(msg);
            const res = await api.get(`/${slug}/messages/${msg._id}/thread`);
            setThreadMessages(res.data.replies || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleForwardSelection = async (targetRoomId: string) => {
        if (!forwardMessage) return;
        try {
            await api.post(`/${slug}/messages/${forwardMessage._id}/forward`, { targetRoomId });
            setShowForwardModal(false);
            setForwardMessage(null);
            // Maybe notify user?
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenDM = async (targetUserId: string) => {
        try {
            const res = await api.post(`/${slug}/chat/direct`, { targetUserId });
            const room = res.data.room;

            // If room not in current rooms list, fetch rooms again or just add it
            if (!rooms.find(r => r._id === room._id)) {
                setRooms(prev => [room, ...prev]);
            }

            setActiveRoom(room);
            fetchMessages(room._id);
        } catch (err) {
            console.error("DM Error:", err);
        }
    };

    const handleMsgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewMsg(val);

        // Typing logic
        if (activeRoom) {
            socketRef.current.emit("typing", { chatRoomId: activeRoom._id });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit("stopTyping", { chatRoomId: activeRoom._id });
            }, 2000);
        }

        const lastWord = val.split(" ").pop() || "";
        if (lastWord.startsWith("@")) {
            setMentionSearch(lastWord.substring(1).toLowerCase());
            setShowMentions(true);
            setFocusedMentionIdx(0);
        } else {
            setShowMentions(false);
        }
    };

    const handleEditMessage = async () => {
        if (!editContent.trim() || !editingMsg) return;
        try {
            await api.put(`/${slug}/messages/${editingMsg._id}`, { content: editContent });
            setEditingMsg(null);
            setEditContent("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!window.confirm("Delete this message for everyone?")) return;
        try {
            await api.delete(`/${slug}/messages/${messageId}`);
        } catch (err) {
            console.error(err);
        }
    };

    const insertMention = (memberName: string) => {
        const words = newMsg.split(" ");
        words.pop();
        const mentionText = `@${memberName} `;
        setNewMsg(words.length > 0 ? words.join(" ") + " " + mentionText : mentionText);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const filteredMembers = members.filter((m: any) => m.name.toLowerCase().includes(mentionSearch) && m._id !== user?._id);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showMentions && filteredMembers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedMentionIdx((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedMentionIdx((prev) => (prev > 0 ? prev - 1 : prev));
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                insertMention(filteredMembers[focusedMentionIdx].name);
                return;
            }
            if (e.key === "Escape") {
                setShowMentions(false);
                return;
            }
        }

        if (e.key === "Enter" && !showMentions) {
            handleSendMessage();
        }
    };

    const renderMessageContent = (content: string, isSender: boolean) => {
        const parts = content.split(/(@[\w.-]+)/g);
        return parts.map((part, i) => {
            if (part.startsWith("@")) {
                return (
                    <span key={i} className={`font-semibold px-1 rounded-md shadow-sm ${isSender ? "text-white bg-blue-500/40" : "text-blue-600 bg-blue-100"}`}>
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <DashboardLayout title="Secure Comms" noPadding>
            <div className="w-full h-[calc(100vh-64px)] bg-white flex overflow-hidden">

                {/* ── Chat Sidebar ── */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[18px] font-medium text-gray-900 tracking-tight">Channels</h2>
                                {rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0) > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-100">
                                        {rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0)} New
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-widest">Workspace discussions</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Channels Section */}
                        <div className="space-y-1">
                            <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                Channels
                            </h3>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100/50 animate-pulse rounded-2xl mb-2" />)
                            ) : rooms.filter(r => r.type !== "DIRECT").length === 0 ? (
                                <p className="text-[11px] text-gray-400 px-2 italic">No public nodes</p>
                            ) : (
                                rooms.filter(r => r.type !== "DIRECT").map(room => (
                                    <button
                                        key={room._id}
                                        onClick={() => { setActiveRoom(room); fetchMessages(room._id); }}
                                        className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${activeRoom?._id === room._id ? "bg-white shadow-md border border-gray-100" : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-900"}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-medium ${activeRoom?._id === room._id ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"}`}>
                                            {room.name?.[0]?.toUpperCase() ?? "C"}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[13px] font-medium truncate">{room.name}</p>
                                                {room.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
                                                        {room.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] text-gray-400 truncate tracking-tight">
                                                    {typingUsers[room._id]?.length > 0
                                                        ? <span className="text-emerald-500 font-medium italic animate-bounce">Typing...</span>
                                                        : (room.type || "Group")
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Direct Messages Section */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    Direct Messages
                                </h3>
                                {rooms.filter(r => r.type === "DIRECT").reduce((acc, r) => acc + (r.unreadCount || 0), 0) > 0 && (
                                    <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-blue-100">
                                        {rooms.filter(r => r.type === "DIRECT").reduce((acc, r) => acc + (r.unreadCount || 0), 0)}
                                    </span>
                                )}
                            </div>
                            {membersLoading ? (
                                Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100/50 animate-pulse rounded-2xl mb-2" />)
                            ) : members.filter((m: any) => m._id !== user?._id).length === 0 ? (
                                <p className="text-[11px] text-gray-400 px-2 italic">No users found</p>
                            ) : (
                                members.filter((m: any) => m._id !== user?._id).map((member: any) => {
                                    const isActive = activeRoom && activeRoom.type === "DIRECT" && (activeRoom.name === member.name || activeRoom.name.includes(member.name));

                                    return (
                                        <button
                                            key={member._id}
                                            onClick={() => handleOpenDM(member._id)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${isActive ? "bg-white shadow-md border border-gray-100" : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-900"}`}
                                        >
                                            <div className="relative">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-medium ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-200 text-gray-500"}`}>
                                                    {member.name?.[0]?.toUpperCase() ?? "U"}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm" />
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[13px] font-medium truncate">{member.name}</p>
                                                    {(() => {
                                                        const dmRoomForUser = rooms.find(r =>
                                                            r.type === "DIRECT" &&
                                                            r.participantIds?.includes(member._id) &&
                                                            r.participantIds?.includes(user?._id)
                                                        );
                                                        return dmRoomForUser?.unreadCount > 0 && (
                                                            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
                                                                {dmRoomForUser.unreadCount}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-gray-400 truncate tracking-tight">{member.role || "Member"}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
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
                                        <div className={`w-1.5 h-1.5 rounded-full ${typingUsers[activeRoom._id]?.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-green-400"}`} />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                                            {typingUsers[activeRoom._id]?.length > 0
                                                ? `${typingUsers[activeRoom._id].join(", ")} is typing...`
                                                : "Channel Active"
                                            }
                                        </span>
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
                                    {messages.map((msg, idx) => {
                                        const senderStr = (msg.senderId?._id || msg.senderId)?.toString();
                                        const userStr = (user?._id || user?.userId)?.toString();
                                        const isSender = senderStr && userStr && senderStr === userStr;

                                        // Unread divider logic
                                        const isFirstUnread = !msg.readBy.includes(user?._id) && (idx === 0 || messages[idx - 1].readBy.includes(user?._id));

                                        return (
                                            <React.Fragment key={msg._id || idx}>
                                                {isFirstUnread && (
                                                    <div className="flex items-center gap-4 my-8">
                                                        <div className="flex-1 h-px bg-red-100" />
                                                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100 shadow-sm">
                                                            New Messages
                                                        </span>
                                                        <div className="flex-1 h-px bg-red-100" />
                                                    </div>
                                                )}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    className={`flex items-start gap-4 group ${isSender ? "flex-row-reverse" : ""}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                                                        {msg.senderId?.name?.[0]?.toUpperCase() ?? "U"}
                                                    </div>
                                                    <div className={`max-w-[70%] ${isSender ? "items-end" : "items-start"} flex flex-col relative`}>
                                                        {msg.isForwarded && (
                                                            <span className="text-[9px] text-gray-400 mb-1 flex items-center gap-1">
                                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                                Forwarded
                                                            </span>
                                                        )}
                                                        <div className={`px-5 py-3 rounded-[24px] text-[13px] leading-relaxed shadow-sm relative group ${isSender ? "bg-gray-900 text-white rounded-tr-none" : "bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100"}`}>
                                                            {editingMsg?._id === msg._id ? (
                                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                                    <textarea
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="w-full bg-transparent text-inherit outline-none border-b border-white/20 p-1 resize-none text-[12px]"
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => setEditingMsg(null)} className="text-[10px] opacity-70">Cancel</button>
                                                                        <button onClick={handleEditMessage} className="text-[10px] font-bold">Save</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {renderMessageContent(msg.content, isSender)}
                                                                    {msg.isEdited && <span className="text-[9px] opacity-40 ml-1.5 font-medium tracking-wide">(edited)</span>}
                                                                </>
                                                            )}

                                                            {/* Hover Actions */}
                                                            <div className={`absolute top-0 ${isSender ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border border-gray-100 p-1 rounded-lg shadow-sm w-max z-30`}>
                                                                {isSender && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setEditingMsg(msg); setEditContent(msg.content); }}
                                                                            className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteMessage(msg._id)}
                                                                            className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                                            title="Delete"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-blue-600 transition-colors" title="Reply">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                                </button>
                                                                <button onClick={() => { setForwardMessage(msg); setShowForwardModal(true); }} className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-green-600 transition-colors" title="Forward">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                                </button>
                                                                <button onClick={() => fetchThread(msg)} className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-purple-600 transition-colors" title="Threads">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 mt-1 ${isSender ? "justify-end" : "justify-start"}`}>
                                                            <span className="text-[9px] text-gray-400 uppercase tracking-tighter">
                                                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isSender && (
                                                                <div className="flex items-center gap-0.5" title={msg.readBy.length > 1 ? `Read by ${msg.readBy.length - 1} people` : "Sent"}>
                                                                    {msg.readBy.length > 1 ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">
                                                                                {activeRoom?.type === "DIRECT" ? "Seen" : `Read by ${msg.readBy.length - 1}`}
                                                                            </span>
                                                                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                        </div>
                                                                    ) : (
                                                                        <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Input Area */}
                            <div className="p-6 bg-white border-t border-gray-50 relative">
                                {replyingTo && (
                                    <div className="mx-6 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Replying to {replyingTo.senderId?.name}</span>
                                            <p className="text-[12px] text-gray-500 truncate italic">"{replyingTo.content}"</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-white rounded-full text-gray-400 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                                <AnimatePresence>
                                    {showMentions && filteredMembers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute bottom-full left-6 mb-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-20"
                                        >
                                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                                {filteredMembers.map((member: any, idx: number) => (
                                                    <button
                                                        key={member._id}
                                                        onClick={() => insertMention(member.name)}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${idx === focusedMentionIdx ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {member.name?.[0]?.toUpperCase() ?? "U"}
                                                        </div>
                                                        <span className="text-[13px] font-medium text-gray-900 truncate">
                                                            {member.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[28px] border border-gray-100 focus-within:border-gray-200 focus-within:bg-white focus-within:shadow-xl transition-all duration-300">
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Type your transmission..."
                                        value={newMsg}
                                        onChange={handleMsgChange}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 bg-transparent outline-none text-[13px] text-gray-900 placeholder-gray-300 px-2"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMsg.trim() && !showMentions}
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

                {/* ── Thread Sidebar (Sidepane) ── */}
                <AnimatePresence>
                    {activeThread && (
                        <motion.div
                            initial={{ x: 400 }}
                            animate={{ x: 0 }}
                            exit={{ x: 400 }}
                            className="w-96 border-l border-gray-100 flex flex-col bg-white shadow-2xl z-30"
                        >
                            <div className="h-20 p-6 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[15px] font-medium text-gray-900 tracking-tight">Thread</h2>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-medium">Discussion context</p>
                                </div>
                                <button
                                    onClick={() => setActiveThread(null)}
                                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Original Message Copy */}
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        {activeThread.senderId?.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-900 mb-1">{activeThread.senderId?.name}</p>
                                        <div className="px-4 py-2 bg-white rounded-2xl text-[12px] border border-gray-200 shadow-sm text-gray-700">
                                            {renderMessageContent(activeThread.content, false)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thread Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {threadMessages.map((tmsg, i) => (
                                    <div key={tmsg._id || i} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                                            {tmsg.senderId?.name?.[0]?.toUpperCase() ?? "U"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[11px] font-bold text-gray-900">{tmsg.senderId?.name}</span>
                                                <span className="text-[9px] text-gray-400">{new Date(tmsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="text-[12px] text-gray-700 leading-relaxed">
                                                {renderMessageContent(tmsg.content, false)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Thread Input */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                                    <input
                                        type="text"
                                        placeholder="Reply to thread..."
                                        value={newMsg}
                                        onChange={(e) => setNewMsg(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1 bg-transparent outline-none text-[12px] px-2"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMsg.trim()}
                                        className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:opacity-30"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={fetchRooms}
                slug={slug as string}
            />

            {/* ── Forward Selection Modal ── */}
            <AnimatePresence>
                {showForwardModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[18px] font-bold text-gray-900 tracking-tight">Forward Transmission</h3>
                                    <p className="text-[11px] mt-0.5 uppercase tracking-widest font-semibold text-emerald-500">Pick Target Channel</p>
                                </div>
                                <button onClick={() => setShowForwardModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2 bg-gray-50/30">
                                {rooms.map(room => (
                                    <button
                                        key={room._id}
                                        onClick={() => handleForwardSelection(room._id)}
                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[13px] font-bold group-hover:scale-110 transition-transform">
                                            {room.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[14px] font-semibold text-gray-900 truncate">{room.name}</p>
                                            <p className="text-[11px] text-gray-400">{room.type || "Public Node"}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-200 ml-auto group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default ChatPage;
