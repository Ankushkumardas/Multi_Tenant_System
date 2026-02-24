
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/axios";
export default function ProtectedRoute() {
  const { slug } = useParams();
  const { isAuthenticated, setUser, setTenant } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function AuthCheck() {
      try {
        const res = await api.get(`/api/${slug}/user/profile`);
        setUser(res.data.user);
        setTenant(res.data.tenant);
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    AuthCheck();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Outlet />;
}