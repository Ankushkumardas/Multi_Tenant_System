import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";

interface MemberRowProps {
    member: any;
    projectId: string;
    slug: string;
    qc: any;
    isOwnerOrAdmin: boolean;
}

export const MemberRow = ({ member, projectId, slug, qc, isOwnerOrAdmin }: MemberRowProps) => {
    const name = member.userId?.name ?? member.name ?? "Member";
    const email = member.userId?.email ?? member.email ?? "";
    const role = member.role ?? "MEMBER";

    const removeMutation = useMutation({
        mutationFn: async () => {
            const userId = member.userId?._id ?? member._id;
            const res = await api.delete(`/${slug}/projects/${projectId}/remove-member`, { data: { userId } });
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["project-members", slug, projectId] }),
    });

    const roleUpdateMutation = useMutation({
        mutationFn: async (newRole: string) => {
            const userId = member.userId?._id ?? member._id;
            const res = await api.put(`/${slug}/projects/${projectId}/update-member-role`, { userId, role: newRole });
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["project-members", slug, projectId] });
            qc.invalidateQueries({ queryKey: ["project", slug, projectId] });
        },
    });

    const isOwner = member.role === "OWNER";

    return (
        <div className="group flex items-center justify-between bg-white hover:bg-gray-50/50 transition-all rounded-2xl border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-[12px] font-medium text-white uppercase shadow-sm">
                    {name[0]}
                </div>
                <div>
                    <h4 className="text-[14px] font-medium text-gray-900">{name}</h4>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{email}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {isOwnerOrAdmin && !isOwner ? (
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => roleUpdateMutation.mutate(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-100 text-gray-900 text-[9px] font-semibold rounded-xl px-4 py-2 uppercase tracking-wider outline-none cursor-pointer hover:bg-white transition-all"
                        >
                            {["ADMIN", "MANAGER", "USER", "VIEWER"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="px-4 py-1.5 bg-gray-50 text-gray-900 text-[9px] font-semibold rounded-lg uppercase tracking-wider border border-gray-100">
                        {role}
                    </div>
                )}

                {isOwnerOrAdmin && !isOwner && (
                    <button
                        onClick={() => { if (window.confirm(`Remove ${name}?`)) removeMutation.mutate(); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};
