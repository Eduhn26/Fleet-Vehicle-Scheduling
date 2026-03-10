import { useEffect, useState } from 'react';
import api from '../services/api';
import VehicleGrid from '../components/VehicleGrid';
import RentalRequestModal from '../components/RentalRequestModal';
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
  if (status === 'completed') return 'badge badge-approved';
  if (status === 'return_pending') return 'badge badge-pending';
  return 'badge badge-pending';
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

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [cancelLoadingId, setCancelLoadingId] = useState('');
  const [returnLoadingId, setReturnLoadingId] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const loadMyRentals = async () => {
    setLoadingRentals(true);
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
      setLoadingRentals(false);
    }
  };

  const loadVehicles = async () => {
    setLoadingVehicles(true);

    try {
      const res = await api.get('/vehicles');
      const data = safeArray(res?.data?.data ?? res?.data);
      setVehicles(data);
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível carregar os veículos.')
      );
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    loadMyRentals();
    loadVehicles();
  }, []);

  const handleCreated = async () => {
    setActionMsg('Solicitação criada com sucesso.');
    setSelectedVehicle(null);
    await loadMyRentals();
  };

  const handleSelectVehicle = (vehicleId) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;
    setSelectedVehicle(vehicle);
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

 const handleRequestReturn = async (rentalId) => {
  const mileageInput = window.prompt('Informe a quilometragem atual do veículo:');

  if (mileageInput === null) {
    return;
  }

  const mileage = Number(mileageInput);

  setReturnLoadingId(rentalId);
  setActionMsg('');
  setErrorMsg('');

  try {
    await api.patch(`/rentals/${rentalId}/request-return`, {
      mileage,
      returnNotes: 'Devolução solicitada pelo usuário via interface.',
    });

    setActionMsg('Devolução solicitada com sucesso. Aguarde a confirmação do admin.');
    await loadMyRentals();
  } catch (err) {
    const message = getApiErrorMessage(
      err,
      'Não foi possível solicitar a devolução.'
    );

    setErrorMsg(message);
    setActionMsg('');
  } finally {
    setReturnLoadingId('');
  }
};

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle?.status === 'available'
  );

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
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Nova solicitação</div>
          </div>

          <div className="vehicle-picker">
            {loadingVehicles ? (
              <div className="card-meta">Carregando veículos...</div>
            ) : (
              <VehicleGrid
                vehicles={availableVehicles}
                selectedId={selectedVehicle?.id ?? ''}
                onSelect={handleSelectVehicle}
              />
            )}
          </div>
        </div>

        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Histórico</div>
            {!loadingRentals && (
              <span className="badge badge-cancelled">{rentals.length} total</span>
            )}
          </div>

          {loadingRentals ? (
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
                    const canRequestReturn = rental.status === 'approved';
                    const isCancelling = cancelLoadingId === rental.id;
                    const isRequestingReturn = returnLoadingId === rental.id;

                    return (
                      <tr key={rental.id}>
                        <td>
                          <span className="cell-main">
                            {rental?.vehicle?.brand} {rental?.vehicle?.model}
                          </span>
                          {rental?.vehicle?.licensePlate && (
                            <span className="license-plate">
                              {rental.vehicle.licensePlate}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="cell-main">{rental.startDate}</span>
                          <span className="cell-sub">até {rental.endDate}</span>
                        </td>
                        <td>
                          <span
                            className="cell-sub"
                            style={{
                              maxWidth: 180,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
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

                          {rental.returnNotes && rental.status === 'return_pending' && (
                            <span className="cell-sub" style={{ marginTop: 4 }}>
                              {rental.returnNotes}
                            </span>
                          )}
                        </td>
                        <td>
                          {canCancel || canRequestReturn ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {canRequestReturn && (
                                <button
                                  type="button"
                                  className="dashboard-linkBtn"
                                  onClick={() => handleRequestReturn(rental.id)}
                                  disabled={isRequestingReturn || isCancelling}
                                  style={{
                                    minHeight: 36,
                                    padding: '0 12px',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  {isRequestingReturn ? 'Enviando...' : 'Devolver'}
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  type="button"
                                  className="dashboard-linkBtn"
                                  onClick={() => handleCancel(rental.id)}
                                  disabled={isCancelling || isRequestingReturn}
                                  style={{
                                    minHeight: 36,
                                    padding: '0 12px',
                                    fontSize: '0.85rem',
                                    background:
                                      'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                    boxShadow: '0 4px 12px rgba(100, 116, 139, 0.2)',
                                  }}
                                >
                                  {isCancelling ? 'Cancelando...' : 'Cancelar'}
                                </button>
                              )}
                            </div>
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

      <RentalRequestModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onCreated={handleCreated}
      />
    </div>
  );
}