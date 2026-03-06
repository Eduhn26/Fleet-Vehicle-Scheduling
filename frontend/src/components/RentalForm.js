import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function RentalForm({ onCreated }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicleId: '',
    startDate: '',
    endDate: '',
    purpose: '',
  });
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadVehicles() {
      setLoadingVehicles(true);
      setErrorMsg('');

      try {
        const res = await api.get('/vehicles');
        if (!alive) return;

        const data = safeArray(res?.data?.data ?? res?.data);
        const availableVehicles = data.filter(
          (vehicle) => String(vehicle?.status || '') === 'available'
        );

        setVehicles(availableVehicles);
      } catch (err) {
        if (!alive) return;
        setErrorMsg('Não foi possível carregar os veículos.');
      } finally {
        if (!alive) return;
        setLoadingVehicles(false);
      }
    }

    loadVehicles();

    return () => {
      alive = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/rentals', {
        vehicleId: form.vehicleId,
        startDate: form.startDate,
        endDate: form.endDate,
        purpose: form.purpose,
      });

      setSuccessMsg('Solicitação criada com sucesso.');
      setForm({
        vehicleId: '',
        startDate: '',
        endDate: '',
        purpose: '',
      });

      if (typeof onCreated === 'function') {
        onCreated();
      }
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        'Não foi possível criar a solicitação.';

      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card card-wide">
      <div className="card-titleRow">
        <div className="card-title">Nova solicitação</div>
      </div>

      {loadingVehicles && (
        <div className="alert alert-info">Carregando veículos...</div>
      )}

      {!loadingVehicles && errorMsg && (
        <div className="alert alert-error">{errorMsg}</div>
      )}

      {!loadingVehicles && !errorMsg && vehicles.length === 0 && (
        <div className="card-meta">
          Nenhum veículo disponível no momento.
        </div>
      )}

      {!loadingVehicles && vehicles.length > 0 && (
        <form className="rental-form" onSubmit={handleSubmit}>
          {successMsg && <div className="alert alert-info">{successMsg}</div>}

          <div className="rental-formGrid">
            <label className="rental-field">
              <span>Veículo</span>
              <select
                name="vehicleId"
                value={form.vehicleId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um veículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} — {vehicle.licensePlate}
                  </option>
                ))}
              </select>
            </label>

            <label className="rental-field">
              <span>Data de início</span>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="rental-field">
              <span>Data de fim</span>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="rental-field rental-fieldWide">
              <span>Motivo</span>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                rows="4"
                placeholder="Descreva o motivo da solicitação"
                required
              />
            </label>
          </div>

          <div className="dashboard-actions">
            <button
              type="submit"
              className="dashboard-linkBtn"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Solicitar veículo'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}