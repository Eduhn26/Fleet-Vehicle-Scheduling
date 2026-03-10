import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
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

  useEffect(() => {
    let alive = true;

    async function loadVehicles() {
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

    loadVehicles();

    return () => {
      alive = false;
    };
  }, []);

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
      </div>

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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}