import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface RoleRouteProps {
    allowedRoles: string[];
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
    const { user } = useAuthStore();
    const { slug } = useParams();

    const userRole = user?.role?.toUpperCase() || "";
    const isAllowed = allowedRoles.some(r => r.toUpperCase() === userRole) || userRole === "SUPER_ADMIN";

    if (!user || !isAllowed) {
        // Not allowed -> Redirect to dashboard
        return <Navigate to={`/${slug}/dashboard`} replace />;
    }

    return <Outlet />;
};

export default RoleRoute;
