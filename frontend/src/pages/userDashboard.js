import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Bem-vindo, {user?.name}</p>
      <p>Área do usuário.</p>
    </div>
  );
}