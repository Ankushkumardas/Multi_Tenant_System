import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/axios";

export default function ProtectedRoute() {
  const { slug } = useParams();
  const { isAuthenticated, setUser, setTenant } = useAuthStore();

  // If the auth store is already populated (e.g. just logged in), skip the API check
  const [loading, setLoading] = useState(!isAuthenticated);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // If already authenticated from the store, no need to re-verify
    if (isAuthenticated) {
      setLoading(false);
      return;
    }

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
  }, [slug, isAuthenticated]);

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