import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/dashboard.css';
import AdminRentalTable from "../components/AdminRentalTable";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function countByStatus(items, status) {
  return safeArray(items).filter((r) => r?.status === status).length;
}

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg('');

      try {
        const [vehiclesRes, rentalsRes] = await Promise.all([
          // NOTE: baseURL do api.js já aponta para /api, então aqui usamos rotas sem prefixo /api
          api.get('/vehicles'),
          api.get('/rentals'),
        ]);

        if (!alive) return;

        setVehicles(safeArray(vehiclesRes?.data));
        setRentals(safeArray(rentalsRes?.data?.data));
      } catch (err) {
        if (!alive) return;
        setErrorMsg('Não foi possível carregar os dados do dashboard.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const pendingCount = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const approvedCount = useMemo(() => countByStatus(rentals, 'approved'), [rentals]);
  const rejectedCount = useMemo(() => countByStatus(rentals, 'rejected'), [rentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Dashboard (Admin)</div>
          <div className="dashboard-subtitle">Visão geral do sistema</div>
        </div>

        <div className="dashboard-actions">
          <Link className="dashboard-linkBtn" to="/vehicles">
            Gerenciar veículos
          </Link>
          <Link className="dashboard-linkBtn" to="/rentals">
            Ver solicitações
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando dados…</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-titleRow">
              <div className="card-title">Veículos</div>
            </div>
            <div className="card-kpi">{vehicles.length}</div>
            <div className="card-meta">Total cadastrados</div>
          </div>

          <div className="card">
            <div className="card-titleRow">
              <div className="card-title">Pendentes</div>
              <span className="badge badge-pending">PENDING</span>
            </div>
            <div className="card-kpi">{pendingCount}</div>
            <div className="card-meta">Aguardando decisão</div>
          </div>

          <div className="card">
            <div className="card-titleRow">
              <div className="card-title">Aprovadas</div>
              <span className="badge badge-approved">APPROVED</span>
            </div>
            <div className="card-kpi">{approvedCount}</div>
            <div className="card-meta">Reservas confirmadas</div>
          </div>

          <div className="card card-wide">
            <div className="card-titleRow">
              <div className="card-title">Rejeitadas</div>
              <span className="badge badge-rejected">REJECTED</span>
            </div>
            <div className="card-kpi">{rejectedCount}</div>
            <div className="card-meta">Solicitações negadas</div>
          </div>
        </div>
      )}
      <AdminRentalTable />
    </div>
  );
}