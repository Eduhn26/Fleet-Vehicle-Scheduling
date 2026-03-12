import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

const initialForm = {
  brand: '',
  model: '',
  year: '',
  licensePlate: '',
  color: '',
  mileage: '0',
  status: 'available',
  transmissionType: 'automatic',
  fuelType: 'flex',
  passengers: '5',
  nextMaintenance: '',
  lastMaintenanceMileage: '0',
  imageUrl: '',
};

export default function AddVehicleModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialForm);
    setErrorMsg('');
    setActionMsg('');
    setSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setActionMsg('');

    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        licensePlate: form.licensePlate.trim(),
        color: form.color.trim(),
        mileage: Number(form.mileage),
        status: form.status,
        transmissionType: form.transmissionType,
        fuelType: form.fuelType,
        passengers: Number(form.passengers),
        nextMaintenance: Number(form.nextMaintenance),
        lastMaintenanceMileage: Number(form.lastMaintenanceMileage),
        imageUrl: form.imageUrl.trim(),
      };

      await api.post('/vehicles', payload);

      setActionMsg('Veículo cadastrado com sucesso.');

      if (typeof onCreated === 'function') {
        await onCreated();
      }
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível cadastrar o veículo.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content-card rental-modal return-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rental-modalHeader">
          <div>
            <h2 className="rental-modalTitle">Novo veículo</h2>
            <p className="rental-modalSubtitle">
              Cadastre um novo veículo na frota administrativa.
            </p>
          </div>

          <button
            type="button"
            className="rental-modalClose"
            onClick={handleClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="rental-modalBody">
          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
          {actionMsg && <div className="alert alert-info">{actionMsg}</div>}

          <form className="return-modalForm" onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-title">Dados principais</div>

              <div className="rental-formGrid" style={{ marginTop: 16 }}>
                <label className="rental-field">
                  <span>Marca</span>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Modelo</span>
                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Ano</span>
                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    disabled={submitting}
                    min="1900"
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Placa</span>
                  <input
                    type="text"
                    name="licensePlate"
                    value={form.licensePlate}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Cor</span>
                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Passageiros</span>
                  <input
                    type="number"
                    name="passengers"
                    value={form.passengers}
                    onChange={handleChange}
                    disabled={submitting}
                    min="1"
                    max="15"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Operação e manutenção</div>

              <div className="rental-formGrid" style={{ marginTop: 16 }}>
                <label className="rental-field">
                  <span>Quilometragem inicial</span>
                  <input
                    type="number"
                    name="mileage"
                    value={form.mileage}
                    onChange={handleChange}
                    disabled={submitting}
                    min="0"
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Última manutenção</span>
                  <input
                    type="number"
                    name="lastMaintenanceMileage"
                    value={form.lastMaintenanceMileage}
                    onChange={handleChange}
                    disabled={submitting}
                    min="0"
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Próxima manutenção</span>
                  <input
                    type="number"
                    name="nextMaintenance"
                    value={form.nextMaintenance}
                    onChange={handleChange}
                    disabled={submitting}
                    min="0"
                    required
                  />
                </label>

                <label className="rental-field">
                  <span>Status inicial</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    <option value="available">Disponível</option>
                    <option value="maintenance">Manutenção</option>
                  </select>
                </label>

                <label className="rental-field">
                  <span>Transmissão</span>
                  <select
                    name="transmissionType"
                    value={form.transmissionType}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="automatic">Automático</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>

                <label className="rental-field">
                  <span>Combustível</span>
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="gasoline">Gasolina</option>
                    <option value="ethanol">Etanol</option>
                    <option value="flex">Flex</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Elétrico</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </label>

                <label className="rental-field rental-fieldWide">
                  <span>Imagem (URL opcional)</span>
                  <input
                    type="text"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    disabled={submitting}
                    placeholder="https://..."
                  />
                </label>
              </div>
            </div>

            <div className="return-modalActions">
              <button
                type="submit"
                className="dashboard-linkBtn"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Cadastrar veículo'}
              </button>

              <button
                type="button"
                className="rental-cancelBtn"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}