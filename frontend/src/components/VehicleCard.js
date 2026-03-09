import '../styles/dashboard.css';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

function StatusBadge({ status }) {
  if (!status) return null;

  const map = {
    available: { cls: 'badge-approved', label: 'Disponível' },
    maintenance: { cls: 'badge-rejected', label: 'Manutenção' },
    rented: { cls: 'badge-pending', label: 'Alugado' },
  };

  const { cls, label } = map[status] ?? { cls: 'badge-cancelled', label: status };

  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function VehicleCard({ vehicle, selected, onSelect }) {
  // Maintenance progress bar
  const mileage = vehicle.mileage ?? 0;
  const nextMaint = vehicle.nextMaintenance || 30000;
  const pct = Math.min(Math.round((mileage / nextMaint) * 100), 100);
  let barColor = '#10b981'; // green
  if (pct > 75) barColor = '#f59e0b'; // yellow
  if (pct >= 95) barColor = '#ef4444'; // red

  const transmission =
    vehicle.transmissionType === 'automatic' ? 'Automático' : vehicle.transmissionType === 'manual' ? 'Manual' : vehicle.transmissionType;

  return (
    <div
      className={`vehicle-card${selected ? ' vehicle-card-selected' : ''}`}
      onClick={() => onSelect(vehicle.id)}
    >
      {/* Image */}
      <div className="vehicle-card-imageWrapper">
        <img
          src={vehicle.imageUrl || FALLBACK_IMAGE}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-card-image"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="vehicle-card-status">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* Body */}
      <div className="vehicle-card-body">
        <div className="vehicle-card-title">
          {vehicle.brand} {vehicle.model}
        </div>

        <span className="vehicle-card-plate">{vehicle.licensePlate}</span>

        {/* Feature chips */}
        <div className="vehicle-features">
          <div className="feature-item">
            ⛽ {vehicle.fuelType || 'Flex'}
          </div>
          <div className="feature-item">
            👥 {vehicle.passengers || 5} lug.
          </div>
          <div className="feature-item">
            ⚙️ {transmission || '—'}
          </div>
          <div className="feature-item">
            📅 {vehicle.year}
          </div>
        </div>

        {/* Maintenance bar */}
        <div className="maint-bar-wrapper">
          <div className="maint-bar-label">
            <span>Ciclo de manutenção</span>
            <span>{pct}%</span>
          </div>
          <div className="maint-bar-track">
            <div
              className="maint-bar-fill"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}