import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import {
  useDashboardStats,
  useWorkspaceMembers,
  useActivityFeed,
  useActivityStats,
} from "../../hooks/useDashboard";
import { useProjects } from "../../hooks/useProjects";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";

/* ── helpers ───────────────────────────────────────────── */
const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

const rel = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const colors = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-500", "bg-cyan-600"];

const DashboardPage = () => {
  const { tenant } = useAuthStore();
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: projectsData, isLoading: pL } = useProjects();
  const { data: statsData, isLoading: sL } = useDashboardStats();
  const { data: teamData, isLoading: tL } = useWorkspaceMembers();
  const { data: activityData, isLoading: aL } = useActivityFeed();
  const { data: activityStatsData } = useActivityStats();

  const projects: any[] = projectsData?.projects ?? projectsData ?? [];
  const stats = statsData?.stats ?? {};
  const members: any[] = teamData?.users ?? [];
  const activities: any[] = activityData?.activities ?? activityData ?? [];
  const actStats: any[] = activityStatsData?.stats ?? [];
  const loading = pL || sL || tL;

  // Activity bar chart — group activities by day (last 7 days)
  const dailyActivity = useMemo(() => {
    const days: Record<string, number> = {};
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
      labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    }
    activities.forEach((a: any) => {
      const key = new Date(a.createdAt).toISOString().slice(0, 10);
      if (days[key] !== undefined) days[key]++;
    });
    const values = Object.values(days);
    const max = Math.max(...values, 1);
    return { labels, values, max };
  }, [activities]);

  return (
    <DashboardLayout title="Dashboard" noPadding>
      <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.15em] mb-1">
              {tenant?.name || slug}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Overview of your workspace projects, tasks, and team.</p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Projects" value={stats.totalProjects ?? 0} loading={loading} accent="blue" />
          <StatCard label="Total Tasks" value={stats.totalTasks ?? 0} loading={loading} accent="violet" />
          <StatCard label="My Tasks" value={stats.assignedTasks ?? 0} loading={loading} accent="emerald" />
          <StatCard label="Completed" value={stats.completedTasks ?? 0} loading={loading} accent="green" />
          <StatCard label="Overdue" value={stats.overdueTasks ?? 0} loading={loading} accent="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Activity Bar Chart (left 2 cols) ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-bold text-gray-900">Activity (Last 7 Days)</h3>
              <Link to={`/${slug}/activity`} className="text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-wider">View All</Link>
            </div>
            <div className="flex items-end justify-between gap-3 h-[160px]">
              {dailyActivity.labels.map((label, i) => {
                const pct = dailyActivity.max > 0 ? (dailyActivity.values[i] / dailyActivity.max) * 100 : 0;
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{dailyActivity.values[i]}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 4)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="w-full max-w-[40px] bg-blue-100 group-hover:bg-blue-500 rounded-lg transition-colors cursor-default"
                    />
                    <span className="text-[10px] font-medium text-gray-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Activity Breakdown ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Activity Breakdown</h3>
            {actStats.length === 0 ? (
              <p className="text-[12px] text-gray-400 italic py-8 text-center">No activity data yet.</p>
            ) : (
              <div className="space-y-3">
                {actStats.slice(0, 6).map((s: any, i: number) => {
                  const total = actStats.reduce((a: number, b: any) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s._id}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold text-gray-700 capitalize">{s._id?.replace(/_/g, " ").toLowerCase()}</span>
                        <span className="font-bold text-gray-400">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${colors[i % colors.length]}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Recent Projects ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-gray-900">Projects</h3>
              <Link to={`/${slug}/projects`} className="text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-wider">All Projects</Link>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={4} className="px-5 py-4"><div className="h-4 bg-gray-50 animate-pulse rounded" /></td></tr>
                  ))
                ) : projects.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-[12px] text-gray-400">No projects yet.</td></tr>
                ) : (
                  projects.slice(0, 6).map((p, i) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/${slug}/projects/${p._id}`)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${colors[i % colors.length]} flex items-center justify-center text-white text-[11px] font-bold`}>
                            {p.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400">PRJ-{p._id?.slice(-5).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : p.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'COMPLETED' ? 'bg-blue-500' : p.status === 'ON_HOLD' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {p.status?.replace(/_/g, " ") || "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${p.priority === 'HIGH' || p.priority === 'URGENT' ? 'bg-rose-50 text-rose-500' : p.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
                          {p.priority || "Normal"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-gray-400">{fmt(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Team Members ── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-gray-900">Team ({members.length})</h3>
              <Link to={`/${slug}/settings/team`} className="text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-wider">Manage</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="px-5 py-3"><div className="h-8 bg-gray-50 animate-pulse rounded" /></div>
                ))
              ) : members.length === 0 ? (
                <div className="px-5 py-10 text-center text-[12px] text-gray-400">No team members yet.</div>
              ) : (
                members.slice(0, 6).map((m, i) => (
                  <div key={m._id || i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {m.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-900">{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${m.role === 'OWNER' ? 'bg-violet-50 text-violet-600' : m.role === 'ADMIN' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Activity Feed ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-gray-900">Recent Activity</h3>
            <Link to={`/${slug}/activity`} className="text-[11px] font-bold text-blue-600 hover:underline uppercase tracking-wider">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {aL ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-4"><div className="h-6 bg-gray-50 animate-pulse rounded" /></div>
              ))
            ) : activities.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12px] text-gray-400">No recent activity.</div>
            ) : (
              activities.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                    {a.userId?.name?.[0]?.toUpperCase() ?? "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-800">
                      <span className="font-semibold">{a.userId?.name ?? "System"}</span>{" "}
                      <span className="text-gray-500">{a.actionType || a.action || a.description}</span>
                    </p>
                    {a.projectId?.name && <span className="text-[10px] text-gray-400">{a.projectId.name}</span>}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{rel(a.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, loading, accent }: { label: string; value: number; loading: boolean; accent: string }) => {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    green: "bg-green-50 text-green-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-50 animate-pulse rounded" />
          <div className="h-7 w-12 bg-gray-50 animate-pulse rounded" />
        </div>
      ) : (
        <>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${bg[accent] || bg.blue}`}>{label}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;