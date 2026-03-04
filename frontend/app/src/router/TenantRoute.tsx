import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const TenantRoute = () => {
    const { slug } = useParams();
    const { tenant } = useAuthStore();

    if (!tenant) return <Navigate to="/login" replace />;

    // Validate that the URL slug matches the tenant slug in the auth store
    if (tenant.slug !== slug) {
        return <Navigate to={`/${tenant.slug}/dashboard`} replace />;
    }

    return <Outlet />;
};

export default TenantRoute;
