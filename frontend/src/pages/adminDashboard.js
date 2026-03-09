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

function StatCard({ title, value, label, badge, accent, onClick }) {
  return (
    <div
      className="card"
      style={accent ? { borderLeft: `4px solid ${accent}`, cursor: onClick ? 'pointer' : 'default' } : { cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="card-titleRow">
        <div className="card-title">{title}</div>
        {badge}
      </div>
      <div className="card-kpi">{value}</div>
      <div className="card-meta">{label}</div>
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
          />
          <StatCard
            title="Pendentes"
            value={pendingCount}
            label="Solicitações aguardando decisão"
            accent="#f59e0b"
            badge={<span className="badge badge-pending">Pending</span>}
          />
          <StatCard
            title="Aprovadas"
            value={approvedCount}
            label="Reservas confirmadas operacionalmente"
            accent="#10b981"
            badge={<span className="badge badge-approved">Approved</span>}
          />
          <StatCard
            title="Rejeitadas"
            value={rejectedCount}
            label="Solicitações encerradas por negativa"
            accent="#ef4444"
            badge={<span className="badge badge-rejected">Rejected</span>}
          />
          <StatCard
            title="Canceladas"
            value={cancelledCount}
            label="Reservas canceladas após criação/aprovação"
            badge={<span className="badge badge-cancelled">Cancelled</span>}
          />

          <div className="card card-wide">
            <div className="card-titleRow">
              <div className="card-title">Próximas ações</div>
            </div>
            <div className="card-meta">
              Use a tela de <strong>Veículos</strong> para acompanhar a frota e a tela de{' '}
              <strong>Solicitações</strong> para operar approve/reject do fluxo administrativo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}