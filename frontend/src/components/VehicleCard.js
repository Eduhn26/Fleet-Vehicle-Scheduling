import '../styles/dashboard.css';

import hrvImg from '../assets/vehicles/honda-hrv.png';
import compassImg from '../assets/vehicles/jeep-compass.png';
import etiosImg from '../assets/vehicles/toyota-etios.png';
import yarisImg from '../assets/vehicles/toyota-yaris.png';
import poloImg from '../assets/vehicles/vw-polo.png';
import defaultImg from '../assets/vehicles/default-car.png';

function StatusBadge({ status }) {
  if (!status) return null;

  const map = {
    available: { cls: 'badge-approved', label: 'Disponível' },
    maintenance: { cls: 'badge-rejected', label: 'Manutenção' },
    rented: { cls: 'badge-pending', label: 'Alugado' },
  };

  const { cls, label } = map[status] ?? {
    cls: 'badge-cancelled',
    label: status,
  };

  return <span className={`badge ${cls}`}>{label}</span>;
}

function getVehicleImage(vehicle) {
  if (vehicle.imageUrl) {
    return vehicle.imageUrl;
  }

  const key = `${vehicle.brand || ''} ${vehicle.model || ''}`
    .toLowerCase()
    .trim();

  const imageMap = {
    'toyota yaris': yarisImg,
    'toyota etios': etiosImg,
    'honda hrv': hrvImg,
    'jeep compass': compassImg,
    'volkswagen polo highline': poloImg,
  };

  return imageMap[key] || defaultImg;
}

export default function VehicleCard({ vehicle, selected, onSelect }) {
  const mileage = vehicle.mileage ?? 0;
  const nextMaint = vehicle.nextMaintenance || 30000;
  const pct = Math.min(Math.round((mileage / nextMaint) * 100), 100);

  let barColor = '#10b981';
  if (pct > 75) barColor = '#f59e0b';
  if (pct >= 95) barColor = '#ef4444';

  const transmission =
    vehicle.transmissionType === 'automatic'
      ? 'Automático'
      : vehicle.transmissionType === 'manual'
        ? 'Manual'
        : vehicle.transmissionType || '—';

  const imageSource = getVehicleImage(vehicle);

  return (
    <div
      className={`vehicle-card${selected ? ' vehicle-card-selected' : ''}`}
      onClick={() => onSelect(vehicle.id)}
    >
      <div className="vehicle-card-imageWrapper">
        <img
          src={imageSource}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-card-image"
          onError={(e) => {
            e.currentTarget.src = defaultImg;
          }}
          loading="lazy"
        />

        <div className="vehicle-card-status">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      <div className="vehicle-card-body">
        <div className="vehicle-card-title">
          {vehicle.brand} {vehicle.model}
        </div>

        <span className="vehicle-card-plate">{vehicle.licensePlate}</span>

        <div className="vehicle-features">
          <div className="feature-item">⛽ {vehicle.fuelType || 'flex'}</div>
          <div className="feature-item">👥 {vehicle.passengers || 5} lug.</div>
          <div className="feature-item">⚙️ {transmission}</div>
          <div className="feature-item">📅 {vehicle.year}</div>
        </div>

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