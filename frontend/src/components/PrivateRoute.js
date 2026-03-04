import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = String(user.role || '').trim();
    if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}