import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AdminRentalTable from '../components/AdminRentalTable';
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

/*
ENGINEERING NOTE:
This page frames the request queue as an operational workspace, not just
a raw table. The top summary gives urgency before the detailed rows.
*/
export default function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRentals = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/rentals');
      setRentals(safeArray(res?.data?.data));
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível carregar as solicitações.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const pendingCount = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const returnPendingCount = useMemo(
    () => countByStatus(rentals, 'return_pending'),
    [rentals]
  );
  const completedCount = useMemo(() => countByStatus(rentals, 'completed'), [rentals]);

  return (
    <div className="dashboard">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-text">
          <span className="section-kicker">Admin queue</span>
          <h1 className="dashboard-hero-title">Solicitações</h1>
          <p className="dashboard-hero-sub">
            Aprove, rejeite e conclua devoluções com foco no que exige ação imediata.
          </p>
        </div>

        <div className="dashboard-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{pendingCount}</span>
            <span className="hero-stat-label">Pendentes</span>
          </div>

          <div className="hero-stat">
            <span className="hero-stat-value">{returnPendingCount}</span>
            <span className="hero-stat-label">Devoluções</span>
          </div>

          <div className="hero-stat">
            <span className="hero-stat-value">{completedCount}</span>
            <span className="hero-stat-label">Concluídas</span>
          </div>
        </div>
      </section>

      {loading ? <div className="alert alert-info">Carregando solicitações...</div> : null}
      {!loading && errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      {!loading && !errorMsg ? (
        <>
          <section className="metrics-grid metrics-grid-tight">
            <div className="metric-card amber">
              <div className="metric-header">
                <span className="metric-label">Pendentes</span>
                <span className="badge badge-pending">Aprovação</span>
              </div>

              <div className="metric-value">{pendingCount}</div>
              <div className="metric-desc">
                Solicitações aguardando decisão administrativa inicial.
              </div>
            </div>

            <div className="metric-card amber">
              <div className="metric-header">
                <span className="metric-label">Devoluções</span>
                <span className="badge badge-devolucao">Retorno</span>
              </div>

              <div className="metric-value">{returnPendingCount}</div>
              <div className="metric-desc">
                Reservas aguardando conferência final da devolução.
              </div>
            </div>

            <div className="metric-card green">
              <div className="metric-header">
                <span className="metric-label">Concluídas</span>
                <span className="badge badge-approved">Histórico</span>
              </div>

              <div className="metric-value">{completedCount}</div>
              <div className="metric-desc">
                Reservas encerradas com o fluxo completo finalizado.
              </div>
            </div>
          </section>

          <AdminRentalTable rentals={rentals} onActionComplete={loadRentals} />
        </>
      ) : null}
    </div>
  );
}