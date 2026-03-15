import VehicleCard from "./VehicleCard";

// NOTE: VehicleGrid keeps list rendering isolated from selection logic.
export default function VehicleGrid({ vehicles, selectedId, onSelect }) {
  if (!vehicles?.length) {
    return <div className="card-meta">Nenhum veículo disponível.</div>;
  }

  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          selected={vehicle.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}