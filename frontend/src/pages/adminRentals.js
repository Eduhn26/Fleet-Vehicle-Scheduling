import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AdminRentalTable from '../components/AdminRentalTable';
import '../styles/dashboard.css';

// NOTE: Admin rental management page for reviewing and processing reservation workflows.
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function countByStatus(items, status) {
  return safeArray(items).filter((item) => item?.status === status).length;
}

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
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
      setErrorMsg(getApiErrorMessage(err, 'Não foi possível carregar as solicitações.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  const pendingCount = useMemo(() => countByStatus(rentals, 'pending'), [rentals]);
  const returnPendingCount = useMemo(
    () => countByStatus(rentals, 'return_pending'),
    [rentals]
  );
  const completedCount = useMemo(() => countByStatus(rentals, 'completed'), [rentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Solicitações</div>
          <div className="dashboard-subtitle">
            Fila administrativa para aprovar, rejeitar e concluir devoluções.
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando solicitações...</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <>
          <div className="dashboard-grid" style={{ marginBottom: 16 }}>
            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Pendentes</div>
                <span className="badge badge-pending">Aprovação</span>
              </div>
              <div className="card-kpi">{pendingCount}</div>
              <div className="card-meta">Solicitações aguardando decisão inicial.</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Devoluções</div>
                <span className="badge badge-pending">Retorno</span>
              </div>
              <div className="card-kpi">{returnPendingCount}</div>
              <div className="card-meta">Reservas aguardando confirmação de devolução.</div>
            </div>

            <div className="card">
              <div className="card-titleRow">
                <div className="card-title">Concluídas</div>
                <span className="badge badge-approved">Finalizado</span>
              </div>
              <div className="card-kpi">{completedCount}</div>
              <div className="card-meta">Reservas encerradas com devolução confirmada.</div>
            </div>
          </div>

          <AdminRentalTable rentals={rentals} onActionComplete={loadRentals} />
        </>
      )}
    </div>
  );
}