import '../styles/dashboard.css';

function formatTransmission(type) {
  if (type === 'automatic') return 'Automático';
  if (type === 'manual') return 'Manual';
  return type || '—';
}

function formatFuel(type) {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatStatus(status) {
  if (status === 'available') return 'Disponível';
  if (status === 'maintenance') return 'Manutenção';
  if (status === 'rented') return 'Alugado';
  return status || '—';
}

export default function VehicleDetailsModal({ vehicle, onClose, onReserve }) {
  if (!vehicle) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card vehicle-details-shell"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="vehicle-details-modal">
          <div className="vehicle-details-header">
            <div>
              <h2 className="vehicle-details-title">
                {vehicle.brand} {vehicle.model}
              </h2>
              <div className="vehicle-details-plate">
                {vehicle.licensePlate}
              </div>
            </div>

            <button
              type="button"
              className="vehicle-details-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="vehicle-details-body">
            <div className="vehicle-details-grid">
              <div className="vehicle-details-item">
                <span>Status</span>
                <strong>{formatStatus(vehicle.status)}</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Quilometragem</span>
                <strong>{(vehicle.mileage || 0).toLocaleString()} km</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Próxima manutenção</span>
                <strong>{(vehicle.nextMaintenance || 0).toLocaleString()} km</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Passageiros</span>
                <strong>{vehicle.passengers}</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Combustível</span>
                <strong>{formatFuel(vehicle.fuelType)}</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Transmissão</span>
                <strong>{formatTransmission(vehicle.transmissionType)}</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Ano</span>
                <strong>{vehicle.year}</strong>
              </div>

              <div className="vehicle-details-item">
                <span>Cor</span>
                <strong>{vehicle.color}</strong>
              </div>
            </div>
          </div>

          <div className="vehicle-details-actions">
            <button
              type="button"
              className="dashboard-linkBtn"
              onClick={() => onReserve(vehicle)}
            >
              Reservar veículo
            </button>

            <button
              type="button"
              className="vehicle-details-cancel"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}