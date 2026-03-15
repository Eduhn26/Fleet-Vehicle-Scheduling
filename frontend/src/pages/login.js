import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

// NOTE: Authentication entry page for starting a user or admin session.
const safeParseUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const extractErrorMessage = (err) => {
  const fromApi = err?.response?.data?.error?.message;
  if (fromApi) return String(fromApi);

  const generic = err?.message;
  if (generic) return String(generic);

  return 'Falha ao realizar login. Tente novamente.';
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);

      const user = safeParseUser();
      const role = String(user?.role || '').trim();

      if (role === 'admin') return navigate('/admin', { replace: true });
      return navigate('/user', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <header className="login-header">
          <div className="login-badge">FM</div>
          <h1 className="login-title">Fleet Manager</h1>
          <p className="login-subtitle">Acesse sua conta para continuar.</p>
        </header>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="login-field">
          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="seuemail@empresa.com"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </div>

        <button className="login-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="login-footer">
          Problemas para acessar? Fale com o administrador do sistema.
        </p>
      </form>
    </div>
  );
}