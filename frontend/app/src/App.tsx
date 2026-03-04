import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/auth/Home';
import ProtectedRoute from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AcceptInvite from './pages/auth/AcceptInvite';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectPage from './pages/projects/ProjectPage';
import ProjectBoard from './pages/projects/ProjectBoard';
import ProjectTasks from './pages/projects/ProjectTasks';
import ProjectMembers from './pages/projects/ProjectMembers';
import ActivityPage from './pages/activity/ActivityPage';
import AuditPage from './pages/audit/AuditPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import PaymentPage from './pages/subscription/PaymentPage';
import ChatPage from './pages/chat/ChatPage';
import SettingsLayout from './pages/settings/SettingsLayout';
import AccountSettingsPage from './pages/settings/AccountSettingsPage';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import MembersPage from './pages/members/MembersPage';
import ProjectTeamsPage from './pages/settings/ProjectTeamsPage';
import ProjectMapDetailPage from './pages/settings/ProjectMapDetailPage';
import TenantRoute from './router/TenantRoute';
import RoleRoute from './router/RoleRoute';
import { Navigate } from 'react-router-dom';
import { AlertProvider } from './components/ui/AlertProvider';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/accept-invite' element={<AcceptInvite />} />
        <Route path='/:slug' element={<ProtectedRoute />}>
          <Route element={<TenantRoute />}>
            {/* Dashboard */}
            <Route index element={<Navigate to="dashboard" />} />
            <Route path='dashboard' element={<DashboardPage />} />

            {/* Projects */}
            <Route path='projects' element={<ProjectsPage />} />
            <Route path='projects/:projectId' element={<ProjectPage />}>
              <Route index element={<Navigate to="board" replace />} />
              <Route path="board" element={<ProjectBoard />} />
              <Route path="tasks" element={<ProjectTasks />} />
              <Route path="members" element={<ProjectMembers />} />
            </Route>

            {/* Activity & Audit & Chat & Notifications */}
            <Route path='activity' element={<ActivityPage />} />
            <Route path='chat' element={<ChatPage />} />

            {/* Settings */}
            <Route path='settings' element={<SettingsLayout />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path='account' element={<AccountSettingsPage />} />
              <Route path='subscription' element={<SubscriptionPage />} />
              <Route path='subscription/checkout' element={<PaymentPage />} />
              {/* Role-guarded: OWNER / ADMIN only */}
              <Route element={<RoleRoute allowedRoles={["OWNER", "ADMIN"]} />}>
                <Route path='team' element={<MembersPage />} />
                <Route path='projects-team' element={<ProjectTeamsPage />} />
                <Route path='projects-team/:projectId' element={<ProjectMapDetailPage />} />
                <Route path='audit' element={<AuditPage />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
      <AlertProvider />
    </BrowserRouter>
  )
}

export default App