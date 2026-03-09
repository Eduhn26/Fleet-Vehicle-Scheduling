import VehicleCard from "./VehicleCard";

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