import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/dashboard.css';

// NOTE: Admin dashboard overview for fleet health, metrics and shortcut actions.
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function countByStatus(items, status) {
  return safeArray(items).filter((item) => item?.status === status).length;
}

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── SVG Icons ──────────────────────────────────────────────── */
const IconFleet = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 10h14M3 10V7l2-4h6l2 4v3"/>
    <circle cx="4.5" cy="12" r="1.5"/>
    <circle cx="11.5" cy="12" r="1.5"/>
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M8 5v3l2 1"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M5 8l2 2 4-4"/>
  </svg>
);

const IconReturn = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8H12M4 8l3-3M4 8l3 3"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M6 6l4 4M10 6l-4 4"/>
  </svg>
);

const IconSlash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" strokeDasharray="3 2"/>
    <path d="M6 8h4"/>
  </svg>
);

const IconVehicles = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="12" height="9" rx="1.5"/>
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 5h12M2 8h8"/>
  </svg>
);

/* ── MetricCard ─────────────────────────────────────────────── */
function MetricCard({ label, value, desc, badge, colorClass, icon }) {
  return (
    <div className={`metric-card ${colorClass || ''}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-desc">{desc}</div>
      {badge && <div style={{ marginTop: 8 }}>{badge}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [vehiclesRes, rentalsRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/rentals'),
        ]);

        if (!alive) return;

        setVehicles(safeArray(vehiclesRes?.data?.data ?? vehiclesRes?.data));
        setRentals(safeArray(rentalsRes?.data?.data));
      } catch (err) {
        if (!alive) return;
        setErrorMsg(getApiErrorMessage(err, 'Não foi possível carregar o dashboard.'));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadDashboard();
    return () => { alive = false; };
  }, []);

  const pendingCount       = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const approvedCount      = useMemo(() => countByStatus(rentals, 'approved'), [rentals]);
  const returnPendingCount = useMemo(() => countByStatus(rentals, 'return_pending'), [rentals]);
  const rejectedCount      = useMemo(() => countByStatus(rentals, 'rejected'), [rentals]);
  const cancelledCount     = useMemo(() => countByStatus(rentals, 'cancelled'), [rentals]);
  const rentedCount        = useMemo(() => countByStatus(rentals, 'approved'), [rentals]);

  return (
    <div className="dashboard">

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <h1 className="dashboard-hero-title">Dashboard Administrativo</h1>
          <p className="dashboard-hero-sub">
            Visão geral da frota, reservas e fila operacional · {todayLabel()}
          </p>
        </div>

        <div className="dashboard-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{vehicles.length}</span>
            <span className="hero-stat-label">Frota</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{rentedCount}</span>
            <span className="hero-stat-label">Em uso</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{pendingCount}</span>
            <span className="hero-stat-label">Pendentes</span>
          </div>
        </div>

        <div className="dashboard-hero-actions">
          <Link className="btn btn-secondary btn-sm" to="/admin/vehicles">
            <IconVehicles /> Gerenciar veículos
          </Link>
          <Link className="btn btn-primary btn-sm" to="/admin/rentals">
            <IconList /> Ver solicitações
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando indicadores...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Frota"
              value={vehicles.length}
              desc="Veículos cadastrados"
              colorClass="blue"
              icon={<IconFleet />}
            />
            <MetricCard
              label="Pendentes"
              value={pendingCount}
              desc="Aguardando decisão"
              colorClass="amber"
              icon={<IconClock />}
              badge={<span className="badge badge-pending">Pendente</span>}
            />
            <MetricCard
              label="Aprovadas"
              value={approvedCount}
              desc="Reservas confirmadas"
              colorClass="green"
              icon={<IconCheck />}
              badge={<span className="badge badge-approved">Aprovado</span>}
            />
            <MetricCard
              label="Devoluções"
              value={returnPendingCount}
              desc="Aguardando confirmação"
              colorClass="blue"
              icon={<IconReturn />}
              badge={<span className="badge badge-devolucao">Devolução</span>}
            />
            <MetricCard
              label="Rejeitadas"
              value={rejectedCount}
              desc="Solicitações negadas"
              colorClass="red"
              icon={<IconX />}
              badge={<span className="badge badge-rejeitado">Rejeitado</span>}
            />
            <MetricCard
              label="Canceladas"
              value={cancelledCount}
              desc="Reservas canceladas"
              colorClass="gray"
              icon={<IconSlash />}
              badge={<span className="badge badge-cancelado">Cancelado</span>}
            />
          </div>

          <div className="next-actions-card">
            <span>
              <strong>Próximas ações:</strong>{' '}
              Use a tela de{' '}
              <Link to="/admin/vehicles">Veículos</Link>{' '}
              para acompanhar a frota e a tela de{' '}
              <Link to="/admin/rentals">Solicitações</Link>{' '}
              para operar aprovação, rejeição e confirmação das devoluções.
            </span>
          </div>
        </>
      )}
    </div>
  );
}