import { useCallback, useEffect, useState } from 'react';
import RentalForm from '../components/RentalForm';
import api from '../services/api';
import '../styles/dashboard.css';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function badgeClassFor(status) {
  if (status === 'approved') return 'badge badge-approved';
  if (status === 'rejected') return 'badge badge-rejected';
  return 'badge badge-pending';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return String(dateStr).slice(0, 10);
}

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.get('/rentals/my');
      const data = safeArray(res?.data?.data ?? res?.data);
      setRentals(data);
    } catch (err) {
      setErrorMsg('Não foi possível carregar as solicitações.');
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
          <div className="dashboard-title">Minhas solicitações</div>
          <div className="dashboard-subtitle">
            Crie e acompanhe suas reservas de veículo
          </div>
        </div>
      </div>

      <RentalForm onCreated={loadRentals} />

      {loading && <div className="alert alert-info">Carregando...</div>}
      {!loading && errorMsg && (
        <div className="alert alert-error">{errorMsg}</div>
      )}

      {!loading && !errorMsg && (
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Histórico de solicitações</div>
          </div>

          {rentals.length === 0 ? (
            <div className="card-meta">
              Você ainda não possui solicitações.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Veículo</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id}>
                    <td>
                      <span className={badgeClassFor(rental.status)}>
                        {String(rental.status).toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(rental.startDate)}</td>
                    <td>{formatDate(rental.endDate)}</td>
                    <td>
                      {rental?.vehicle?.model || rental?.vehicle?.licensePlate || '-'}
                    </td>
                    <td>{rental.purpose || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}