import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/rentals/my');
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setRentals(data);
      } catch (err) {
        setErrorMsg('Não foi possível carregar as solicitações.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Minhas solicitações</div>
          <div className="dashboard-subtitle">
            Lista completa das suas reservas
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando...</div>}
      {!loading && errorMsg && (
        <div className="alert alert-error">{errorMsg}</div>
      )}

      {!loading && !errorMsg && (
        <div className="card card-wide">
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
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={r.id}>
                    <td>{String(r.status).toUpperCase()}</td>
                    <td>{String(r.startDate).slice(0, 10)}</td>
                    <td>{String(r.endDate).slice(0, 10)}</td>
                    <td>
                      {r?.vehicle?.model || r?.vehicle?.licensePlate || '-'}
                    </td>
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