import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminRentalTable from '../components/AdminRentalTable';
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

  const loadRentals = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/rentals');
      const data = safeArray(res?.data?.data);

      setRentals(data);
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Não foi possível carregar as solicitações.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Solicitações</div>
          <div className="dashboard-subtitle">
            Fila administrativa para aprovar ou rejeitar reservas.
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando solicitações...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <AdminRentalTable rentals={rentals} onActionComplete={loadRentals} />
      )}
    </div>
  );
}