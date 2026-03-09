import { useMemo, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;

  if (apiMessage) {
    return apiMessage;
  }

  return fallbackMessage;
}

function getStatusBadgeClass(status) {
  if (status === 'approved') return 'badge badge-approved';
  if (status === 'rejected') return 'badge badge-rejected';
  if (status === 'cancelled') return 'badge badge-cancelled';
  return 'badge badge-pending';
}

export default function AdminRentalTable({ rentals, onActionComplete }) {
  const [loadingId, setLoadingId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const sortedRentals = useMemo(() => {
    const items = safeArray(rentals);

    return [...items].sort((a, b) => {
      const left = new Date(b?.createdAt || 0).getTime();
      const right = new Date(a?.createdAt || 0).getTime();
      return left - right;
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

      await api.patch(`/rentals/${rentalId}/${action}`, {
        adminNotes: notes,
      });

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
        message: getApiErrorMessage(
          err,
          'Não foi possível concluir a ação administrativa.'
        ),
      });
    } finally {
      setLoadingId('');
    }
  };

  return (
    <div className="card card-wide">
      <div className="card-titleRow">
        <div className="card-title">Fila administrativa</div>
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
                      <div>{rental?.user?.name || 'Usuário'}</div>
                      <div className="card-meta">{rental?.user?.email || '-'}</div>
                    </td>
                    <td>
                      {rental?.vehicle?.brand} {rental?.vehicle?.model}
                    </td>
                    <td>
                      {rental.startDate} até {rental.endDate}
                    </td>
                    <td>{rental.purpose}</td>
                    <td>
                      <span className={getStatusBadgeClass(rental.status)}>
                        {String(rental.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            className="dashboard-linkBtn"
                            onClick={() => handleDecision(rental.id, 'approve')}
                            disabled={isLoading}
                            style={{
                              minHeight: '38px',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                            }}
                          >
                            {isLoading ? 'Processando...' : 'Aprovar'}
                          </button>

                          <button
                            type="button"
                            className="dashboard-linkBtn"
                            onClick={() => handleDecision(rental.id, 'reject')}
                            disabled={isLoading}
                            style={{
                              minHeight: '38px',
                              padding: '0 12px',
                              fontSize: '0.85rem',
                              background:
                                'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              boxShadow: '0 10px 24px rgba(220, 38, 38, 0.18)',
                            }}
                          >
                            {isLoading ? 'Processando...' : 'Rejeitar'}
                          </button>
                        </div>
                      ) : (
                        <span className="card-meta">Decisão já concluída</span>
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