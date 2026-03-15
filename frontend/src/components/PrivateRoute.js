import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
ENGINEERING NOTE:
PrivateRoute protects authenticated screens and optionally restricts
access by role before nested routes are rendered.
*/
export default function PrivateRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = String(user.role || '').trim();
    if (!allowedRoles.includes(role)) return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}