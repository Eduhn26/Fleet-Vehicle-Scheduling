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

export default function UserDashboard() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      setLoading(true);
      setErrorMsg('');

      try {
        const rentalsRes = await api.get('/rentals/my');

        if (!alive) return;

        const rentalsData = safeArray(rentalsRes?.data?.data);
        setRentals(rentalsData);
      } catch (err) {
        if (!alive) return;
        setErrorMsg(
          getApiErrorMessage(err, 'Não foi possível carregar o dashboard do usuário.')
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

  const recentRentals = useMemo(() => rentals.slice(0, 5), [rentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Meu Dashboard</div>
          <div className="dashboard-subtitle">
            Acompanhe o status das suas reservas e faça novas solicitações.
          </div>
        </div>

        <div className="dashboard-actions">
          <Link className="dashboard-linkBtn" to="/rentals">
            Abrir solicitações
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando dados...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Minhas reservas</div>
              </div>
              <div className="card-kpi">{rentals.length}</div>
              <div className="card-meta">Solicitações registradas no sistema</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Pendentes</div>
                <span className="badge badge-pending">Pending</span>
              </div>
              <div className="card-kpi">{pendingCount}</div>
              <div className="card-meta">Aguardando decisão administrativa</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Aprovadas</div>
                <span className="badge badge-approved">Approved</span>
              </div>
              <div className="card-kpi">{approvedCount}</div>
              <div className="card-meta">Reservas prontas para uso</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Rejeitadas</div>
                <span className="badge badge-rejected">Rejected</span>
              </div>
              <div className="card-kpi">{rejectedCount}</div>
              <div className="card-meta">Solicitações não aprovadas</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Canceladas</div>
                <span className="badge badge-cancelled">Cancelled</span>
              </div>
              <div className="card-kpi">{cancelledCount}</div>
              <div className="card-meta">Reservas encerradas por cancelamento</div>
            </div>

            <div className="card card-wide">
              <div className="card-titleRow">
                <div className="card-title">Últimas solicitações</div>
              </div>

              {recentRentals.length === 0 ? (
                <div className="card-meta">Você ainda não possui solicitações.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Veículo</th>
                        <th>Período</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRentals.map((rental) => (
                        <tr key={rental.id}>
                          <td>
                            {rental?.vehicle?.brand} {rental?.vehicle?.model}
                          </td>
                          <td>
                            {rental.startDate} até {rental.endDate}
                          </td>
                          <td>
                            <span className={`badge badge-${rental.status}`}>
                              {String(rental.status || '').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}