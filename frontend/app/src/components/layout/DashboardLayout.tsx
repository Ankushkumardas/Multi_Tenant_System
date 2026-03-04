import { useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/axios";
import { NotificationDropdown } from "./NotificationDropdown";
import { motion, AnimatePresence } from "framer-motion";

// (Moved into Sidebar for dynamic role handling)

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, tenant, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await api.post(`/${slug}/user/logout`);
        } catch { /* ignore */ }
        localStorage.removeItem("token");
        logout();
        navigate("/login");
    };

    const isActive = (href: string) => {
        const path = location.pathname;
        if (href === 'dashboard') return path.endsWith('/dashboard');
        // For "projects" avoid matching "projects-team" or project subroutes inside settings
        if (href === 'projects') {
            // match /<slug>/projects or /<slug>/projects/... but NOT settings/projects-team
            return /\/projects(\/|$)/.test(path) && !path.includes('settings/projects');
        }
        return path.includes(`/${href}`);
    };

    const sideItems = [
        {
            group: "Core",
            items: [
                { label: "Dashboard", href: "dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
                { label: "Projects", href: "projects", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg> },
                { label: "Messages", href: "chat", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.474-.065.598.598 0 01-.225-.351l-.442-2.773A8.15 8.15 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> },
                { label: "Notifications", href: "notifications", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> },
            ]
        },
        {
            group: "Workspace",
            items: [
                { label: "Team Directory", href: "settings/team", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
                { label: "Projects Map", href: "settings/projects-team", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18v18H3V3z" /></svg> },
                { label: "Billing & Plans", href: "settings/subscription", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
                { label: "General Settings", href: "settings/workspace", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0112 15c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" /></svg> },
            ]
        },
        {
            group: "Logs & Security",
            items: [
                { label: "Activity Feed", href: "activity", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg> },
                { label: "Audit Universe", href: "settings/audit", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
                { label: "Access Control", href: "settings/sessions", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.548 4.076 10.21 9 10.956 4.924-.746 9-5.408 9-10.956 0-1.315-.21-2.583-.598-3.744A11.959 11.959 0 0112 2.714z" /></svg> },
            ]
        },
        {
            group: "Account",
            items: [
                { label: "My Profile", href: "settings/profile", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            ]
        }
    ];

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    w-64 bg-white flex flex-col border-r border-gray-100 h-screen
                    transition-all duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
            >
                {/* Logo & Workspace */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                    <Link to={`/${slug}/dashboard`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-[15px] truncate tracking-tight leading-tight">{tenant?.name ?? "Workspace"}</p>
                            <p className="text-[10px] text-gray-400 truncate uppercase mt-0.5 font-bold tracking-widest">{slug}</p>
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
                    <nav className="space-y-5">
                        {sideItems.map((group) => (
                            <div key={group.group}>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 px-3">
                                    {group.group}
                                </h4>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                to={`/${slug}/${item.href}`}
                                                onClick={() => window.innerWidth < 1024 && onClose()}
                                                className={`
                                                    flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200
                                                    ${active
                                                        ? "bg-blue-600 text-white"
                                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                    }
                                                `}
                                            >
                                                <span className={`transition-colors duration-200 ${active ? "text-white" : "text-gray-400"}`}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* User profile + logout */}
                <div className="border-t border-gray-100 p-4 shrink-0 bg-white">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-lg bg-[#0B0E14] text-white flex items-center justify-center text-[14px] font-bold">
                            {user?.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-bold text-gray-900 truncate leading-tight">{user?.name ?? "User"}</p>
                            <p className="text-[10px] font-medium text-gray-500 truncate capitalize">{user?.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 h-10 bg-white border border-gray-200 rounded-lg text-[11px] text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all font-bold uppercase tracking-widest group"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>




        </>
    );
};

// ── Top bar ───────────────────────────────────────────────────────────────────

const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const { user } = useAuthStore();
    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="relative group hidden sm:block">
                    <input
                        placeholder="Search..."
                        className="w-64 h-9 pl-9 pr-4 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white border border-transparent focus:border-gray-200 transition-all"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationDropdown />
                <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-medium text-gray-700 hidden sm:block tracking-tight">
                        {user?.name ?? "User"}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                </div>
            </div>
        </header>
    );
};

// ── Layout wrapper ────────────────────────────────────────────────────────────
interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    noPadding?: boolean;
}

export const DashboardLayout = ({ children, noPadding = false }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />
                <main className={`flex-1 overflow-y-auto ${noPadding ? "p-0" : "p-6 sm:p-8"}`}>
                    <div className=" mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
