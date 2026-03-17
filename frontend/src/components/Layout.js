import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';

function isAdmin(user) {
  return String(user?.role || '').trim() === 'admin';
}

function linkClassName({ isActive }) {
  return `layout-link${isActive ? ' layout-link-active' : ''}`;
}

function getInitials(name) {
  if (!name) return '?';

  return name
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0].toUpperCase())
    .join('');
}

/*
ENGINEERING NOTE:
This shared shell is the fastest way to lift the product perception.
By improving navigation, spacing and identity here, every authenticated
screen inherits a more premium structure without duplicating UI work.
*/
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const admin = isAdmin(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-shell">
      <header className="layout-header">
        <div className="layout-container">
          <div className="layout-brandBlock">
            <NavLink to={admin ? '/admin' : '/user'} className="layout-brand">
              <span className="layout-brandBadge">FM</span>

              <div className="layout-brandText">
                <span className="layout-title">Fleet Manager</span>
                <span className="layout-subtitle">
                  Enterprise Vehicle Scheduling
                </span>
              </div>
            </NavLink>

            <nav className="layout-nav" aria-label="Main navigation">
              {admin ? (
                <>
                  <NavLink to="/admin" end className={linkClassName}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/vehicles" className={linkClassName}>
                    Veículos
                  </NavLink>
                  <NavLink to="/admin/rentals" className={linkClassName}>
                    Solicitações
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/user" end className={linkClassName}>
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
            <div className="layout-userMeta">
              <span className="layout-userLabel">
                {admin ? 'Administrator' : 'User workspace'}
              </span>
              <span className="layout-username">{user?.name || 'Usuário'}</span>
            </div>

            <div className="layout-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>

            <button
              type="button"
              className="layout-logout"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}