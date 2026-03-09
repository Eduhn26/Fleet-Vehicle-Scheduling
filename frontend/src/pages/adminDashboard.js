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

  if (apiMessage) {
    return apiMessage;
  }

  return fallbackMessage;
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

    return () => {
      alive = false;
    };
  }, []);

  const pendingCount = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const approvedCount = useMemo(() => countByStatus(rentals, 'approved'), [rentals]);
  const rejectedCount = useMemo(() => countByStatus(rentals, 'rejected'), [rentals]);
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
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Frota</div>
              </div>
              <div className="card-kpi">{vehicles.length}</div>
              <div className="card-meta">Veículos cadastrados no sistema</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Pendentes</div>
                <span className="badge badge-pending">Pending</span>
              </div>
              <div className="card-kpi">{pendingCount}</div>
              <div className="card-meta">Solicitações aguardando decisão</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Aprovadas</div>
                <span className="badge badge-approved">Approved</span>
              </div>
              <div className="card-kpi">{approvedCount}</div>
              <div className="card-meta">Reservas confirmadas operacionalmente</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Rejeitadas</div>
                <span className="badge badge-rejected">Rejected</span>
              </div>
              <div className="card-kpi">{rejectedCount}</div>
              <div className="card-meta">Solicitações encerradas por negativa</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Canceladas</div>
                <span className="badge badge-cancelled">Cancelled</span>
              </div>
              <div className="card-kpi">{cancelledCount}</div>
              <div className="card-meta">Reservas canceladas após criação/aprovação</div>
            </div>

            <div className="card card-wide">
              <div className="card-titleRow">
                <div className="card-title">Próximas ações</div>
              </div>

              <div className="card-meta">
                Use a tela de <strong>Veículos</strong> para acompanhar a frota e a tela de
                <strong> Solicitações</strong> para operar approve/reject do fluxo administrativo.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}