import { useEffect, useRef, useState } from 'react';
import '../styles/dashboard.css';

import {
  FiMoreVertical,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiActivity,
} from 'react-icons/fi';
import { BsFuelPump } from 'react-icons/bs';
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
  if (vehicle.imageUrl) return vehicle.imageUrl;

  const key = `${vehicle.brand || ''} ${vehicle.model || ''}`.toLowerCase().trim();

  const imageMap = {
    'toyota yaris': yarisImg,
    'toyota etios': etiosImg,
    'honda hrv': hrvImg,
    'jeep compass': compassImg,
    'volkswagen polo highline': poloImg,
  };

  return imageMap[key] || defaultImg;
}

function getMileageTone(mileage, nextMaintenance) {
  const current = mileage ?? 0;
  const target = nextMaintenance || 30000;

  if (current >= target) {
    return { cls: 'vehicle-mileageBadge-danger', label: `${current.toLocaleString()} km` };
  }

  const ratio = current / target;

  if (ratio >= 0.85) {
    return { cls: 'vehicle-mileageBadge-warning', label: `${current.toLocaleString()} km` };
  }

  return { cls: 'vehicle-mileageBadge-normal', label: `${current.toLocaleString()} km` };
}

function getMaintenanceBarColor(percentage) {
  if (percentage >= 95) return '#dc2626';
  if (percentage > 75) return '#d97706';
  return '#059669';
}

export default function VehicleCard({
  vehicle,
  selected,
  onSelect,
  onSendMaintenance,
  onCompleteMaintenance,
  onDeleteVehicle,
}) {
  const { user } = useAuth();
  const isAdmin = String(user?.role || '').trim() === 'admin';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const mileage = vehicle.mileage ?? 0;
  const nextMaint = vehicle.nextMaintenance || 30000;
  const pct = Math.min(Math.round((mileage / nextMaint) * 100), 100);
  const maintenanceBarColor = getMaintenanceBarColor(pct);

  const transmission =
    vehicle.transmissionType === 'automatic'
      ? 'Automático'
      : vehicle.transmissionType === 'manual'
        ? 'Manual'
        : vehicle.transmissionType || '—';

  const fuelType = vehicle.fuelType
    ? vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)
    : 'Flex';

  const imageSource = getVehicleImage(vehicle);
  const mileageTone = getMileageTone(vehicle.mileage, vehicle.nextMaintenance);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleViewDetails = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (typeof onSelect === 'function') onSelect(vehicle.id);
  };

  const handleSendMaintenance = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (typeof onSendMaintenance === 'function') onSendMaintenance(vehicle);
  };

  const handleCompleteMaintenance = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (typeof onCompleteMaintenance === 'function') onCompleteMaintenance(vehicle);
  };

  const handleDeleteVehicle = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (typeof onDeleteVehicle === 'function') onDeleteVehicle(vehicle);
  };

  const handleCardSelect = () => {
    if (typeof onSelect === 'function') onSelect(vehicle.id);
  };

  return (
    <div
      className={`vehicle-card${selected ? ' vehicle-card-selected' : ''}`}
      onClick={handleCardSelect}
    >
      <div className="vehicle-card-header">
        <StatusBadge status={vehicle.status} />

        {isAdmin && (
          <div className="vehicle-card-menuWrapper" ref={menuRef}>
            <button
              type="button"
              className="vehicle-card-moreBtn"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((current) => !current);
              }}
              aria-label="Abrir ações do veículo"
            >
              <FiMoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="vehicle-card-menu">
                <button type="button" onClick={handleViewDetails}>
                  Reservar / ver detalhes
                </button>

                {vehicle.status === 'available' && (
                  <button type="button" onClick={handleSendMaintenance}>
                    Enviar manutenção
                  </button>
                )}

                {vehicle.status === 'maintenance' && (
                  <button type="button" onClick={handleCompleteMaintenance}>
                    Finalizar manutenção
                  </button>
                )}

                <button type="button" className="danger" onClick={handleDeleteVehicle}>
                  Excluir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vehicle-card-imageWrapper">
        <img
          src={imageSource}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-card-image"
          onError={(event) => {
            event.currentTarget.src = defaultImg;
          }}
          loading="lazy"
        />

        <div className="vehicle-card-hoverOverlay">
          <span className="vehicle-card-hoverCta">Reservar veículo</span>
        </div>
      </div>

      <div className="vehicle-card-body">
        <div className="vehicle-card-title">
          {vehicle.brand} {vehicle.model}
        </div>

        <span className="vehicle-card-plate">{vehicle.licensePlate}</span>

        <div className={`vehicle-mileageBadge ${mileageTone.cls}`}>
          <FiActivity className="feature-icon" />
          {mileageTone.label}
        </div>

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

        {isAdmin && (
          <div className="maint-bar-wrapper">
            <div className="maint-bar-label">
              <span>Ciclo de Manutenção</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{pct}%</span>
            </div>

            <div className="maint-bar-track">
              <div
                className="maint-bar-fill"
                style={{
                  width: `${pct}%`,
                  backgroundColor: maintenanceBarColor,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}