import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/axios";

export default function ProtectedRoute() {
  const { slug } = useParams();
  const { isAuthenticated, setUser, setTenant } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    async function AuthCheck() {
      try {
        const res = await api.get(`/${slug}/user/profile`);
        setUser(res.data.user);
        setTenant(res.data.tenant);
      } catch {
        setAuthFailed(true);
      } finally {
        setLoading(false);
      }
    }

    AuthCheck();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-gray-400 text-sm font-[Inter,sans-serif]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Loading…
      </div>
    );
  }
  if (authFailed || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}