import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header
        style={{
          background: '#1e293b',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3>Fleet Manager</h3>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>{user?.name}</span>

          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '20px', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}