import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

// NOTE: User dashboard focused on personal reservation context and quick actions.
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
  return name.split(' ').slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const IconPlus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 3v10M3 8h10"/>
  </svg>
);

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
        setErrorMsg(getApiErrorMessage(err, 'Não foi possível carregar o dashboard.'));
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
  const recentRentals  = useMemo(() => rentals.slice(0, 5), [rentals]);

  return (
    <div className="dashboard">

      {/* ── User Hero ─────────────────────────────────────────── */}
      <div className="user-hero">
        <div className="user-hero-left">
          <div className="user-hero-avatar">
            {getInitials(user?.name)}
          </div>
          <div>
            <div className="user-hero-greeting">
              {greeting()}, {user?.name?.split(' ')[0] || 'Usuário'}
            </div>
            <div className="user-hero-sub">
              {user?.email || ''}
            </div>
          </div>
        </div>
        <Link className="btn btn-primary btn-sm" to="/rentals">
          <IconPlus /> Nova solicitação
        </Link>
      </div>

      {loading && <div className="alert alert-info">Carregando dados...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <>
          <div className="user-metrics-row">
            <div className="metric-card blue">
              <div className="metric-label" style={{ marginBottom: 6 }}>Total</div>
              <div className="metric-value" style={{ fontSize: '1.6rem' }}>{rentals.length}</div>
              <div className="metric-desc">Minhas reservas</div>
            </div>
            <div className="metric-card amber">
              <div className="metric-label" style={{ marginBottom: 6 }}>Pendentes</div>
              <div className="metric-value" style={{ fontSize: '1.6rem' }}>{pendingCount}</div>
              <div className="metric-desc">Aguardando admin</div>
            </div>
            <div className="metric-card green">
              <div className="metric-label" style={{ marginBottom: 6 }}>Aprovadas</div>
              <div className="metric-value" style={{ fontSize: '1.6rem' }}>{approvedCount}</div>
              <div className="metric-desc">Prontas para uso</div>
            </div>
            <div className="metric-card red">
              <div className="metric-label" style={{ marginBottom: 6 }}>Rejeitadas</div>
              <div className="metric-value" style={{ fontSize: '1.6rem' }}>{rejectedCount}</div>
              <div className="metric-desc">Não aprovadas</div>
            </div>
            <div className="metric-card gray">
              <div className="metric-label" style={{ marginBottom: 6 }}>Canceladas</div>
              <div className="metric-value" style={{ fontSize: '1.6rem' }}>{cancelledCount}</div>
              <div className="metric-desc">Encerradas</div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <div>
                <span className="table-title">Últimas solicitações</span>
                <span className="table-count">{rentals.length} total</span>
              </div>
              <Link to="/rentals" className="btn btn-ghost btn-sm">Ver todas →</Link>
            </div>

            {recentRentals.length === 0 ? (
              <div style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Você ainda não possui solicitações.
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, marginTop: 0 }}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Veículo</th>
                      <th>Período</th>
                      <th>Motivo</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRentals.map((rental) => (
                      <tr
                        key={rental.id}
                        style={
                          rental.status === 'return_pending'
                            ? { background: 'linear-gradient(90deg, #fffbeb, transparent)' }
                            : {}
                        }
                      >
                        <td>
                          <span className="cell-main">
                            {rental?.vehicle?.brand} {rental?.vehicle?.model}
                          </span>
                          {rental?.vehicle?.licensePlate && (
                            <span className="license-plate">{rental.vehicle.licensePlate}</span>
                          )}
                        </td>
                        <td>
                          <span className="cell-main">{rental.startDate}</span>
                          <span className="cell-sub">até {rental.endDate}</span>
                        </td>
                        <td>
                          <span className="cell-sub" style={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rental.purpose}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(rental.status)}>
                            {statusLabel(rental.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}