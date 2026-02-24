import React from "react";
import { useAuthStore } from "../../store/authStore";

export const RoleGuard = ({ allowed, children }: { allowed: Array<string>, children: React.ReactNode }) => {
    const { user } = useAuthStore();
    if (!allowed.includes(user.role)) {
        return null;
    }
    return children;
}

// useage---->
// <RoleGuard allowed={["ADMIN", "OWNER"]}>
//    <button>Delete Project</button>
// </RoleGuard>