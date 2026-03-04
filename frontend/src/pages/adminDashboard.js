import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Bem-vindo, {user?.name}</p>
      <p>Você possui acesso administrativo.</p>
    </div>
  );
}