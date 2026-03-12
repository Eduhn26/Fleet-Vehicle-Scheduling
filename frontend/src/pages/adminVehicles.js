import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import AddVehicleModal from '../components/AddVehicleModal';
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
  return safeArray(vehicles).filter((v) => v?.status === status).length;
}

function MaintBar({ mileage, nextMaintenance }) {
  const pct = Math.min(
    Math.round(((mileage || 0) / (nextMaintenance || 30000)) * 100),
    100
  );

  let color = '#059669';
  if (pct > 75) color = '#d97706';
  if (pct >= 95) color = '#dc2626';

  return (
    <div style={{ minWidth: 90 }}>
      <div
        style={{
          fontSize: '0.72rem',
          color: '#94a3b8',
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 600,
        }}
      >
        <span>{(mileage || 0).toLocaleString()} km</span>
        <span>{pct}%</span>
      </div>

      <div className="maint-bar-track">
        <div
          className="maint-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoadingPlate, setActionLoadingPlate] = useState('');

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
    let alive = true;

    async function loadInitial() {
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await api.get('/vehicles');

        if (!alive) return;

        const data = safeArray(res?.data?.data ?? res?.data);
        setVehicles(data);
      } catch (err) {
        if (!alive) return;

        setErrorMsg(
          getApiErrorMessage(err, 'Não foi possível carregar os veículos.')
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadInitial();

    return () => {
      alive = false;
    };
  }, []);

  const handleVehicleCreated = async () => {
    setActionMsg('Veículo cadastrado com sucesso.');
    setIsAddModalOpen(false);
    await loadVehicles();
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
        getApiErrorMessage(err, 'Não foi possível finalizar a manutenção do veículo.')
      );
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

  const handlePreviewSelect = () => {
    // NOTE: no admin, o card entra como leitura visual da frota.
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Veículos</div>
          <div className="dashboard-subtitle">
            Visão operacional da frota cadastrada.
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="dashboard-linkBtn"
            onClick={() => {
              setActionMsg('');
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
          >
            Novo veículo
          </button>
        </div>
      </div>

      {actionMsg && <div className="alert alert-info">{actionMsg}</div>}
      {loading && <div className="alert alert-info">Carregando veículos...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-titleRow">
              <div className="card-title">Total</div>
            </div>
            <div className="card-kpi">{vehicles.length}</div>
            <div className="card-meta">Veículos cadastrados</div>
          </div>

          <div className="card" style={{ borderTop: '3px solid #059669' }}>
            <div className="card-titleRow">
              <div className="card-title">Disponíveis</div>
              <span className="badge badge-approved">Disponível</span>
            </div>
            <div className="card-kpi">{availableCount}</div>
            <div className="card-meta">Prontos para reserva</div>
          </div>

          <div className="card" style={{ borderTop: '3px solid #dc2626' }}>
            <div className="card-titleRow">
              <div className="card-title">Manutenção</div>
              <span className="badge badge-rejected">Manutenção</span>
            </div>
            <div className="card-kpi">{maintenanceCount}</div>
            <div className="card-meta">Indisponíveis temporariamente</div>
          </div>

          <div className="card" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="card-titleRow">
              <div className="card-title">Alugados</div>
              <span className="badge badge-pending">Alugado</span>
            </div>
            <div className="card-kpi">{rentedCount}</div>
            <div className="card-meta">Em uso no momento</div>
          </div>

          <div className="card card-wide">
            <div className="card-titleRow">
              <div className="card-title">Grid da frota</div>
              <span className="badge badge-cancelled">
                {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'}
              </span>
            </div>

            {vehicles.length === 0 ? (
              <div className="card-meta">Nenhum veículo cadastrado.</div>
            ) : (
              <div className="vehicle-picker">
                <div className="vehicle-grid">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      selected={false}
                      onSelect={handlePreviewSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card card-wide">
            <div className="card-titleRow">
              <div className="card-title">Lista da frota</div>
            </div>

            {vehicles.length === 0 ? (
              <div className="card-meta">Nenhum veículo cadastrado.</div>
            ) : (
              <div className="table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Veículo</th>
                      <th>Placa</th>
                      <th>Ano / Cor</th>
                      <th>Passageiros</th>
                      <th>Quilometragem</th>
                      <th>Próx. Manutenção</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => {
                      const isLoading = actionLoadingPlate === vehicle.licensePlate;
                      const canSendToMaintenance =
                        vehicle.status === 'available';
                      const canCompleteMaintenance =
                        vehicle.status === 'maintenance';

                      return (
                        <tr key={vehicle.id}>
                          <td>
                            <span className="cell-main">
                              {vehicle.brand} {vehicle.model}
                            </span>
                            <span className="cell-sub">
                              {vehicle.fuelType} • {vehicle.transmissionType}
                            </span>
                          </td>

                          <td>
                            <span className="license-plate">
                              {vehicle.licensePlate}
                            </span>
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
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                              {(vehicle.nextMaintenance || 0).toLocaleString()} km
                            </span>
                          </td>

                          <td>{getStatusBadge(vehicle.status)}</td>

                          <td>
                            {canSendToMaintenance ? (
                              <button
                                type="button"
                                className="dashboard-linkBtn"
                                onClick={() => handleSendToMaintenance(vehicle)}
                                disabled={isLoading}
                                style={{
                                  minHeight: 36,
                                  padding: '0 12px',
                                  fontSize: '0.85rem',
                                  background:
                                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  boxShadow: '0 6px 18px rgba(245, 158, 11, 0.22)',
                                }}
                              >
                                {isLoading ? 'Processando...' : 'Enviar manutenção'}
                              </button>
                            ) : canCompleteMaintenance ? (
                              <button
                                type="button"
                                className="dashboard-linkBtn"
                                onClick={() => handleCompleteMaintenance(vehicle)}
                                disabled={isLoading}
                                style={{
                                  minHeight: 36,
                                  padding: '0 12px',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {isLoading ? 'Processando...' : 'Finalizar manutenção'}
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
      )}

      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleVehicleCreated}
      />
    </div>
  );
}