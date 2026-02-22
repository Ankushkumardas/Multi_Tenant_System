import { create } from 'zustand';

interface AuthState {
    user: any | null;
    tenant: any | null;
    isAuthenticated: boolean;
    setUser: (user: any) => void;
    setTenant: (tenant: any) => void;
    logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    tenant: null,
    isAuthenticated: false,
    setUser: (user: any) => {
        set({ user, isAuthenticated: true })
    },
    setTenant: (tenant: any) => {
        set({ tenant })
    },
    logout: () => {
        set({ user: null, tenant: null, isAuthenticated: false })
    }
}))