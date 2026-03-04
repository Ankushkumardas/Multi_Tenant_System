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
            <div className="bg-white rounded-3xl p-8 w-[400px] shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Channel</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Channel Name</label>
                        <input
                            type="text"
                            className="w-full h-11 px-4 bg-gray-50 rounded-xl outline-none focus:bg-white border border-transparent focus:border-gray-200"
                            placeholder="e.g. general, frontend-team..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Add Members</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {members.map((member: any) => (
                                <div
                                    key={member._id}
                                    onClick={() => toggleUser(member._id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedUsers.includes(member._id) ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {member.name?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUsers.includes(member._id) ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300'}`}>
                                        {selectedUsers.includes(member._id) && (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-sm text-gray-400">No other members available to invite.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || isSubmitting}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900 transition-colors"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Channel'}
                    </button>
                </div>
            </div>
        </div>
    );
};
