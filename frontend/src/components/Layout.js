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
import '../styles/layoutSidebar.css';
import '../styles/layoutMotion.css';

function isAdmin(user) {
  return String(user?.role || '').trim() === 'admin';
}

function linkClassName({ isActive }) {
  return `layout-link${isActive ? ' layout-link-active' : ''}`;
}

function sidebarRouteClassName({ isActive }) {
  return `layout-sidebar-item layout-sidebar-route${isActive ? ' is-active' : ''}`;
}

function getInitials(name) {
  if (!name) return '?';

  return name
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0].toUpperCase())
    .join('');
}

function getPageTitle(pathname, admin) {
  if (!admin) {
    if (pathname.startsWith('/rentals')) return 'Minhas solicitações';
    return 'Meu dashboard';
  }

  if (pathname.startsWith('/admin/vehicles')) return 'Gestão de veículos';
  if (pathname.startsWith('/admin/rentals')) return 'Gestão de solicitações';
  if (pathname.startsWith('/admin/analytics')) return 'Inteligência de Frota';

  return 'Dashboard Administrativo';
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

function AnalyticsSectionLink({
  sectionId,
  activeSection,
  setActiveSection,
  icon: Icon,
  children,
}) {
  const active = activeSection === sectionId;

  return (
    <a
      className={`layout-sidebar-item layout-sidebar-subitem${
        active ? ' is-active' : ''
      }`}
      href={`#${sectionId}`}
      onClick={(event) =>
        navigateToAnalyticsSection(event, sectionId, setActiveSection)
      }
    >
      <Icon />
      {children}
    </a>
  );
}

function PrimaryNavigation({ admin, mobile = false }) {
  const className = mobile ? linkClassName : sidebarRouteClassName;

  if (admin) {
    return (
      <>
        <NavLink to="/admin" end className={className}>
          {mobile ? null : <FiGrid />}
          Dashboard
        </NavLink>

        <NavLink to="/admin/vehicles" className={className}>
          {mobile ? null : <FiTruck />}
          Veículos
        </NavLink>

        <NavLink to="/admin/rentals" className={className}>
          {mobile ? null : <FiFileText />}
          Solicitações
        </NavLink>

        <NavLink to="/admin/analytics" className={className}>
          {mobile ? null : <FiBarChart2 />}
          Inteligência
        </NavLink>
      </>
    );
  }

  return (
    <>
      <NavLink to="/user" end className={className}>
        {mobile ? null : <FiGrid />}
        Dashboard
      </NavLink>

      <NavLink to="/rentals" className={className}>
        {mobile ? null : <FiFileText />}
        Minhas solicitações
      </NavLink>
    </>
  );
}

function AppSidebar({ admin, analyticsMode }) {
  const [activeSection, setActiveSection] = useState('analytics-overview');

  useEffect(() => {
    if (!analyticsMode) return undefined;

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
  }, [analyticsMode]);

  return (
    <aside className="layout-analytics-sidebar">
      <NavLink
        to={admin ? '/admin' : '/user'}
        className="layout-sidebar-brand"
      >
        <span className="layout-sidebar-brandBadge">FM</span>
        <span>
          <strong>Fleet Manager</strong>
          <small>Enterprise Vehicle Scheduling</small>
        </span>
      </NavLink>

      <div className="layout-sidebar-scroll">
        <div className="layout-sidebar-group">
          <span className="layout-sidebar-label">Visão geral</span>

          {admin ? (
            <NavLink to="/admin" end className={sidebarRouteClassName}>
              <FiGrid />
              Dashboard
            </NavLink>
          ) : (
            <NavLink to="/user" end className={sidebarRouteClassName}>
              <FiGrid />
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="layout-sidebar-group">
          <span className="layout-sidebar-label">Operação</span>

          {admin ? (
            <>
              <NavLink
                to="/admin/vehicles"
                className={sidebarRouteClassName}
              >
                <FiTruck />
                Veículos
              </NavLink>

              <NavLink
                to="/admin/rentals"
                className={sidebarRouteClassName}
              >
                <FiFileText />
                Solicitações
              </NavLink>
            </>
          ) : (
            <NavLink to="/rentals" className={sidebarRouteClassName}>
              <FiFileText />
              Minhas solicitações
            </NavLink>
          )}
        </div>

        {admin ? (
          <div className="layout-sidebar-group">
            <span className="layout-sidebar-label">Dados</span>

            <NavLink
              to="/admin/analytics"
              className={sidebarRouteClassName}
            >
              <FiBarChart2 />
              Inteligência
            </NavLink>
          </div>
        ) : null}

        {analyticsMode ? (
          <div className="layout-sidebar-group layout-sidebar-contextGroup">
            <span className="layout-sidebar-label">Nesta análise</span>

            <AnalyticsSectionLink
              sectionId="analytics-overview"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiGrid}
            >
              Visão executiva
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-trend"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiBarChart2}
            >
              Evolução das reservas
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-maintenance"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiTool}
            >
              Manutenção
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-vehicles"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiTruck}
            >
              Uso da frota
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-departments"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiUsers}
            >
              Demanda por área
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-mileage"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiActivity}
            >
              Quilometragem
            </AnalyticsSectionLink>

            <AnalyticsSectionLink
              sectionId="analytics-integrations"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              icon={FiFileText}
            >
              Exportação
            </AnalyticsSectionLink>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const admin = isAdmin(user);
  const analyticsMode =
    admin && location.pathname.startsWith('/admin/analytics');
  const pageTitle = getPageTitle(location.pathname, admin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-shell layout-shell-analytics layout-shell-unified">
      <AppSidebar admin={admin} analyticsMode={analyticsMode} />

      <div className="layout-analytics-workspace layout-unified-workspace">
        <header className="layout-analytics-topbar layout-unified-topbar">
          <div className="layout-workspace-context">
            <span className="layout-workspace-kicker">
              {admin ? 'Área administrativa' : 'Área do usuário'}
            </span>
            <strong className="layout-workspace-title">{pageTitle}</strong>
          </div>

          <nav
            className="layout-mobile-topnav"
            aria-label="Navegação principal"
          >
            <PrimaryNavigation admin={admin} mobile />
          </nav>

          <div className="layout-user layout-user-light">
            <div className="layout-userMeta">
              <span className="layout-userLabel">
                {admin ? 'Administrador' : 'Usuário'}
              </span>
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

        <main
          className={`layout-main layout-main-analytics layout-main-unified${
            analyticsMode ? ' is-analytics' : ''
          }`}
        >
          <div
            className={`layout-content${
              analyticsMode
                ? ' layout-content-analytics'
                : ' layout-content-unified'
            }`}
          >
            <div className="layout-route-stage" key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
