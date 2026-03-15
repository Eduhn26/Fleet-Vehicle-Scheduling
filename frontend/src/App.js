import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/login';
import AdminDashboard from './pages/adminDashboard';
import AdminRentals from './pages/adminRentals';
import AdminVehicles from './pages/adminVehicles';
import UserDashboard from './pages/userDashboard';
import Rentals from './pages/rentals';

import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

/*
ENGINEERING NOTE:
HomeRedirect resolves the initial landing page from the authenticated role
so users always enter the correct dashboard from the root URL.
*/
function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role || '').trim();
  if (role === 'admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/user" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/vehicles" element={<AdminVehicles />} />
            <Route path="/admin/rentals" element={<AdminRentals />} />
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/rentals" element={<Rentals />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}