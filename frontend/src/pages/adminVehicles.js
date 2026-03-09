import { useEffect, useMemo, useState } from 'react';
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

function countByVehicleStatus(vehicles, status) {
  return safeArray(vehicles).filter((vehicle) => vehicle?.status === status).length;
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
        <>
          <div className="dashboard-grid">
            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Total</div>
              </div>
              <div className="card-kpi">{vehicles.length}</div>
              <div className="card-meta">Veículos cadastrados</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Disponíveis</div>
                <span className="badge badge-approved">Available</span>
              </div>
              <div className="card-kpi">{availableCount}</div>
              <div className="card-meta">Prontos para reserva</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Manutenção</div>
                <span className="badge badge-rejected">Maintenance</span>
              </div>
              <div className="card-kpi">{maintenanceCount}</div>
              <div className="card-meta">Indisponíveis temporariamente</div>
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
                        <th>Placa</th>
                        <th>Veículo</th>
                        <th>Ano</th>
                        <th>Cor</th>
                        <th>KM</th>
                        <th>Status</th>
                        <th>Passageiros</th>
                        <th>Próx. manutenção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <td>{vehicle.licensePlate}</td>
                          <td>
                            {vehicle.brand} {vehicle.model}
                          </td>
                          <td>{vehicle.year}</td>
                          <td>{vehicle.color}</td>
                          <td>{vehicle.mileage}</td>
                          <td>
                            <span
                              className={
                                vehicle.status === 'available'
                                  ? 'badge badge-approved'
                                  : 'badge badge-rejected'
                              }
                            >
                              {String(vehicle.status || '').toUpperCase()}
                            </span>
                          </td>
                          <td>{vehicle.passengers}</td>
                          <td>{vehicle.nextMaintenance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}