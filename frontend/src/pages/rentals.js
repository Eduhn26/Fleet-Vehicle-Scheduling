import { useEffect, useState } from 'react';
import api from '../services/api';
import RentalForm from '../components/RentalForm';
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

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [cancelLoadingId, setCancelLoadingId] = useState('');

  const loadMyRentals = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/rentals/my');
      const data = safeArray(res?.data?.data);
      setRentals(data);
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível carregar suas solicitações.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRentals();
  }, []);

  const handleCreated = async () => {
    setActionMsg('Solicitação criada com sucesso.');
    await loadMyRentals();
  };

  const handleCancel = async (rentalId) => {
    setCancelLoadingId(rentalId);
    setActionMsg('');
    setErrorMsg('');

    try {
      await api.patch(`/rentals/${rentalId}/cancel`, {
        cancelNotes: 'Cancelado pelo usuário via interface.',
      });

      setActionMsg('Reserva cancelada com sucesso.');
      await loadMyRentals();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Não foi possível cancelar a reserva.'));
    } finally {
      setCancelLoadingId('');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Minhas Solicitações</div>
          <div className="dashboard-subtitle">
            Crie novas reservas e acompanhe o lifecycle das já existentes.
          </div>
        </div>
      </div>

      {actionMsg && <div className="alert alert-info">{actionMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div className="dashboard-grid">
        {/* Nova Solicitação */}
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Nova solicitação</div>
          </div>
          <RentalForm onCreated={handleCreated} />
        </div>

        {/* Histórico */}
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Histórico</div>
            {!loading && (
              <span className="badge badge-cancelled">{rentals.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="card-meta">Carregando solicitações...</div>
          ) : rentals.length === 0 ? (
            <div className="card-meta">Nenhuma solicitação encontrada.</div>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Veículo</th>
                    <th>Período</th>
                    <th>Motivo</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((rental) => {
                    const canCancel = rental.status === 'approved';
                    const isCancelling = cancelLoadingId === rental.id;

                    return (
                      <tr key={rental.id}>
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
                          <span className="cell-sub" style={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rental.purpose}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(rental.status)}>
                            {statusLabel(rental.status)}
                          </span>
                          {rental.adminNotes && (
                            <span className="cell-sub" style={{ marginTop: 4 }}>
                              {rental.adminNotes}
                            </span>
                          )}
                        </td>
                        <td>
                          {canCancel ? (
                            <button
                              type="button"
                              className="dashboard-linkBtn"
                              onClick={() => handleCancel(rental.id)}
                              disabled={isCancelling}
                              style={{
                                minHeight: 36,
                                padding: '0 12px',
                                fontSize: '0.85rem',
                                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                boxShadow: '0 4px 12px rgba(100, 116, 139, 0.2)',
                              }}
                            >
                              {isCancelling ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          ) : (
                            <span className="cell-sub">Sem ação</span>
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
      </div>
    </div>
  );
}