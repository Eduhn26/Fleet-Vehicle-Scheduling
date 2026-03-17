import { useMemo, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

// NOTE: Admin table that centralizes rental review, filtering and approval actions.
function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
    return_pending: 'Aguardando devolução',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };
  return map[status] ?? String(status).toUpperCase();
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

// NOTE: Consistent avatar gradients help rows feel more deliberate and polished.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#0ea5e9,#0284c7)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#ec4899,#db2777)',
];

function avatarGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

const STATUS_PRIORITY = {
  pending: 1,
  return_pending: 2,
  approved: 3,
  rejected: 4,
  cancelled: 5,
  completed: 6,
};

export default function AdminRentalTable({ rentals, onActionComplete }) {
  const [loadingId, setLoadingId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const sortedRentals = useMemo(() => {
    return [...safeArray(rentals)].sort((a, b) => {
      const statusA = STATUS_PRIORITY[a?.status] ?? 99;
      const statusB = STATUS_PRIORITY[b?.status] ?? 99;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [rentals]);

  const pendingCount = useMemo(
    () => sortedRentals.filter((r) => r.status === 'pending').length,
    [sortedRentals]
  );

  const handleDecision = async (rentalId, action) => {
    setLoadingId(rentalId);
    setFeedback({ type: '', message: '' });

    try {
      const notes =
        action === 'approve'
          ? 'Aprovado pelo admin via interface.'
          : 'Rejeitado pelo admin via interface.';

      await api.patch(`/rentals/${rentalId}/${action}`, { adminNotes: notes });

      setFeedback({
        type: 'info',
        message:
          action === 'approve'
            ? 'Solicitação aprovada.'
            : 'Solicitação rejeitada.',
      });

      await onActionComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err, 'Não foi possível concluir.'),
      });
    } finally {
      setLoadingId('');
    }
  };

  const handleCompleteRental = async (rentalId) => {
    setLoadingId(rentalId);
    setFeedback({ type: '', message: '' });

    try {
      await api.patch(`/rentals/${rentalId}/complete`, {
        adminNotes: 'Devolução confirmada pelo admin via interface.',
      });

      setFeedback({
        type: 'info',
        message: 'Devolução concluída com sucesso.',
      });

      await onActionComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(
          err,
          'Não foi possível concluir a devolução.'
        ),
      });
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div className="table-card" style={{ marginTop: 14 }}>
      <div className="table-header">
        <div>
          <span className="table-title">Fila administrativa</span>
          <span className="table-count">{pendingCount} pendentes</span>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-info'}`}
          style={{ margin: '0 1.5rem 0' }}
        >
          {feedback.message}
        </div>
      )}

      <div className="sol-table-head">
        <span>Usuário</span>
        <span>Veículo</span>
        <span>Período</span>
        <span>Motivo</span>
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>Ações</span>
      </div>

      {sortedRentals.length === 0 ? (
        <div
          style={{
            padding: '1.5rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.875rem',
          }}
        >
          Nenhuma solicitação encontrada.
        </div>
      ) : (
        sortedRentals.map((rental) => {
          const isPending = rental.status === 'pending';
          const isReturnPending = rental.status === 'return_pending';
          const isLoading = loadingId === rental.id;
          const userName = rental?.user?.name || 'Usuário';

          return (
            <div
              key={rental.id}
              className={`sol-table-row${isReturnPending ? ' highlight' : ''}`}
            >
              <div className="user-cell">
                <div
                  className="user-initials"
                  style={{ background: avatarGradient(userName) }}
                  title={userName}
                >
                  {getInitials(userName)}
                </div>

                <div>
                  <div className="cell-main">{userName}</div>
                  <div className="cell-sub">{rental?.user?.email || '-'}</div>
                </div>
              </div>

              <div>
                <div className="cell-main">
                  {rental?.vehicle?.brand} {rental?.vehicle?.model}
                </div>

                {rental?.vehicle?.licensePlate && (
                  <span className="license-plate">
                    {rental.vehicle.licensePlate}
                  </span>
                )}
              </div>

              <div>
                <div className="cell-main" style={{ fontSize: '0.82rem' }}>
                  {rental.startDate}
                </div>
                <div className="cell-sub">até {rental.endDate}</div>
              </div>

              <div>
                {/* NOTE: Purpose must wrap fully for both normal requests and returns. */}
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.6,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                  title={rental.purpose}
                >
                  {rental.purpose}
                </div>

                {isReturnPending && rental.returnNotes && (
                  <div className="cell-sub" style={{ marginTop: 6 }}>
                    {rental.returnNotes}
                  </div>
                )}

                {isReturnPending && typeof rental.mileage === 'number' && (
                  <div className="cell-sub return-mileage">
                    KM informado: {rental.mileage.toLocaleString()} km
                  </div>
                )}
              </div>

              <div>
                <span className={getStatusBadgeClass(rental.status)}>
                  {statusLabel(rental.status)}
                </span>
              </div>

              <div className="row-actions">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDecision(rental.id, 'approve')}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : '✓ Aprovar'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fee2e2',
                      }}
                      onClick={() => handleDecision(rental.id, 'reject')}
                      disabled={isLoading}
                    >
                      {isLoading ? '...' : '✕ Rejeitar'}
                    </button>
                  </>
                ) : isReturnPending ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCompleteRental(rental.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? '...' : 'Confirmar devolução'}
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Decisão concluída
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}