import { useState } from 'react';
import api from '../services/api';

function AdminRentalTable({ rentals, refresh }) {
  const [loadingId, setLoadingId] = useState(null);

  // NOTE: protege o render inicial enquanto a prop ainda não foi populada pelo fetch.
  const safeRentals = Array.isArray(rentals) ? rentals : [];

  const getApiErrorMessage = (err, fallbackMessage) => {
    const apiMessage = err?.response?.data?.error?.message;

    if (apiMessage) {
      return apiMessage;
    }

    return fallbackMessage;
  };

  const approve = async (id) => {
    // NOTE: confirmação reduz risco de decisão administrativa acidental.
    const confirmed = window.confirm(
      'Tem certeza que deseja APROVAR esta solicitação?'
    );

    if (!confirmed) return;

    try {
      setLoadingId(id);

      await api.patch(`/rentals/${id}/approve`, {
        adminNotes: 'Aprovado pelo administrador',
      });

      await refresh();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erro ao aprovar solicitação.'));
    } finally {
      setLoadingId(null);
    }
  };

  const reject = async (id) => {
    // NOTE: rejeição encerra o fluxo atual da request; exige confirmação explícita.
    const confirmed = window.confirm(
      'Tem certeza que deseja REJEITAR esta solicitação?'
    );

    if (!confirmed) return;

    try {
      setLoadingId(id);

      await api.patch(`/rentals/${id}/reject`, {
        adminNotes: 'Rejeitado pelo administrador',
      });

      await refresh();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erro ao rejeitar solicitação.'));
    } finally {
      setLoadingId(null);
    }
  };

  if (safeRentals.length === 0) {
    return (
      <div className="card-meta">
        Nenhuma solicitação encontrada.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Veículo</th>
            <th>Período</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {safeRentals.map((rental) => {
            const isLoading = loadingId === rental.id;

            return (
              <tr key={rental.id}>
                <td>{rental.user?.name || 'Usuário não informado'}</td>
                <td>{rental.vehicle?.licensePlate || 'Veículo não informado'}</td>
                <td>
                  {rental.startDate} → {rental.endDate}
                </td>
                <td>{rental.status}</td>

                <td>
                  {rental.status === 'pending' ? (
                    <>
                      <button
                        className="dashboard-linkBtn"
                        onClick={() => approve(rental.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processando...' : 'Aprovar'}
                      </button>

                      <button
                        className="dashboard-linkBtn"
                        onClick={() => reject(rental.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processando...' : 'Rejeitar'}
                      </button>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminRentalTable;