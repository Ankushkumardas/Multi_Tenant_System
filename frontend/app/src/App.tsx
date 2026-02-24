import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/auth/Home';
import ProtectedRoute from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AcceptInvite from './pages/auth/AcceptInvite';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectPage from './pages/projects/ProjectPage';
import VerifyEmail from './pages/auth/VerifyEmail';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/accept-invite' element={<AcceptInvite />} />
        <Route element={<ProtectedRoute />}>
          <Route path='/:slug/dashboard' element={<DashboardPage />} />
          <Route path='/:slug/projects' element={<ProjectsPage />} />
          <Route path='/:slug/projects/:projectId' element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App