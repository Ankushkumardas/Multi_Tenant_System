import { useAuthStore } from "../../store/authStore";
import { motion } from "framer-motion";

const WorkspacePage = () => {
    const { tenant } = useAuthStore();

    return (
        <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-[20px] font-medium text-gray-900 tracking-tight">Workspace Identity</h2>
                <p className="text-[13px] text-gray-400 mt-1">Configure global parameters for your organization</p>
            </div>

            <div className="p-8 rounded-[32px] border border-gray-100 bg-gray-50/50 space-y-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-medium shadow-lg">
                        {tenant?.name?.[0]?.toUpperCase() ?? "W"}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[15px] font-medium text-gray-900">{tenant?.name}</h3>
                        <p className="text-[12px] text-gray-400 uppercase tracking-widest mt-0.5">{tenant?.tenantType || "Standard Tier"}</p>
                    </div>
                    <button className="h-9 px-4 border border-gray-100 bg-white text-[11px] font-medium rounded-lg hover:bg-gray-50 transition-all uppercase tracking-wider">Change Avatar</button>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">Display Name</label>
                        <input
                            defaultValue={tenant?.name}
                            className="w-full h-11 px-4 bg-white border border-gray-100 rounded-xl text-[13px] focus:border-gray-200 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">System Slug</label>
                        <input
                            readOnly
                            defaultValue={tenant?.slug}
                            className="w-full h-11 px-4 bg-gray-100/50 border border-transparent rounded-xl text-[13px] text-gray-400 outline-none"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WorkspacePage;
