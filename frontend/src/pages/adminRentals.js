import { useCallback, useEffect, useState } from 'react';
import AdminRentalTable from '../components/AdminRentalTable';
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

export default function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/rentals');
      setRentals(safeArray(res?.data?.data));
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(
          err,
          'Não foi possível carregar as solicitações administrativas.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Solicitações (Admin)</div>
          <div className="dashboard-subtitle">
            Aprove, rejeite e acompanhe o fluxo de reservas
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando...</div>}
      {!loading && errorMsg && (
        <div className="alert alert-error">{errorMsg}</div>
      )}

      {!loading && !errorMsg && (
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Fila administrativa</div>
          </div>

          <AdminRentalTable rentals={rentals} refresh={loadRentals} />
        </div>
      )}
    </div>
  );
}