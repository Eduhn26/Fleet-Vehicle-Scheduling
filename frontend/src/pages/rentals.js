import { useEffect, useMemo, useState } from 'react';
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

const initialReturnForm = {
  mileage: '',
  returnNotes: '',
};

/*
ENGINEERING NOTE:
This page now behaves more like a guided reservation workspace.
The top area emphasizes vehicle selection, while history keeps the lifecycle
readable and action-oriented.
*/
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
      setRentals(safeArray(res?.data?.data));
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
      setVehicles(safeArray(res?.data?.data ?? res?.data));
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
        cancelNotes: 'Cancelled by user via interface.',
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
      returnNotes: 'Return requested by user via interface.',
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

      setActionMsg(
        'Devolução solicitada com sucesso. Aguarde a confirmação do admin.'
      );

      closeReturnModal();
      await loadMyRentals();
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível solicitar a devolução.')
      );
    } finally {
      setReturnLoadingId('');
    }
  };

  const availableVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle?.status === 'available'),
    [vehicles]
  );

  return (
    <div className="dashboard">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-text">
          <span className="section-kicker">Reservation workspace</span>
          <h1 className="dashboard-hero-title">Minhas Solicitações</h1>
          <p className="dashboard-hero-sub">
            Crie reservas, acompanhe o status e solicite devoluções em um fluxo
            mais claro para o usuário final.
          </p>
        </div>

        <div className="dashboard-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{availableVehicles.length}</span>
            <span className="hero-stat-label">Veículos disponíveis</span>
          </div>

          <div className="hero-stat">
            <span className="hero-stat-value">{rentals.length}</span>
            <span className="hero-stat-label">Solicitações totais</span>
          </div>
        </div>
      </section>

      {actionMsg ? <div className="alert alert-info">{actionMsg}</div> : null}
      {errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      <section className="table-card">
        <div className="table-header">
          <div>
            <span className="table-title">Nova solicitação</span>
            <span className="table-count">{availableVehicles.length} disponíveis</span>
          </div>
        </div>

        <div className="table-sectionBody">
          {loadingVehicles ? (
            <div className="card-meta">Carregando veículos...</div>
          ) : availableVehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚗</div>
              <div className="empty-state-title">Nenhum veículo disponível</div>
              <div className="empty-state-desc">
                Todos os veículos estão em uso ou manutenção no momento.
              </div>
            </div>
          ) : (
            <VehicleGrid
              vehicles={availableVehicles}
              selectedId={selectedVehicle?.id ?? ''}
              onSelect={handleSelectVehicle}
            />
          )}
        </div>
      </section>

      <section className="table-card">
        <div className="table-header">
          <div>
            <span className="table-title">Histórico</span>
            {!loadingRentals ? (
              <span className="table-count">{rentals.length} total</span>
            ) : null}
          </div>
        </div>

        {loadingRentals ? (
          <div className="table-sectionBody card-meta">Carregando solicitações...</div>
        ) : rentals.length === 0 ? (
          <div className="empty-state empty-state-large">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Nenhuma solicitação encontrada</div>
            <div className="empty-state-desc">
              Selecione um veículo acima para criar sua primeira reserva.
            </div>
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
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {rentals.map((rental) => {
                  const canCancel = rental.status === 'approved';
                  const canRequestReturn = rental.status === 'approved';
                  const isCancelling = cancelLoadingId === rental.id;
                  const isRequestingReturn = returnLoadingId === rental.id;
                  const hasActions = canCancel || canRequestReturn;

                  return (
                    <tr key={rental.id}>
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

                        {rental.adminNotes ? (
                          <span className="cell-sub cell-sub-block">
                            {rental.adminNotes}
                          </span>
                        ) : null}

                        {rental.returnNotes && rental.status === 'return_pending' ? (
                          <span className="cell-sub cell-sub-block">
                            {rental.returnNotes}
                          </span>
                        ) : null}

                        {typeof rental.returnRequestedMileage === 'number' &&
                        rental.status === 'return_pending' ? (
                          <span className="cell-sub cell-sub-block">
                            KM informado: {rental.returnRequestedMileage.toLocaleString()} km
                          </span>
                        ) : null}

                        {typeof rental.actualMileage === 'number' &&
                        rental.status === 'completed' ? (
                          <span className="cell-sub cell-sub-block">
                            KM final: {rental.actualMileage.toLocaleString()} km
                          </span>
                        ) : null}
                      </td>

                      <td>
                        {hasActions ? (
                          <div className="table-actionGroup">
                            {canRequestReturn ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => openReturnModal(rental)}
                                disabled={isRequestingReturn || isCancelling}
                              >
                                {isRequestingReturn ? 'Enviando...' : 'Devolver'}
                              </button>
                            ) : null}

                            {canCancel ? (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancel(rental.id)}
                                disabled={isCancelling || isRequestingReturn}
                              >
                                {isCancelling ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="cell-sub">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RentalRequestModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onCreated={handleCreated}
      />

      {returnModalOpen && selectedReturnRental ? (
        <div className="modal-overlay" onClick={closeReturnModal}>
          <div
            className="modal-content-card rental-modal return-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rental-modalHeader">
              <div>
                <h2 className="rental-modalTitle">Solicitar devolução</h2>
                <p className="rental-modalSubtitle">
                  {selectedReturnRental?.vehicle?.brand}{' '}
                  {selectedReturnRental?.vehicle?.model} ·{' '}
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
                        {formatDisplayDatetime(selectedReturnRental.startDate)} até{' '}
                        {formatDisplayDatetime(selectedReturnRental.endDate)}
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
                    className="btn btn-primary"
                    disabled={Boolean(returnLoadingId) || !returnForm.mileage}
                  >
                    {returnLoadingId ? 'Enviando...' : 'Confirmar devolução'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
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
      ) : null}
    </div>
  );
}