import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiGrid,
  FiTool,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';

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

const ANALYTICS_SECTION_IDS = [
  'analytics-overview',
  'analytics-trend',
  'analytics-maintenance',
  'analytics-vehicles',
  'analytics-departments',
  'analytics-mileage',
  'analytics-integrations',
];

function navigateToAnalyticsSection(event, sectionId, setActiveSection) {
  event.preventDefault();

  const target = document.getElementById(sectionId);
  if (!target) return;

  setActiveSection(sectionId);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (window.history?.replaceState) {
    window.history.replaceState(null, '', `#${sectionId}`);
  }
}

function AnalyticsSidebar() {
  const [activeSection, setActiveSection] = useState('analytics-overview');

  useEffect(() => {
    const updateActiveSection = () => {
      const sections = ANALYTICS_SECTION_IDS.map((id) =>
        document.getElementById(id)
      ).filter(Boolean);

      if (sections.length === 0) return;

      const activationLine = 118;
      const eligibleSections = sections.filter(
        (section) => section.getBoundingClientRect().top <= activationLine
      );

      if (eligibleSections.length === 0) {
        setActiveSection('analytics-overview');
        return;
      }

      const highestTop = Math.max(
        ...eligibleSections.map((section) => section.getBoundingClientRect().top)
      );
      const closestSections = eligibleSections.filter(
        (section) =>
          Math.abs(section.getBoundingClientRect().top - highestTop) < 4
      );

      setActiveSection((current) => {
        if (closestSections.some((section) => section.id === current)) {
          return current;
        }

        return closestSections[0]?.id || eligibleSections.at(-1)?.id || current;
      });
    };

    updateActiveSection();

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    const content = document.querySelector('.layout-content-analytics');
    const observer = content
      ? new MutationObserver(updateActiveSection)
      : null;

    observer?.observe(content, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      observer?.disconnect();
    };
  }, []);

  const itemClassName = (sectionId) =>
    `layout-sidebar-item${activeSection === sectionId ? ' is-active' : ''}`;

  return (
    <aside className="layout-analytics-sidebar">
      <NavLink to="/admin" className="layout-sidebar-brand">
        <span className="layout-sidebar-brandBadge">FM</span>
        <span>
          <strong>Fleet Manager</strong>
          <small>Enterprise Vehicle Scheduling</small>
        </span>
      </NavLink>

      <div className="layout-sidebar-scroll">
        <div className="layout-sidebar-group">
          <span className="layout-sidebar-label">Visão geral</span>
          <a
            className={itemClassName('analytics-overview')}
            href="#analytics-overview"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-overview', setActiveSection)
            }
          >
            <FiGrid />
            Visão executiva
          </a>
        </div>

        <div className="layout-sidebar-group">
          <span className="layout-sidebar-label">Análises</span>
          <a
            className={itemClassName('analytics-trend')}
            href="#analytics-trend"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-trend', setActiveSection)
            }
          >
            <FiBarChart2 />
            Evolução das reservas
          </a>
          <a
            className={itemClassName('analytics-maintenance')}
            href="#analytics-maintenance"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-maintenance', setActiveSection)
            }
          >
            <FiTool />
            Manutenção
          </a>
          <a
            className={itemClassName('analytics-vehicles')}
            href="#analytics-vehicles"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-vehicles', setActiveSection)
            }
          >
            <FiTruck />
            Uso da frota
          </a>
          <a
            className={itemClassName('analytics-departments')}
            href="#analytics-departments"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-departments', setActiveSection)
            }
          >
            <FiUsers />
            Demanda por área
          </a>
          <a
            className={itemClassName('analytics-mileage')}
            href="#analytics-mileage"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-mileage', setActiveSection)
            }
          >
            <FiActivity />
            Quilometragem
          </a>
        </div>

        <div className="layout-sidebar-group">
          <span className="layout-sidebar-label">Dados</span>
          <a
            className={itemClassName('analytics-integrations')}
            href="#analytics-integrations"
            onClick={(event) =>
              navigateToAnalyticsSection(event, 'analytics-integrations', setActiveSection)
            }
          >
            <FiFileText />
            Exportação
          </a>
        </div>
      </div>
    </aside>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const admin = isAdmin(user);
  const analyticsMode = admin && location.pathname.startsWith('/admin/analytics');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (analyticsMode) {
    return (
      <div className="layout-shell layout-shell-analytics">
        <AnalyticsSidebar />

        <div className="layout-analytics-workspace">
          <header className="layout-analytics-topbar">
            <nav className="layout-analytics-topnav" aria-label="Main navigation">
              <NavLink to="/admin" end className={linkClassName}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/vehicles" className={linkClassName}>
                Veículos
              </NavLink>
              <NavLink to="/admin/rentals" className={linkClassName}>
                Solicitações
              </NavLink>
              <NavLink to="/admin/analytics" className={linkClassName}>
                Inteligência
              </NavLink>
            </nav>

            <div className="layout-user layout-user-light">
              <div className="layout-userMeta">
                <span className="layout-userLabel">Administrador</span>
                <span className="layout-username">{user?.name || 'Usuário'}</span>
              </div>

              <div className="layout-avatar" aria-hidden="true">
                {getInitials(user?.name)}
              </div>

              <button
                type="button"
                className="layout-logout layout-logout-light"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          </header>

          <main className="layout-main layout-main-analytics">
            <div className="layout-content layout-content-analytics">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                  <NavLink to="/admin/analytics" className={linkClassName}>
                    Inteligência
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
