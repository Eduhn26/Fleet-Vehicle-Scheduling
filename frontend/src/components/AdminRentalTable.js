import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/dashboard.css";

function badgeClass(status) {
  if (status === "approved") return "badge badge-approved";
  if (status === "rejected") return "badge badge-rejected";
  if (status === "cancelled") return "badge badge-cancelled";
  return "badge badge-pending";
}

export default function AdminRentalTable() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  async function loadRentals() {
    setLoading(true);

    try {
      const url = statusFilter
        ? `/rentals?status=${statusFilter}`
        : "/rentals";

      const res = await api.get(url);
      setRentals(res.data.data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRentals();
  }, [statusFilter]);

  async function approve(id) {
    await api.patch(`/rentals/${id}/approve`);
    loadRentals();
  }

  async function reject(id) {
    await api.patch(`/rentals/${id}/reject`);
    loadRentals();
  }

  if (loading) {
    return <div className="alert alert-info">Carregando solicitações...</div>;
  }

  return (
    <div className="card card-wide">
      <div className="card-titleRow">
        <div className="card-title">Solicitações</div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="dashboard-linkBtn"
            onClick={() => setStatusFilter("")}
          >
            Todas
          </button>

          <button
            className="dashboard-linkBtn"
            onClick={() => setStatusFilter("pending")}
          >
            Pendentes
          </button>

          <button
            className="dashboard-linkBtn"
            onClick={() => setStatusFilter("approved")}
          >
            Aprovadas
          </button>

          <button
            className="dashboard-linkBtn"
            onClick={() => setStatusFilter("rejected")}
          >
            Rejeitadas
          </button>

          <button
            className="dashboard-linkBtn"
            onClick={() => setStatusFilter("cancelled")}
          >
            Canceladas
          </button>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Veículo</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {rentals.map((r) => (
            <tr key={r.id}>
              <td>{r.user?.name}</td>
              <td>{r.vehicle?.model}</td>
              <td>{r.startDate}</td>
              <td>{r.endDate}</td>

              <td>
                <span className={badgeClass(r.status)}>
                  {r.status.toUpperCase()}
                </span>
              </td>

              <td>
                {r.status === "pending" && (
                  <>
                    <button
                      className="dashboard-linkBtn"
                      onClick={() => approve(r.id)}
                    >
                      Aprovar
                    </button>

                    <button
                      className="dashboard-linkBtn"
                      onClick={() => reject(r.id)}
                    >
                      Rejeitar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}