import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/auth/Home';
import ProtectedRoute from './router/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path='/:slug/dashboard' element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App