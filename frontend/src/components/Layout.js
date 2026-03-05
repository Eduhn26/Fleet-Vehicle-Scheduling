import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

function isAdmin(user) {
  return String(user?.role || '').trim() === 'admin';
}

function linkClassName({ isActive }) {
  return `layout-link${isActive ? ' layout-link-active' : ''}`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const admin = isAdmin(user);

  return (
    <div className="layout-shell">
      <header className="layout-header">
        <div className="layout-brand">
          <div className="layout-title">Fleet Manager</div>

          <nav className="layout-nav">
            {admin ? (
              <>
                <NavLink to="/admin" className={linkClassName}>
                  Dashboard
                </NavLink>
                <NavLink to="/vehicles" className={linkClassName}>
                  Veículos
                </NavLink>
                <NavLink to="/rentals" className={linkClassName}>
                  Solicitações
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/user" className={linkClassName}>
                  Dashboard
                </NavLink>
                <NavLink to="/rentals" className={linkClassName}>
                  Minhas solicitações
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="layout-user">
          <span className="layout-username">{user?.name || 'Usuário'}</span>
          <button type="button" className="layout-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}