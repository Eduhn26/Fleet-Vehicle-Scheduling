import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/dashboard.css';

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

/* ── SVG Icons ──────────────────────────────────────────────── */
const IconFleet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconSlash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

/* ── StatCard ───────────────────────────────────────────────── */
function StatCard({ title, value, label, badge, accent, icon, iconBg, iconColor, onClick }) {
  return (
    <div
      className="card"
      style={accent ? { borderTop: `3px solid ${accent}`, cursor: onClick ? 'pointer' : 'default' } : { cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="card-titleRow">
        <div className="card-title">{title}</div>
        {icon && (
          <div className="card-iconWrapper" style={{ background: iconBg, color: iconColor }}>
            {icon}
          </div>
        )}
        {badge && !icon && badge}
      </div>
      <div className="card-kpi">{value}</div>
      <div className="card-meta">{label}</div>
      {badge && icon && <div style={{ marginTop: 12 }}>{badge}</div>}
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

        const vehiclesData = safeArray(vehiclesRes?.data?.data ?? vehiclesRes?.data);
        const rentalsData = safeArray(rentalsRes?.data?.data);

        setVehicles(vehiclesData);
        setRentals(rentalsData);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(
          getApiErrorMessage(err, 'Não foi possível carregar o dashboard administrativo.')
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadDashboard();
    return () => { alive = false; };
  }, []);

  const pendingCount   = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const approvedCount  = useMemo(() => countByStatus(rentals, 'approved'), [rentals]);
  const rejectedCount  = useMemo(() => countByStatus(rentals, 'rejected'), [rentals]);
  const cancelledCount = useMemo(() => countByStatus(rentals, 'cancelled'), [rentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Dashboard Administrativo</div>
          <div className="dashboard-subtitle">
            Visão geral da frota, reservas e fila operacional.
          </div>
        </div>
        <div className="dashboard-actions">
          <Link className="dashboard-linkBtn" to="/admin/vehicles">
            Gerenciar veículos
          </Link>
          <Link className="dashboard-linkBtn" to="/admin/rentals">
            Ver solicitações
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando indicadores...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <div className="dashboard-grid">
          <StatCard
            title="Frota"
            value={vehicles.length}
            label="Veículos cadastrados no sistema"
            icon={<IconFleet />}
            iconBg="rgba(37, 99, 235, 0.1)"
            iconColor="#2563eb"
          />
          <StatCard
            title="Pendentes"
            value={pendingCount}
            label="Solicitações aguardando decisão"
            accent="#f59e0b"
            icon={<IconClock />}
            iconBg="rgba(245, 158, 11, 0.1)"
            iconColor="#d97706"
            badge={<span className="badge badge-pending">Pendente</span>}
          />
          <StatCard
            title="Aprovadas"
            value={approvedCount}
            label="Reservas confirmadas operacionalmente"
            accent="#059669"
            icon={<IconCheck />}
            iconBg="rgba(5, 150, 105, 0.1)"
            iconColor="#059669"
            badge={<span className="badge badge-approved">Aprovado</span>}
          />
          <StatCard
            title="Rejeitadas"
            value={rejectedCount}
            label="Solicitações encerradas por negativa"
            accent="#dc2626"
            icon={<IconX />}
            iconBg="rgba(220, 38, 38, 0.1)"
            iconColor="#dc2626"
            badge={<span className="badge badge-rejected">Rejeitado</span>}
          />
          <StatCard
            title="Canceladas"
            value={cancelledCount}
            label="Reservas canceladas após criação/aprovação"
            icon={<IconSlash />}
            iconBg="rgba(100, 116, 139, 0.1)"
            iconColor="#64748b"
            badge={<span className="badge badge-cancelled">Cancelado</span>}
          />

          <div className="card card-wide">
            <div className="card-titleRow">
              <div className="card-title">Próximas ações</div>
            </div>
            <div className="card-meta">
              Use a tela de <strong>Veículos</strong> para acompanhar a frota e a tela de{' '}
              <strong>Solicitações</strong> para operar aprovação/rejeição do fluxo administrativo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}