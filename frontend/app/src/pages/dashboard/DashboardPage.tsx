import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import {
  useActivityFeed,
  useSubscriptionHistory,
  useAuditLogs,
  useAuditStats,
} from "../../hooks/useDashboard";
import { useProjects } from "../../hooks/useProjects";

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} />
);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const formatRelative = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  loading?: boolean;
}

const StatCard = ({ label, value, sub, icon, accent = "bg-gray-100 text-gray-600", loading }: StatCardProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-16 mt-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value ?? "—"}</p>
      )}
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

// ── Mini bar chart ────────────────────────────────────────────────────────────
const MiniBar = ({ data, label }: { data: number[]; label: string }) => {
  const max = Math.max(...data, 1);
  return (
    <div>
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-gray-900 rounded-t-md transition-all duration-500"
              style={{ height: `${Math.max((v / max) * 72, 4)}px` }}
            />
            <span className="text-[9px] text-gray-300">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ text, color = "gray" }: { text: string; color?: string }) => {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[color] ?? colors.gray}`}>
      {text}
    </span>
  );
};

const planColor = (plan?: string) => {
  if (!plan) return "gray";
  const p = plan.toUpperCase();
  if (p.includes("PRO")) return "blue";
  if (p.includes("ENT")) return "green";
  return "gray";
};

// ── Dashboard page ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, tenant } = useAuthStore();
  const { data: activityData, isLoading: activityLoading } = useActivityFeed();
  const { data: auditData, isLoading: auditLoading } = useAuditLogs();
  const { data: auditStatsData, isLoading: auditStatsLoading } = useAuditStats();
  const { data: subHistory, isLoading: subLoading } = useSubscriptionHistory();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();

  const activities: any[] = activityData?.activities ?? activityData ?? [];
  const projects: any[] = projectsData?.projects ?? projectsData ?? [];
  const auditLogs: any[] = auditData?.logs ?? auditData?.auditLogs ?? auditData ?? [];
  const auditStats = auditStatsData;
  const subData = subHistory?.subscription ?? subHistory;
  const currentPlan = subData?.planId?.name ?? subData?.plan?.name ?? "Free";
  const subStatus = subData?.status ?? "ACTIVE";
  const subEnd = subData?.endDate ? formatDate(subData.endDate) : "—";

  // Build last-7-days activity bar from feed
  const activityByDay = Array(7).fill(0);
  activities.slice(0, 50).forEach((a: any) => {
    const d = new Date(a.createdAt ?? a.timestamp);
    const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (daysAgo < 7) activityByDay[6 - daysAgo]++;
  });

  const totalActivities = activities.length;
  const totalProjects = projectsData?.total ?? projects.length;
  const totalAuditEvents = auditStats?.total ?? auditLogs.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout title="Dashboard">
      {/* ── Greeting ── */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {greeting}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h2>
        <p className="text-[13px] text-gray-400 mt-0.5">
          Here's what's happening in <span className="font-semibold text-gray-600">{tenant?.name ?? "your workspace"}</span> today.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Projects"
          value={totalProjects}
          sub="Active workspace"
          loading={projectsLoading}
          accent="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
        />
        <StatCard
          label="Activities"
          value={totalActivities}
          sub="All time events"
          loading={activityLoading}
          accent="bg-purple-50 text-purple-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          }
        />
        <StatCard
          label="Audit Events"
          value={totalAuditEvents}
          sub="OWNER / ADMIN visible"
          loading={auditLoading}
          accent="bg-amber-50 text-amber-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
        />
        <StatCard
          label="Plan"
          value={currentPlan}
          sub={`Renews ${subEnd}`}
          loading={subLoading}
          accent="bg-green-50 text-green-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity chart + feed */}
        <div className="lg:col-span-2 space-y-4">

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900">Activity — Last 7 days</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Team events across all projects</p>
              </div>
              <Badge text={activityLoading ? "…" : `${totalActivities} total`} color="gray" />
            </div>
            {activityLoading ? (
              <div className="flex items-end gap-1.5 h-20">
                {Array(7).fill(0).map((_, i) => (
                  <div key={i} className="flex-1 bg-gray-100 rounded-t-md animate-pulse" style={{ height: `${30 + Math.random() * 50}px` }} />
                ))}
              </div>
            ) : (
              <MiniBar data={activityByDay} label="Events per day" />
            )}
          </div>

          {/* Recent activity feed */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Recent Activity</h3>
              <span className="text-[11px] text-gray-400">Auto-refreshes every 30s</span>
            </div>
            {activityLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[13px] text-gray-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activities.slice(0, 20).map((a: any, i: number) => (
                  <div key={a._id ?? i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {a.userId?.name?.[0]?.toUpperCase() ?? a.user?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-700 leading-snug">
                        <span className="font-semibold">{a.userId?.name ?? a.user ?? "Someone"}</span>{" "}
                        {a.action ?? a.description ?? a.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelative(a.createdAt ?? a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Projects list */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Projects</h3>
            {projectsLoading ? (
              <div className="space-y-2.5">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : projects.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-6">No projects yet</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {projects.slice(0, 10).map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {p.name?.[0]?.toUpperCase() ?? "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.taskCount ?? 0} tasks</p>
                    </div>
                    <Badge
                      text={p.status ?? "ACTIVE"}
                      color={p.status === "COMPLETED" ? "green" : p.status === "ON_HOLD" ? "yellow" : "gray"}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscription card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Subscription</h3>
            {subLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">Current plan</span>
                  <Badge text={currentPlan} color={planColor(currentPlan)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">Status</span>
                  <Badge
                    text={subStatus}
                    color={subStatus === "ACTIVE" ? "green" : subStatus === "SUSPENDED" ? "red" : "yellow"}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">Renews</span>
                  <span className="text-[12px] font-semibold text-gray-700">{subEnd}</span>
                </div>
                {subData?.autoRenew !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Auto-renew</span>
                    <Badge text={subData.autoRenew ? "On" : "Off"} color={subData.autoRenew ? "green" : "gray"} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit stats */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-sm">
            <h3 className="text-[14px] font-semibold mb-3">Audit Summary</h3>
            {auditStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-3/4 bg-gray-700" />
                <Skeleton className="h-3 w-2/3 bg-gray-700" />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">Total events</span>
                  <span className="font-bold">{auditStats?.total ?? auditLogs.length}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">Today</span>
                  <span className="font-bold">{auditStats?.today ?? "—"}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">This week</span>
                  <span className="font-bold">{auditStats?.thisWeek ?? "—"}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-500">
                  Visible to OWNER &amp; ADMIN only
                </div>
              </div>
            )}
          </div>

          {/* Recent audit logs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Recent Audit Logs</h3>
            {auditLoading ? (
              <div className="space-y-2.5">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-9" />)}
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-6">No audit logs yet</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auditLogs.slice(0, 10).map((log: any, i: number) => (
                  <div key={log._id ?? i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-700 truncate">
                        {log.action ?? log.event ?? log.type ?? "Event"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {log.userId?.name ?? log.performedBy ?? "System"} · {formatRelative(log.createdAt ?? log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;