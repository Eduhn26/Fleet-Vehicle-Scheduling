import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AddVehicleModal from '../components/AddVehicleModal';
import RentalRequestModal from '../components/RentalRequestModal';
import VehicleCard from '../components/VehicleCard';
import VehicleDetailsModal from '../components/VehicleDetailsModal';
import '../styles/dashboard.css';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

function countByVehicleStatus(vehicles, status) {
  return safeArray(vehicles).filter((vehicle) => vehicle?.status === status).length;
}

function MaintBar({ mileage, nextMaintenance }) {
  const currentMileage = mileage || 0;
  const maintenanceTarget = nextMaintenance || 30000;
  const percentage = Math.min(
    Math.round((currentMileage / maintenanceTarget) * 100),
    100
  );

  let tone = '#059669';

  if (percentage > 75) tone = '#d97706';
  if (percentage >= 95) tone = '#dc2626';

  return (
    <div className="maint-bar-wrapper">
      <div className="maint-bar-label">
        <span>{currentMileage.toLocaleString()} km</span>
        <span>{percentage}%</span>
      </div>

      <div className="maint-bar-track">
        <div
          className="maint-bar-fill"
          style={{ width: `${percentage}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

/*
ENGINEERING NOTE:
The page now separates fleet overview, card discovery and structured table
review. This gives the admin a clearer decision path instead of one flat screen.
*/
export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoadingPlate, setActionLoadingPlate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailsVehicle, setDetailsVehicle] = useState(null);

  const loadVehicles = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/vehicles');
      const data = safeArray(res?.data?.data ?? res?.data);
      setVehicles(data);
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível carregar os veículos.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleVehicleCreated = async () => {
    setActionMsg('Veículo cadastrado com sucesso.');
    setIsAddModalOpen(false);
    await loadVehicles();
  };

  const handleAdminRentalCreated = async () => {
    setActionMsg('Reserva administrativa criada com sucesso.');
    setSelectedVehicle(null);
    await loadVehicles();
  };

  const handleOpenVehicle = (vehicleId) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    setActionMsg('');
    setErrorMsg('');
    setDetailsVehicle(vehicle);
  };

  const handleReserveFromDetails = (vehicle) => {
    if (!vehicle) return;

    if (vehicle.status !== 'available') {
      setDetailsVehicle(null);
      setActionMsg('');
      setErrorMsg('Apenas veículos disponíveis podem ser reservados.');
      return;
    }

    setDetailsVehicle(null);
    setSelectedVehicle(vehicle);
  };

  const handleSendToMaintenance = async (vehicle) => {
    setActionLoadingPlate(vehicle.licensePlate);
    setActionMsg('');
    setErrorMsg('');

    try {
      await api.patch(`/vehicles/${vehicle.licensePlate}/status`, {
        status: 'maintenance',
      });

      setActionMsg(
        `${vehicle.brand} ${vehicle.model} enviado para manutenção com sucesso.`
      );

      await loadVehicles();
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível enviar o veículo para manutenção.')
      );
    } finally {
      setActionLoadingPlate('');
    }
  };

  const handleCompleteMaintenance = async (vehicle) => {
    setActionLoadingPlate(vehicle.licensePlate);
    setActionMsg('');
    setErrorMsg('');

    try {
      const suggestedNextMaintenance = Math.max(
        (vehicle.mileage || 0) + 20000,
        (vehicle.nextMaintenance || 0) + 20000
      );

      await api.patch(`/vehicles/${vehicle.licensePlate}/maintenance`, {
        newNextMaintenance: suggestedNextMaintenance,
      });

      setActionMsg(
        `${vehicle.brand} ${vehicle.model} teve a manutenção registrada com sucesso.`
      );

      await loadVehicles();
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(
          err,
          'Não foi possível finalizar a manutenção do veículo.'
        )
      );
    } finally {
      setActionLoadingPlate('');
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const confirmed = window.confirm(
      `Excluir o veículo ${vehicle.brand} ${vehicle.model}?`
    );

    if (!confirmed) return;

    setActionLoadingPlate(vehicle.licensePlate);
    setActionMsg('');
    setErrorMsg('');

    try {
      await api.delete(`/vehicles/${vehicle.licensePlate}`);
      setActionMsg(`${vehicle.brand} ${vehicle.model} excluído com sucesso.`);
      await loadVehicles();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Não foi possível excluir o veículo.'));
    } finally {
      setActionLoadingPlate('');
    }
  };

  const availableCount = useMemo(
    () => countByVehicleStatus(vehicles, 'available'),
    [vehicles]
  );

  const maintenanceCount = useMemo(
    () => countByVehicleStatus(vehicles, 'maintenance'),
    [vehicles]
  );

  const rentedCount = useMemo(
    () => countByVehicleStatus(vehicles, 'rented'),
    [vehicles]
  );

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return <span className="badge badge-approved">Disponível</span>;
    }

    if (status === 'maintenance') {
      return <span className="badge badge-rejected">Manutenção</span>;
    }

    if (status === 'rented') {
      return <span className="badge badge-pending">Alugado</span>;
    }

    return <span className="badge badge-cancelled">{status}</span>;
  };

  return (
    <div className="dashboard">
      <section className="dashboard-hero dashboard-hero-compact">
        <div className="dashboard-hero-text">
          <span className="section-kicker">Fleet workspace</span>
          <h1 className="dashboard-hero-title">Veículos</h1>
          <p className="dashboard-hero-sub">
            Organize a frota, acompanhe disponibilidade e visualize risco de manutenção
            em um layout mais claro para operação.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setActionMsg('');
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
          >
            + Novo veículo
          </button>
        </div>
      </section>

      {actionMsg ? <div className="alert alert-info">{actionMsg}</div> : null}
      {loading ? <div className="alert alert-info">Carregando veículos...</div> : null}
      {!loading && errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      {!loading && !errorMsg ? (
        <>
          <section className="metrics-grid metrics-grid-tight">
            <div className="metric-card blue">
              <div className="metric-header">
                <span className="metric-label">Total</span>
              </div>
              <div className="metric-value">{vehicles.length}</div>
              <div className="metric-desc">Veículos cadastrados na frota.</div>
            </div>

            <div className="metric-card green">
              <div className="metric-header">
                <span className="metric-label">Disponíveis</span>
                <span className="badge badge-approved">Pronto</span>
              </div>
              <div className="metric-value">{availableCount}</div>
              <div className="metric-desc">Prontos para novas reservas.</div>
            </div>

            <div className="metric-card amber">
              <div className="metric-header">
                <span className="metric-label">Em uso</span>
                <span className="badge badge-pending">Ativo</span>
              </div>
              <div className="metric-value">{rentedCount}</div>
              <div className="metric-desc">Atualmente vinculados a reservas.</div>
            </div>

            <div className="metric-card red">
              <div className="metric-header">
                <span className="metric-label">Manutenção</span>
                <span className="badge badge-rejected">Indisponível</span>
              </div>
              <div className="metric-value">{maintenanceCount}</div>
              <div className="metric-desc">Exigem atenção técnica antes do uso.</div>
            </div>
          </section>

          <section className="table-card">
            <div className="table-header">
              <div>
                <span className="table-title">Grid da frota</span>
                <span className="table-count">
                  {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'}
                </span>
              </div>
            </div>

            <div className="table-sectionBody">
              {vehicles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🚗</div>
                  <div className="empty-state-title">Nenhum veículo cadastrado</div>
                  <div className="empty-state-desc">
                    Adicione o primeiro veículo da frota para começar a operar.
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    + Novo veículo
                  </button>
                </div>
              ) : (
                <div className="vehicle-grid">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      selected={
                        detailsVehicle?.id === vehicle.id ||
                        selectedVehicle?.id === vehicle.id
                      }
                      onSelect={handleOpenVehicle}
                      onSendMaintenance={handleSendToMaintenance}
                      onCompleteMaintenance={handleCompleteMaintenance}
                      onDeleteVehicle={handleDeleteVehicle}
                      actionLoadingPlate={actionLoadingPlate}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {vehicles.length > 0 ? (
            <section className="table-card">
              <div className="table-header">
                <div>
                  <span className="table-title">Lista estruturada da frota</span>
                  <span className="table-count">Leitura operacional detalhada</span>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Veículo</th>
                      <th>Placa</th>
                      <th>Ano / Cor</th>
                      <th>Passageiros</th>
                      <th>Quilometragem</th>
                      <th>Próx. manutenção</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>
                          <span className="cell-main">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <span className="cell-sub">
                            {vehicle.fuelType} · {vehicle.transmissionType}
                          </span>
                        </td>

                        <td>
                          <span className="license-plate">{vehicle.licensePlate}</span>
                        </td>

                        <td>
                          <span className="cell-main">{vehicle.year}</span>
                          <span className="cell-sub">{vehicle.color}</span>
                        </td>

                        <td>
                          <span className="cell-main">{vehicle.passengers}</span>
                        </td>

                        <td>
                          <MaintBar
                            mileage={vehicle.mileage}
                            nextMaintenance={vehicle.nextMaintenance}
                          />
                        </td>

                        <td>
                          <span className="cell-main">
                            {(vehicle.nextMaintenance || 0).toLocaleString()} km
                          </span>
                        </td>

                        <td>{getStatusBadge(vehicle.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleVehicleCreated}
      />

      <VehicleDetailsModal
        vehicle={detailsVehicle}
        onClose={() => setDetailsVehicle(null)}
        onReserve={handleReserveFromDetails}
      />

      <RentalRequestModal
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onCreated={handleAdminRentalCreated}
      />
    </div>
  );
}