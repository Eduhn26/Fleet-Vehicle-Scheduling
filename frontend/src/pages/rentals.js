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

const initialReturnForm = {
  mileage: '',
  returnNotes: '',
};

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

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnRental, setSelectedReturnRental] = useState(null);
  const [returnForm, setReturnForm] = useState(initialReturnForm);

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

  const openReturnModal = (rental) => {
    setSelectedReturnRental(rental);
    setReturnForm({
      mileage: rental?.vehicle?.mileage ? String(rental.vehicle.mileage) : '',
      returnNotes: 'Devolução solicitada pelo usuário via interface.',
    });
    setActionMsg('');
    setErrorMsg('');
    setReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    if (returnLoadingId) return;

    setReturnModalOpen(false);
    setSelectedReturnRental(null);
    setReturnForm(initialReturnForm);
  };

  const handleReturnFormChange = (event) => {
    const { name, value } = event.target;

    setReturnForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRequestReturn = async (event) => {
    event.preventDefault();

    if (!selectedReturnRental) return;

    const mileage = Number(returnForm.mileage);

    setReturnLoadingId(selectedReturnRental.id);
    setActionMsg('');
    setErrorMsg('');

    try {
      await api.patch(`/rentals/${selectedReturnRental.id}/request-return`, {
        mileage,
        returnNotes: returnForm.returnNotes.trim(),
      });

      setActionMsg('Devolução solicitada com sucesso. Aguarde a confirmação do admin.');
      closeReturnModal();
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

                          {typeof rental.returnRequestedMileage === 'number' &&
                            rental.status === 'return_pending' && (
                              <span className="cell-sub" style={{ marginTop: 4 }}>
                                KM informado: {rental.returnRequestedMileage.toLocaleString()} km
                              </span>
                            )}

                          {typeof rental.actualMileage === 'number' &&
                            rental.status === 'completed' && (
                              <span className="cell-sub" style={{ marginTop: 4 }}>
                                KM final: {rental.actualMileage.toLocaleString()} km
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
                                  onClick={() => openReturnModal(rental)}
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

      {returnModalOpen && selectedReturnRental && (
        <div className="modal-overlay" onClick={closeReturnModal}>
          <div
            className="modal-content-card rental-modal return-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rental-modalHeader">
              <div>
                <h2 className="rental-modalTitle">Solicitar devolução</h2>
                <p className="rental-modalSubtitle">
                  {selectedReturnRental?.vehicle?.brand} {selectedReturnRental?.vehicle?.model} •{' '}
                  {selectedReturnRental?.vehicle?.licensePlate}
                </p>
              </div>

              <button
                type="button"
                className="rental-modalClose"
                onClick={closeReturnModal}
                disabled={Boolean(returnLoadingId)}
              >
                ×
              </button>
            </div>

            <div className="rental-modalBody">
              <form className="return-modalForm" onSubmit={handleRequestReturn}>
                <div className="return-modalInfo card">
                  <div className="card-title">Resumo da reserva</div>

                  <div className="return-modalInfoGrid">
                    <div>
                      <span className="rental-summaryLabel">Período</span>
                      <p className="rental-summaryValue">
                        {selectedReturnRental.startDate} até {selectedReturnRental.endDate}
                      </p>
                    </div>

                    <div>
                      <span className="rental-summaryLabel">KM atual do veículo</span>
                      <p className="rental-summaryValue">
                        {selectedReturnRental?.vehicle?.mileage?.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                </div>

                <div className="return-modalFields card">
                  <div className="card-title">Dados da devolução</div>

                  <div className="rental-formGrid">
                    <label className="rental-field">
                      <span>Quilometragem devolvida</span>
                      <input
                        type="number"
                        name="mileage"
                        min="0"
                        value={returnForm.mileage}
                        onChange={handleReturnFormChange}
                        disabled={Boolean(returnLoadingId)}
                        required
                      />
                    </label>

                    <label className="rental-field rental-fieldWide">
                      <span>Observações</span>
                      <textarea
                        name="returnNotes"
                        value={returnForm.returnNotes}
                        onChange={handleReturnFormChange}
                        placeholder="Ex.: devolvido no estacionamento da empresa."
                        disabled={Boolean(returnLoadingId)}
                        rows="4"
                      />
                    </label>
                  </div>
                </div>

                <div className="return-modalActions">
                  <button
                    type="submit"
                    className="dashboard-linkBtn"
                    disabled={Boolean(returnLoadingId) || !returnForm.mileage}
                  >
                    {returnLoadingId ? 'Enviando...' : 'Confirmar devolução'}
                  </button>

                  <button
                    type="button"
                    className="rental-cancelBtn"
                    onClick={closeReturnModal}
                    disabled={Boolean(returnLoadingId)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}