import React, { useState } from 'react';
import { useWorkspaceMembers } from '../../hooks/useDashboard';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    slug: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreated, slug }) => {
    const { data: teamData } = useWorkspaceMembers();
    const { user } = useAuthStore();
    const members = (teamData?.users ?? []).filter((m: any) => m._id !== user?._id);

    const [name, setName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post(`/${slug}/chat`, {
                name,
                type: selectedUsers.length > 1 ? "GROUP" : "DIRECT",
                participants: selectedUsers
            });
            onCreated();
            onClose();
            setName('');
            setSelectedUsers([]);
        } catch (error) {
            console.error("Failed to create room", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 w-[360px] shadow-2xl">
                <h2 className="text-base font-bold text-gray-900 mb-4 tracking-tight">New Channel</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1 cursor-default">Name</label>
                        <input
                            type="text"
                            className="w-full h-10 px-3 bg-gray-50 rounded-lg outline-none focus:bg-white border border-transparent focus:border-gray-100 text-[13px] transition-all"
                            placeholder="e.g. general, frontend-team..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1 ml-1 cursor-default">Add Members</label>
                        <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 scrollbar-hide">
                            {members.map((member: any) => (
                                <div
                                    key={member._id}
                                    onClick={() => toggleUser(member._id)}
                                    className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all border ${selectedUsers.includes(member._id) ? 'border-gray-900 bg-gray-900/5' : 'border-gray-50 hover:border-gray-100'}`}
                                >
                                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {member.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[12px] font-medium text-gray-900">{member.name}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedUsers.includes(member._id) ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'border-gray-200'}`}>
                                        {selectedUsers.includes(member._id) && (
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-[11px] text-gray-400 italic p-2">No other members available.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || isSubmitting}
                        className="px-4 py-1.5 rounded-lg text-[13px] font-bold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                    >
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};
