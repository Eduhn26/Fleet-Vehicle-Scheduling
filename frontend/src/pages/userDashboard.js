import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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

function getStatusBadgeClass(status) {
  if (status === 'approved') return 'badge badge-aprovado';
  if (status === 'rejected') return 'badge badge-rejeitado';
  if (status === 'cancelled') return 'badge badge-cancelado';
  if (status === 'completed') return 'badge badge-concluido';
  if (status === 'return_pending') return 'badge badge-devolucao';
  return 'badge badge-pendente';
}

function statusLabel(status) {
  const map = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
    return_pending: 'Aguardando devolução',
  };

  return map[status] ?? String(status).toUpperCase();
}

function getInitials(name) {
  if (!name) return '?';

  return name
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0].toUpperCase())
    .join('');
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDisplayDatetime(str) {
  if (!str) return '';

  if (str.includes('T')) {
    const [datePart, timePart] = str.split('T');
    const [yyyy, mm, dd] = datePart.split('-');
    return `${dd}/${mm}/${yyyy} ${timePart}`;
  }

  const [yyyy, mm, dd] = str.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';

  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;

  return formatDisplayDatetime(dateStr);
}

const IconPlus = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M8 3v10M3 8h10" />
  </svg>
);

/*
ENGINEERING NOTE:
The user dashboard now frames the experience around personal context.
Instead of generic stats only, the screen reinforces identity, next actions
and recent reservation activity.
*/
export default function UserDashboard() {
  const { user } = useAuth();

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

        setRentals(safeArray(rentalsRes?.data?.data));
      } catch (err) {
        if (!alive) return;

        setErrorMsg(
          getApiErrorMessage(err, 'Não foi possível carregar o dashboard.')
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
      <section className="user-hero">
        <div className="user-hero-left">
          <div className="user-hero-avatar">{getInitials(user?.name)}</div>

          <div>
            <span className="section-kicker">Personal workspace</span>
            <div className="user-hero-greeting">
              {greeting()}, {user?.name?.split(' ')[0] || 'Usuário'}
            </div>
            <div className="user-hero-sub">
              {user?.email || 'Sem email disponível'}
            </div>
          </div>
        </div>

        <Link className="btn btn-primary btn-sm" to="/rentals">
          <IconPlus /> Nova solicitação
        </Link>
      </section>

      {loading ? <div className="alert alert-info">Carregando dados...</div> : null}
      {!loading && errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      {!loading && !errorMsg ? (
        <>
          <section className="user-metrics-row">
            <div className="metric-card blue">
              <div className="metric-label">Total</div>
              <div className="metric-value">{rentals.length}</div>
              <div className="metric-desc">Minhas reservas registradas</div>
            </div>

            <div className="metric-card amber">
              <div className="metric-label">Pendentes</div>
              <div className="metric-value">{pendingCount}</div>
              <div className="metric-desc">Aguardando decisão do admin</div>
            </div>

            <div className="metric-card green">
              <div className="metric-label">Aprovadas</div>
              <div className="metric-value">{approvedCount}</div>
              <div className="metric-desc">Reservas prontas para uso</div>
            </div>

            <div className="metric-card red">
              <div className="metric-label">Rejeitadas</div>
              <div className="metric-value">{rejectedCount}</div>
              <div className="metric-desc">Não aprovadas</div>
            </div>

            <div className="metric-card gray">
              <div className="metric-label">Canceladas</div>
              <div className="metric-value">{cancelledCount}</div>
              <div className="metric-desc">Encerradas pelo usuário</div>
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <span className="table-title">Últimas solicitações</span>
                <span className="table-count">{rentals.length} total</span>
              </div>

              <Link to="/rentals" className="btn btn-ghost btn-sm">
                Ver todas →
              </Link>
            </div>

            {recentRentals.length === 0 ? (
              <div className="empty-state empty-state-large">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">Nenhuma solicitação ainda</div>
                <div className="empty-state-desc">
                  Crie sua primeira reserva para começar a usar a plataforma.
                </div>

                <Link to="/rentals" className="btn btn-primary btn-sm">
                  <IconPlus /> Nova solicitação
                </Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Veículo</th>
                      <th>Período</th>
                      <th>Motivo</th>
                      <th>Status</th>
                      <th>Criado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentRentals.map((rental) => (
                      <tr
                        key={rental.id}
                        className={
                          rental.status === 'return_pending'
                            ? 'table-row-highlight'
                            : ''
                        }
                      >
                        <td>
                          <span className="cell-main">
                            {rental?.vehicle?.brand} {rental?.vehicle?.model}
                          </span>

                          {rental?.vehicle?.licensePlate ? (
                            <span className="license-plate">
                              {rental.vehicle.licensePlate}
                            </span>
                          ) : null}
                        </td>

                        <td>
                          <span className="cell-main">
                            {formatDisplayDatetime(rental.startDate)}
                          </span>
                          <span className="cell-sub">
                            até {formatDisplayDatetime(rental.endDate)}
                          </span>
                        </td>

                        <td>
                          <span className="table-ellipsisCell">{rental.purpose}</span>
                        </td>

                        <td>
                          <span className={getStatusBadgeClass(rental.status)}>
                            {statusLabel(rental.status)}
                          </span>
                        </td>

                        <td>
                          <span className="cell-sub">{timeAgo(rental.createdAt)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}