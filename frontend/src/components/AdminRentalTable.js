import { useMemo, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

function getStatusBadgeClass(status) {
  if (status === 'approved') return 'badge badge-approved';
  if (status === 'rejected') return 'badge badge-rejected';
  if (status === 'cancelled') return 'badge badge-cancelled';
  return 'badge badge-pending';
}

function statusLabel(status) {
  const map = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };
  return map[status] ?? String(status).toUpperCase();
}

export default function AdminRentalTable({ rentals, onActionComplete }) {
  const [loadingId, setLoadingId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const sortedRentals = useMemo(() => {
    const items = safeArray(rentals);
    return [...items].sort((a, b) => {
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [rentals]);

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
            ? 'Solicitação aprovada com sucesso.'
            : 'Solicitação rejeitada com sucesso.',
      });

      await onActionComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err, 'Não foi possível concluir a ação.'),
      });
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div className="card card-wide">
      <div className="card-titleRow">
        <div className="card-title">Fila administrativa</div>
        <span className="badge badge-pending">{sortedRentals.filter(r => r.status === 'pending').length} pendentes</span>
      </div>

      {feedback.message && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-info'}`}>
          {feedback.message}
        </div>
      )}

      {sortedRentals.length === 0 ? (
        <div className="card-meta">Nenhuma solicitação encontrada.</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Veículo</th>
                <th>Período</th>
                <th>Motivo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedRentals.map((rental) => {
                const isPending = rental.status === 'pending';
                const isLoading = loadingId === rental.id;

                return (
                  <tr key={rental.id}>
                    <td>
                      <span className="cell-main">{rental?.user?.name || 'Usuário'}</span>
                      <span className="cell-sub">{rental?.user?.email || '-'}</span>
                    </td>
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
                      <span style={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rental.purpose}>
                        {rental.purpose}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(rental.status)}>
                        {statusLabel(rental.status)}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="dashboard-linkBtn"
                            onClick={() => handleDecision(rental.id, 'approve')}
                            disabled={isLoading}
                            style={{ minHeight: 36, padding: '0 12px', fontSize: '0.85rem' }}
                          >
                            {isLoading ? '...' : '✓ Aprovar'}
                          </button>
                          <button
                            type="button"
                            className="dashboard-linkBtn"
                            onClick={() => handleDecision(rental.id, 'reject')}
                            disabled={isLoading}
                            style={{
                              minHeight: 36,
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.22)',
                            }}
                          >
                            {isLoading ? '...' : '✕ Rejeitar'}
                          </button>
                        </div>
                      ) : (
                        <span className="cell-sub">Decisão concluída</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}