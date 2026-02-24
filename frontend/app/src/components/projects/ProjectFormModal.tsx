import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { Modal, Label, Input, Textarea } from "./ProjectUI";

interface ProjectFormModalProps {
    project?: any;
    onClose: () => void;
}

export const ProjectFormModal = ({ project, onClose }: ProjectFormModalProps) => {
    const { slug } = useParams();
    const qc = useQueryClient();
    const [form, setForm] = useState({
        name: project?.name ?? "",
        description: project?.description ?? "",
        status: project?.status ?? "ACTIVE",
        startDate: project?.startDate?.slice(0, 10) ?? "",
        endDate: project?.endDate?.slice(0, 10) ?? "",
    });

    const mutation = useMutation({
        mutationFn: async () => {
            if (project) {
                const res = await api.put(`/${slug}/projects/${project._id}`, form);
                return res.data;
            }
            const res = await api.post(`/${slug}/projects`, form);
            return res.data;
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects", slug] }); onClose(); },
    });

    return (
        <Modal title={project ? "Edit Project" : "New Project"} onClose={onClose}>
            <div className="space-y-4">
                <div><Label>Name *</Label><Input placeholder="Project name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Description</Label><Textarea placeholder="What's this project about?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><Label>Start date</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
                    <div><Label>End date</Label><Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
                </div>
                <div>
                    <Label>Status</Label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all">
                        {["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED", "CANCELLED"].map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                {mutation.isError && <p className="text-[12px] text-red-500">{(mutation.error as any)?.response?.data?.message ?? "Something went wrong"}</p>}
                <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending || !form.name.trim()}
                    className="w-full h-9 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {mutation.isPending ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</> : project ? "Save changes" : "Create project"}
                </button>
            </div>
        </Modal>
    );
};
