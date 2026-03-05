import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function UserDashboard() {
  const [myRentals, setMyRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErrorMsg('');

      try {
        // NOTE: baseURL do api.js já aponta para /api, então aqui usamos rotas sem prefixo /api
        const res = await api.get('/rentals/my');
        if (!alive) return;
        setMyRentals(safeArray(res?.data));
      } catch (err) {
        if (!alive) return;
        setErrorMsg('Não foi possível carregar suas solicitações.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const recent = useMemo(() => safeArray(myRentals).slice(0, 5), [myRentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">Dashboard</div>
          <div className="dashboard-subtitle">Suas solicitações recentes</div>
        </div>

        <div className="dashboard-actions">
          <Link className="dashboard-linkBtn" to="/rentals">
            Ver todas
          </Link>
        </div>
      </div>

      {loading && <div className="alert alert-info">Carregando…</div>}
      {!loading && errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      {!loading && !errorMsg && (
        <div className="card card-wide">
          <div className="card-titleRow">
            <div className="card-title">Últimas solicitações</div>
          </div>

          {recent.length === 0 ? (
            <div className="card-meta">Você ainda não possui solicitações.</div>
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
                {recent.map((r) => (
                  <tr key={r?._id || `${r?.vehicleId}-${r?.startDate}-${r?.endDate}`}>
                    <td>
                      <span className={badgeClassFor(r?.status)}>
                        {String(r?.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(r?.startDate)}</td>
                    <td>{formatDate(r?.endDate)}</td>
                    <td>{r?.vehicle?.model || r?.vehicle?.name || r?.vehicleId || '-'}</td>
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