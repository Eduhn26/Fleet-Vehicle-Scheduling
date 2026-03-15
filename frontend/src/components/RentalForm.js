import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";
import VehicleGrid from "./VehicleGrid";

// NOTE: User reservation form that creates rental requests from available vehicles.
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

const initialForm = {
  vehicleId: "",
  startDate: "",
  endDate: "",
  purpose: "",
};

export default function RentalForm({ onCreated }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    let alive = true;

    async function loadVehicles() {
      setLoadingVehicles(true);

      try {
        const res = await api.get("/vehicles");

        if (!alive) return;

        const data = safeArray(res?.data?.data ?? res?.data);
        setVehicles(data);
      } catch (err) {
        if (!alive) return;

        setFeedback({
          type: "error",
          message: getApiErrorMessage(
            err,
            "Não foi possível carregar os veículos disponíveis."
          ),
        });
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

  const handleSelectVehicle = (vehicleId) => {
    setForm((current) => ({
      ...current,
      vehicleId,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await api.post("/rentals", form);

      setForm(initialForm);

      setFeedback({
        type: "info",
        message: "Solicitação enviada com sucesso.",
      });

      await onCreated();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(
          err,
          "Não foi possível criar a solicitação."
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle?.status === "available"
  );

  return (
    <form className="rental-form" onSubmit={handleSubmit}>
      {feedback.message && (
        <div
          className={`alert ${
            feedback.type === "error" ? "alert-error" : "alert-info"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <div className="card-titleRow">
          <div className="card-title">Escolha um veículo</div>
        </div>

        {loadingVehicles ? (
          <div className="card-meta">Carregando veículos...</div>
        ) : (
          <VehicleGrid
            vehicles={availableVehicles}
            selectedId={form.vehicleId}
            onSelect={handleSelectVehicle}
          />
        )}
      </div>

      <div className="rental-formGrid">
        <label className="rental-field">
          <span>Data inicial</span>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </label>

        <label className="rental-field">
          <span>Data final</span>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </label>

        <label className="rental-field rental-fieldWide">
          <span>Motivo da solicitação</span>
          <textarea
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            placeholder="Ex.: visita técnica, reunião externa..."
            disabled={submitting}
            required
          />
        </label>
      </div>

      <div className="dashboard-actions">
        <button
          type="submit"
          className="dashboard-linkBtn"
          disabled={submitting || !form.vehicleId}
        >
          {submitting ? "Enviando..." : "Criar solicitação"}
        </button>
      </div>
    </form>
  );
}