import '../styles/dashboard.css';

import { FiMoreVertical, FiUsers, FiCalendar, FiSettings } from 'react-icons/fi';
import { BsFuelPump } from 'react-icons/bs';

// Importando o contexto para pegar os dados do usuário logado
import { useAuth } from '../context/AuthContext';

import hrvImg from '../assets/vehicles/honda-hrv.png';
import compassImg from '../assets/vehicles/jeep-compass.png';
import etiosImg from '../assets/vehicles/toyota-etios.png';
import yarisImg from '../assets/vehicles/toyota-yaris.png';
import poloImg from '../assets/vehicles/vw-polo.png';
import defaultImg from '../assets/vehicles/default-car.png';

function StatusBadge({ status }) {
  if (!status) return null;

  const map = {
    available: { cls: 'badge-approved', label: 'DISPONÍVEL' },
    maintenance: { cls: 'badge-rejected', label: 'MANUTENÇÃO' },
    rented: { cls: 'badge-pending', label: 'ALUGADO' },
  };

  const { cls, label } = map[status] ?? {
    cls: 'badge-cancelled',
    label: status.toUpperCase(),
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
  // Pegando o usuário do contexto e verificando se é admin
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim() === 'admin';

  const mileage = vehicle.mileage ?? 0;
  const nextMaint = vehicle.nextMaintenance || 30000;
  const pct = Math.min(Math.round((mileage / nextMaint) * 100), 100);

  const transmission =
    vehicle.transmissionType === 'automatic'
      ? 'Automático'
      : vehicle.transmissionType === 'manual'
        ? 'Manual'
        : vehicle.transmissionType || '—';

  const fuelType = vehicle.fuelType ? vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1) : 'Flex';
  const imageSource = getVehicleImage(vehicle);

  return (
    <div
      className={`vehicle-card${selected ? ' vehicle-card-selected' : ''}`}
      onClick={() => onSelect(vehicle.id)}
    >
      <div className="vehicle-card-header">
        <StatusBadge status={vehicle.status} />
        <button className="vehicle-card-moreBtn" onClick={(e) => e.stopPropagation()}>
          <FiMoreVertical size={20} />
        </button>
      </div>

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
      </div>

      <div className="vehicle-card-body">
        <div className="vehicle-card-title">
          {vehicle.brand} {vehicle.model}
        </div>
        <span className="vehicle-card-plate">{vehicle.licensePlate}</span>

        <div className="vehicle-features">
          <div className="feature-item">
            <BsFuelPump className="feature-icon" />
            {fuelType}
          </div>
          <div className="feature-item">
            <FiUsers className="feature-icon" />
            {vehicle.passengers || 5} Lugares
          </div>
          <div className="feature-item">
            <FiSettings className="feature-icon" />
            {transmission}
          </div>
          <div className="feature-item">
            <FiCalendar className="feature-icon" />
            {vehicle.year}
          </div>
        </div>

        {/* Renderiza a barra de manutenção apenas se for admin */}
        {isAdmin && (
          <div className="maint-bar-wrapper">
            <div className="maint-bar-label">
              <span>Ciclo de Manutenção:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{pct}%</span>
            </div>
            <div className="maint-bar-track">
              <div
                className="maint-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <button 
          className="vehicle-card-actionBtn"
          style={{ marginTop: isAdmin ? '0' : 'auto' }} /* Empurra o botão pro fundo se a barra não existir */
          onClick={(e) => {
            e.stopPropagation();
            onSelect(vehicle.id);
          }}
        >
          DETALHES DO VEÍCULO
        </button>
      </div>
    </div>
  );
}